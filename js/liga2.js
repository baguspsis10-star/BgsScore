// LIGA 2 INDONESIA / PEGADAIAN CHAMPIONSHIP 2026-27
// Sumber resmi: API iLeague melalui server Liga 2 milik aplikasi.

const LIGA2_API_BASE = 'https://api-liga-2-indonesia--4piliga2.replit.app/api';
const LIGA2_LEAGUE_ID = 'idn.2';
const LIGA2_COMPETITION_NAME = 'Pegadaian Championship 2026-27';
const LIGA2_COMPETITION_SLUG = 'PEGADAIAN_CHAMPIONSHIP_2026-27';
let liga2SnapshotCache = null;
let liga2SnapshotCacheAt = 0;

function isLiga2LeagueId(leagueId) {
  return ['idn.2', 'indonesia.2', 'liga2'].includes(String(leagueId || '').toLowerCase());
}

function liga2TeamId(team) {
  const source = team?.sourceUrl || team?.name || 'team';
  return `liga2-${String(source).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function normalizeLiga2DateKey(value) {
  const match = String(value || '').match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  return match ? `${match[1]}${match[2]}${match[3]}` : '';
}

function liga2DateTime(match) {
  const date = String(match?.date || '').slice(0, 10);
  const kickoff = String(match?.kickoff || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!date) return new Date().toISOString();
  if (!kickoff) return `${date}T12:00:00+07:00`;
  return `${date}T${kickoff[1].padStart(2, '0')}:${kickoff[2]}:00+07:00`;
}

function liga2Status(status) {
  const value = String(status || '').toLowerCase();
  if (['live', 'in', 'ht', 'halftime'].includes(value)) return 'in';
  if (['finished', 'ft', 'post', 'completed'].includes(value)) return 'post';
  return 'pre';
}

function mapLiga2Match(rawMatch, fallbackStatus = '') {
  if (!rawMatch || typeof rawMatch !== 'object') return null;

  const home = rawMatch.homeTeam || {};
  const away = rawMatch.awayTeam || {};
  const state = liga2Status(rawMatch.status || fallbackStatus);
  const date = liga2DateTime(rawMatch);
  const homeName = home.name || 'Home Team';
  const awayName = away.name || 'Away Team';
  const eventId = rawMatch.id || `${normalizeLiga2DateKey(rawMatch.date)}-${homeName}-${awayName}`;
  const statusLabel = state === 'in'
    ? (rawMatch.minute ? `${rawMatch.minute}'` : 'LIVE')
    : state === 'post' ? 'FT' : (rawMatch.kickoff || 'SCHEDULED');
  const status = {
    type: {
      state,
      completed: state === 'post',
      description: statusLabel,
      shortDetail: statusLabel
    },
    period: state === 'in' ? 1 : 0
  };

  const team = (raw, name) => ({
    id: liga2TeamId(raw),
    displayName: name,
    shortDisplayName: name,
    logo: raw.logoUrl || ''
  });

  return {
    id: eventId,
    date,
    name: `${homeName} vs ${awayName}`,
    shortName: `${homeName.slice(0, 3)} vs ${awayName.slice(0, 3)}`,
    leagueName: LIGA2_COMPETITION_NAME,
    leagueId: LIGA2_LEAGUE_ID,
    leagueFlag: '🇮🇩',
    leagueLogo: '',
    sourceUrl: rawMatch.sourceUrl || '',
    status,
    liga2Raw: rawMatch,
    competitions: [{
      id: eventId,
      date,
      status,
      venue: { fullName: rawMatch.stadium || '' },
      competitors: [{
        homeAway: 'home',
        score: rawMatch.homeScore === null || rawMatch.homeScore === undefined ? '-' : String(rawMatch.homeScore),
        team: team(home, homeName)
      }, {
        homeAway: 'away',
        score: rawMatch.awayScore === null || rawMatch.awayScore === undefined ? '-' : String(rawMatch.awayScore),
        team: team(away, awayName)
      }]
    }]
  };
}

async function fetchLiga2Api(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 9000);
  try {
    const response = await fetch(`${LIGA2_API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json', ...(options.headers || {}) }
    });
    if (!response.ok) throw new Error(`Liga 2 API HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchLiga2Snapshot(force = false) {
  const cacheFresh = liga2SnapshotCache && Date.now() - liga2SnapshotCacheAt < 15000;
  if (!force && cacheFresh) return liga2SnapshotCache;

  let payload = null;
  try {
    payload = await fetchLiga2Api('/liga2Snapshot');
  } catch (snapshotError) {
    // Versi server yang sedang aktif dapat belum memiliki route snapshot.
    // Gunakan endpoint resmi per kategori sebagai fallback yang setara.
    const results = await Promise.allSettled([
      fetchLiga2Api('/liga2/matches?status=upcoming&limit=100'),
      fetchLiga2Api('/liga2/matches?status=live'),
      fetchLiga2Api('/liga2/matches?status=finished'),
      fetchLiga2Api('/liga2/standings'),
      fetchLiga2Api('/liga2/top-scorers')
    ]);
    const read = (index) => results[index].status === 'fulfilled' ? results[index].value : {};
    payload = {
      upcoming: read(0).matches || [],
      live: read(1).matches || [],
      finished: read(2).matches || [],
      standings: read(3),
      topScorers: read(4).topScorers || [],
      competition: read(0).competition || read(3).competition || {
        name: LIGA2_COMPETITION_NAME,
        slug: LIGA2_COMPETITION_SLUG
      },
      updatedAt: read(0).updatedAt || new Date().toISOString()
    };
  }

  const matches = payload.matches || {};
  const normalized = {
    upcoming: payload.upcoming || matches.upcoming || [],
    live: payload.live || matches.live || [],
    finished: payload.finished || matches.finished || [],
    standings: payload.standings || { groups: payload.groups || [] },
    topScorers: payload.topScorers || payload.top_scorers || [],
    competition: payload.competition || {
      name: LIGA2_COMPETITION_NAME,
      slug: LIGA2_COMPETITION_SLUG
    },
    updatedAt: payload.updatedAt || new Date().toISOString()
  };

  liga2SnapshotCache = normalized;
  liga2SnapshotCacheAt = Date.now();
  return normalized;
}

async function fetchLiga2EventsForDate(dateFilter = '') {
  const snapshot = await fetchLiga2Snapshot();
  const allRaw = [...snapshot.live, ...snapshot.upcoming, ...snapshot.finished];
  const unique = new Map();
  allRaw.forEach(raw => {
    if (raw?.id) unique.set(String(raw.id), raw);
  });

  return Array.from(unique.values())
    .map(raw => mapLiga2Match(raw))
    .filter(Boolean)
    .filter(event => !dateFilter || normalizeLiga2DateKey(event.liga2Raw?.date) === normalizeLiga2DateKey(dateFilter));
}

async function fetchLiga2Standings() {
  const snapshot = await fetchLiga2Snapshot();
  const groups = snapshot.standings?.groups || [];
  return groups.map(group => ({
    name: group.group || group.name || 'Grup',
    entries: (group.standings || group.entries || []).map(row => ({
      position: Number(row.position) || 0,
      team: {
        id: liga2TeamId(row.team),
        displayName: row.team?.name || 'Klub',
        shortDisplayName: row.team?.name || 'Klub',
        logo: row.team?.logoUrl || '',
        sourceUrl: row.team?.sourceUrl || ''
      },
      stats: [
        { name: 'gamesPlayed', value: Number(row.played) || 0 },
        { name: 'wins', value: Number(row.wins) || 0 },
        { name: 'ties', value: Number(row.draws) || 0 },
        { name: 'losses', value: Number(row.losses) || 0 },
        { name: 'goalsFor', value: Number(row.goalsFor) || 0 },
        { name: 'goalsAgainst', value: Number(row.goalsAgainst) || 0 },
        { name: 'goalDifference', value: Number(row.goalDifference) || 0 },
        { name: 'points', value: Number(row.points) || 0 }
      ],
      form: row.form || [],
      nextMatch: row.nextMatch || ''
    }))
  }));
}

async function fetchLiga2TopScorers() {
  const snapshot = await fetchLiga2Snapshot();
  return snapshot.topScorers || [];
}

async function fetchLiga2MatchDetailSummary(cachedEvent, fallbackLeagueName = LIGA2_COMPETITION_NAME) {
  const sourceUrl = cachedEvent?.sourceUrl || cachedEvent?.liga2Raw?.sourceUrl;
  if (!sourceUrl) return null;

  const detail = await fetchLiga2Api(`/liga2/matches/detail?url=${encodeURIComponent(sourceUrl)}`);
  const match = detail.match || cachedEvent.liga2Raw || {};
  const mapped = mapLiga2Match(match, match.status);
  if (!mapped) return null;

  const competition = mapped.competitions[0];
  return {
    header: {
      id: mapped.id,
      date: mapped.date,
      league: { slug: LIGA2_LEAGUE_ID, name: fallbackLeagueName },
      competitions: [competition]
    },
    leagues: [{ slug: LIGA2_LEAGUE_ID, name: fallbackLeagueName }],
    details: detail.timeline || [],
    headToHead: [],
    gameInfo: {
      venue: { fullName: detail.location || match.stadium || '' },
      officials: (detail.officials || []).map(official => ({
        displayName: official.name || official.displayName || String(official),
        position: { name: 'Referee' }
      }))
    },
    boxscore: { teams: [] },
    rosters: [],
    liga2Detail: detail
  };
}

function renderLiga2TopScorers(container, rows) {
  if (!rows.length) {
    container.innerHTML = `
      <div class="text-center py-10 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
        Data top scorer Liga 2 belum tersedia.
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-2">
      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 class="font-black text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <i class="fa-solid fa-futbol"></i> Top Scorer
        </h3>
        <span class="text-[9px] text-slate-400">Pegadaian Championship 2026-27</span>
      </div>
      <div class="space-y-0.5">
        ${rows.map((row, index) => {
          const photo = row.playerPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.playerName || 'Pemain')}&background=15803d&color=fff&bold=true&rounded=true`;
          return `
            <div class="flex items-center justify-between p-2 rounded-xl border-b border-slate-800/40 last:border-b-0">
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <span class="font-black text-xs w-4 text-center ${index === 0 ? 'text-amber-400' : 'text-slate-500'}">${row.rank || index + 1}</span>
                <img src="${photo}" loading="lazy" class="w-9 h-9 rounded-full object-cover bg-slate-950 border border-slate-800" alt="" onerror="this.src='${PLAIN_PERSON_HEADSHOT}'">
                <div class="min-w-0">
                  <div class="font-bold text-white text-xs truncate">${row.playerName || 'Pemain'}</div>
                  <div class="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                    <img src="${row.clubLogoUrl || PLAIN_SHIELD_LOGO}" class="w-3 h-3 object-contain" alt="">
                    <span class="truncate">${row.clubName || 'Klub'}</span>
                  </div>
                </div>
              </div>
              <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-black text-xs">${row.goals ?? 0} gol</span>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}