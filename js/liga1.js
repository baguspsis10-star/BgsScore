// LIGA 1 INDONESIA / BRI SUPER LEAGUE 2026-27
// Sumber resmi: API iLeague melalui backend Vercel ileague-api.

const LIGA1_OFFICIAL_API_BASE = 'https://ileague-api.vercel.app/api';
const LIGA1_OFFICIAL_ID = 'idn.1';
const LIGA1_OFFICIAL_COMPETITION_ID = 'BRI_SUPER_LEAGUE_2026-27';
const LIGA1_OFFICIAL_COMPETITION_NAME = 'BRI SUPER LEAGUE 2026-27';
let liga1OfficialSnapshotCache = null;
let liga1OfficialSnapshotCacheAt = 0;
let liga1OfficialClubLogoMap = {};

function isLiga1LeagueId(leagueId) {
  return ['idn.1', 'indonesia.1', 'liga1'].includes(
    String(leagueId || '').toLowerCase()
  );
}

function normalizeLiga1TeamName(name) {
  return String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function getLiga1TeamLogo(teamName, providedLogo = '') {
  if (typeof providedLogo === 'string' && /^https?:\/\//i.test(providedLogo)) {
    return providedLogo;
  }

  const clubLogo = liga1OfficialClubLogoMap[normalizeLiga1TeamName(teamName)];
  if (clubLogo) return clubLogo;

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    teamName || 'Team'
  )}&background=991b1b&color=fff&bold=true&rounded=true`;
}

function liga1TeamId(team = {}) {
  const source = team.id || team.slug || team.name || team.sourceUrl || 'team';
  return `liga1-${String(source)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

function normalizeLiga1OfficialDateKey(value) {
  const text = String(value || '').trim();
  const isoMatch = text.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`;

  const months = {
    januari: '01',
    februari: '02',
    maret: '03',
    april: '04',
    mei: '05',
    juni: '06',
    juli: '07',
    agustus: '08',
    september: '09',
    oktober: '10',
    november: '11',
    desember: '12',
    january: '01',
    february: '02',
    march: '03',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12'
  };
  const localized = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!localized) return '';

  const month = months[localized[2].toLowerCase()];
  return month
    ? `${localized[3]}${month}${localized[1].padStart(2, '0')}`
    : '';
}

function liga1OfficialDateTime(match) {
  if (match?.kickoffIso) return match.kickoffIso;

  const dateKey = normalizeLiga1OfficialDateKey(match?.date);
  if (!dateKey) return new Date().toISOString();

  const rawTime = String(match?.kickoff || match?.time || '').trim();
  const kickoff = rawTime.match(/^(\d{1,2}):(\d{2})/);
  const time = kickoff
    ? `${kickoff[1].padStart(2, '0')}:${kickoff[2]}`
    : '12:00';

  return `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(
    6,
    8
  )}T${time}:00+07:00`;
}

function liga1OfficialStatus(status) {
  const value = String(
    typeof status === 'object'
      ? status.name ||
          status.type?.name ||
          status.type?.state ||
          status.state ||
          status.description ||
          ''
      : status || ''
  )
    .toLowerCase()
    .trim();

  if (['live', 'in', 'ht', 'halftime', 'playing', 'ongoing'].includes(value)) {
    return 'in';
  }

  if (['finished', 'ft', 'post', 'completed', 'final', 'selesai'].includes(value)) {
    return 'post';
  }

  return 'pre';
}

function mapLiga1OfficialMatch(rawMatch, fallbackStatus = '') {
  if (!rawMatch || typeof rawMatch !== 'object') return null;

  const home = rawMatch.home || rawMatch.homeTeam || {};
  const away = rawMatch.away || rawMatch.awayTeam || {};
  const homeName = home.name || 'Home Team';
  const awayName = away.name || 'Away Team';
  const inferredStatus =
    rawMatch.status ||
    (home.score !== null && home.score !== undefined && away.score !== null && away.score !== undefined
      ? 'finished'
      : fallbackStatus);
  const state = liga1OfficialStatus(inferredStatus);
  const date = liga1OfficialDateTime(rawMatch);
  const eventId =
    rawMatch.id ||
    `${normalizeLiga1OfficialDateKey(rawMatch.date)}-${homeName}-${awayName}`;

  const homeScore =
    state === 'pre'
      ? null
      : home.score ?? rawMatch.score?.home ?? rawMatch.homeScore ?? null;
  const awayScore =
    state === 'pre'
      ? null
      : away.score ?? rawMatch.score?.away ?? rawMatch.awayScore ?? null;

  const kickoffText = rawMatch.kickoff || rawMatch.time || 'SCHEDULED';
  const statusLabel =
    state === 'in'
      ? rawMatch.minute
        ? `${rawMatch.minute}'`
        : 'LIVE'
      : state === 'post'
      ? 'FT'
      : kickoffText;

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
    id: liga1TeamId(raw),
    displayName: name,
    shortDisplayName: name,
    logo: getLiga1TeamLogo(name, raw.logoUrl || raw.logo || ''),
    slug: raw.slug || raw.id || ''
  });

  const homeTeam = team(home, homeName);
  const awayTeam = team(away, awayName);

  return {
    id: String(eventId),
    date,
    name: `${homeName} vs ${awayName}`,
    shortName: `${homeName.slice(0, 3)} vs ${awayName.slice(0, 3)}`,
    leagueName: LIGA1_OFFICIAL_COMPETITION_NAME,
    leagueId: LIGA1_OFFICIAL_ID,
    leagueFlag: '🇮🇩',
    leagueLogo:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/BRI_Liga_1_Logo.svg',
    sourceUrl: rawMatch.sourceUrl || '',
    status,
    liga1Raw: rawMatch,
    competitions: [
      {
        id: String(eventId),
        date,
        status,
        venue: { fullName: rawMatch.venue || rawMatch.stadium || '' },
        competitors: [
          {
            homeAway: 'home',
            score:
              homeScore === null || homeScore === undefined
                ? '-'
                : String(homeScore),
            team: homeTeam
          },
          {
            homeAway: 'away',
            score:
              awayScore === null || awayScore === undefined
                ? '-'
                : String(awayScore),
            team: awayTeam
          }
        ]
      }
    ]
  };
}

async function fetchLiga1OfficialApi(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeout || 10000
  );
  const url = `${LIGA1_OFFICIAL_API_BASE}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json', ...(options.headers || {}) }
    });
    if (!response.ok) {
      throw new Error(`Liga 1 API HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function mapVercelStatPlayer(row, index) {
  if (!row || typeof row !== 'object') return null;
  const name = row.player || row.name || row.full_name || 'Pemain';
  const clubName = row.club || row.team?.name || 'Klub';
  const clubLogo =
    row.club_logo ||
    row.team?.logoUrl ||
    row.team?.logo ||
    getLiga1ClubLogo(clubName);

  return {
    rank: Number(row.rank) || index + 1,
    name,
    fullName: row.full_name || name,
    photoUrl: row.photo || row.photoUrl || null,
    value: Number(row.total ?? row.value) || 0,
    team: {
      name: clubName,
      logoUrl: clubLogo
    }
  };
}

function normalizeLiga1OfficialPayload(payload = {}) {
  const matches = Array.isArray(payload.matches) ? payload.matches : [];
  const classify = status =>
    matches.filter(match => liga1OfficialStatus(match.status) === status);

  const clubs = (Array.isArray(payload.clubs) ? payload.clubs : []).map(club => ({
    ...club,
    logoUrl: club.logoUrl || club.logo || ''
  }));

  liga1OfficialClubLogoMap = Object.fromEntries(
    clubs
      .filter(club => club?.name && (club?.logoUrl || club?.logo))
      .map(club => [normalizeLiga1TeamName(club.name), club.logoUrl || club.logo])
  );

  // Perkaya logo map dari data klasemen juga jika tersedia
  (Array.isArray(payload.standings) ? payload.standings : []).forEach(row => {
    const cName = row?.club || row?.team?.name;
    const cLogo = row?.logo || row?.team?.logoUrl || row?.team?.logo;
    if (cName && cLogo && !liga1OfficialClubLogoMap[normalizeLiga1TeamName(cName)]) {
      liga1OfficialClubLogoMap[normalizeLiga1TeamName(cName)] = cLogo;
    }
  });

  const rawTopScorers = Array.isArray(payload.topScorers) ? payload.topScorers : [];
  const rawTopAssists = Array.isArray(payload.topAssists) ? payload.topAssists : [];

  return {
    upcoming: Array.isArray(payload.upcoming)
      ? payload.upcoming
      : classify('pre'),
    live: Array.isArray(payload.live) ? payload.live : classify('in'),
    finished: Array.isArray(payload.finished)
      ? payload.finished
      : classify('post'),
    standings: Array.isArray(payload.standings) ? payload.standings : [],
    topScorers: rawTopScorers.map(mapVercelStatPlayer).filter(Boolean),
    topAssists: rawTopAssists.map(mapVercelStatPlayer).filter(Boolean),
    clubs,
    competition: payload.competition || {
      id: LIGA1_OFFICIAL_COMPETITION_ID,
      name: LIGA1_OFFICIAL_COMPETITION_NAME
    },
    updatedAt: payload.fetchedAt || new Date().toISOString()
  };
}

function getLiga1ClubLogo(teamName) {
  return liga1OfficialClubLogoMap[normalizeLiga1TeamName(teamName)] || '';
}

async function fetchLiga1OfficialSnapshot(force = false) {
  const cacheFresh =
    liga1OfficialSnapshotCache &&
    Date.now() - liga1OfficialSnapshotCacheAt < 15000;
  if (!force && cacheFresh) return liga1OfficialSnapshotCache;

  const results = await Promise.allSettled([
    fetchLiga1OfficialApi('/matches'),
    fetchLiga1OfficialApi('/standings'),
    fetchLiga1OfficialApi('/stats'),
    fetchLiga1OfficialApi('/clubs')
  ]);

  const read = index =>
    results[index].status === 'fulfilled' ? results[index].value : {};

  const matchesRes = read(0);
  const standingsRes = read(1);
  const statsRes = read(2);
  const clubsRes = read(3);

  const allMatches = Array.isArray(matchesRes.data)
    ? matchesRes.data
    : Array.isArray(matchesRes.matches)
    ? matchesRes.matches
    : [];

  const statsData = statsRes.data || statsRes || {};

  const payload = {
    matches: allMatches,
    standings: Array.isArray(standingsRes.data)
      ? standingsRes.data
      : Array.isArray(standingsRes.standings)
      ? standingsRes.standings
      : [],
    topScorers: Array.isArray(statsData.top_scorers)
      ? statsData.top_scorers
      : Array.isArray(statsData.topScorers)
      ? statsData.topScorers
      : [],
    topAssists: Array.isArray(statsData.top_assists)
      ? statsData.top_assists
      : Array.isArray(statsData.topAssists)
      ? statsData.topAssists
      : [],
    clubs: Array.isArray(clubsRes.data)
      ? clubsRes.data
      : Array.isArray(clubsRes.clubs)
      ? clubsRes.clubs
      : [],
    competition: {
      id: LIGA1_OFFICIAL_COMPETITION_ID,
      name: LIGA1_OFFICIAL_COMPETITION_NAME
    },
    fetchedAt: matchesRes.updated_at || new Date().toISOString()
  };

  liga1OfficialSnapshotCache = normalizeLiga1OfficialPayload(payload);
  liga1OfficialSnapshotCacheAt = Date.now();
  return liga1OfficialSnapshotCache;
}

async function fetchLiga1EventsForDate(dateFilter = '') {
  const snapshot = await fetchLiga1OfficialSnapshot();
  const allRaw = [
    ...snapshot.live,
    ...snapshot.upcoming,
    ...snapshot.finished
  ];
  const unique = new Map();
  allRaw.forEach(match => {
    if (match?.id) unique.set(String(match.id), match);
  });

  const dateKey = normalizeLiga1OfficialDateKey(dateFilter);
  return Array.from(unique.values())
    .map(match => mapLiga1OfficialMatch(match))
    .filter(Boolean)
    .filter(
      event =>
        !dateKey ||
        normalizeLiga1OfficialDateKey(event.liga1Raw?.date) === dateKey
    );
}

async function fetchLigaIndonesiaData(dateFilter = '') {
  const snapshot = await fetchLiga1OfficialSnapshot();
  const rawMatches = [...snapshot.live, ...snapshot.upcoming];
  const dateKey = normalizeLiga1OfficialDateKey(dateFilter);
  return rawMatches
    .map(match => mapLiga1OfficialMatch(match))
    .filter(Boolean)
    .filter(
      event =>
        !dateKey ||
        normalizeLiga1OfficialDateKey(event.liga1Raw?.date) === dateKey
    );
}

async function fetchLigaIndonesiaFinishedData(dateFilter = '') {
  const snapshot = await fetchLiga1OfficialSnapshot();
  const dateKey = normalizeLiga1OfficialDateKey(dateFilter);
  return snapshot.finished
    .map(match => mapLiga1OfficialMatch(match, 'finished'))
    .filter(Boolean)
    .filter(
      event =>
        !dateKey ||
        normalizeLiga1OfficialDateKey(event.liga1Raw?.date) === dateKey
    );
}

async function fetchLiga1LiveData() {
  const snapshot = await fetchLiga1OfficialSnapshot();
  return snapshot.live
    .map(match => mapLiga1OfficialMatch(match, 'live'))
    .filter(Boolean);
}

async function fetchLiga1Standings() {
  const snapshot = await fetchLiga1OfficialSnapshot();
  return snapshot.standings
    .filter(row => row && (row.club || row.team))
    .map(row => {
      const teamName = String(row.club || row.team?.name || row.team || '');
      const teamLogo =
        row.logo ||
        row.team?.logoUrl ||
        row.team?.logo ||
        getLiga1ClubLogo(teamName);

      return {
        position: Number(row.rank ?? row.position) || 0,
        team: teamName,
        teamLogo,
        teamSlug:
          row.team?.slug ||
          teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        played: Number(row.played) || 0,
        won: Number(row.win ?? row.won) || 0,
        drawn: Number(row.draw ?? row.drawn) || 0,
        lost: Number(row.loss ?? row.lost) || 0,
        goalsFor: Number(row.goals_for ?? row.goalsFor) || 0,
        goalsAgainst: Number(row.goals_against ?? row.goalsAgainst) || 0,
        goalDifference: Number(row.goal_difference ?? row.goalDifference) || 0,
        points: Number(row.points) || 0,
        form: Array.isArray(row.form) ? row.form.join('') : row.form || ''
      };
    })
    .sort((a, b) => a.position - b.position);
}

async function fetchLiga1TopScorers() {
  const snapshot = await fetchLiga1OfficialSnapshot();
  return {
    topScorers: snapshot.topScorers || [],
    topAssists: snapshot.topAssists || []
  };
}

async function fetchLiga1Clubs() {
  const snapshot = await fetchLiga1OfficialSnapshot();
  return snapshot.clubs || [];
}

async function refreshLiga1OfficialData() {
  liga1OfficialSnapshotCache = null;
  liga1OfficialSnapshotCacheAt = 0;
  return fetchLiga1OfficialSnapshot(true);
}

async function fetchLiga1MatchDetailSummary(
  cachedEvent,
  fallbackLeagueName = LIGA1_OFFICIAL_COMPETITION_NAME
) {
  const eventId = cachedEvent?.id || cachedEvent?.liga1Raw?.id;
  if (!eventId) return null;

  const response = await fetchLiga1OfficialApi(
    `/match-detail?id=${encodeURIComponent(eventId)}`
  );
  const detail = response.data || response.match || response;
  const cachedRaw = cachedEvent?.liga1Raw || {};
  const cachedState =
    cachedEvent?.status?.type?.state ||
    liga1OfficialStatus(cachedRaw.status || '');
  const isScheduled = cachedState === 'pre';

  const mergedHome = {
    ...(detail.home || {}),
    ...(cachedRaw.home || {}),
    score: isScheduled ? null : detail.home?.score ?? cachedRaw.home?.score ?? null,
    logo: detail.home?.logo || cachedRaw.home?.logo || ''
  };
  const mergedAway = {
    ...(detail.away || {}),
    ...(cachedRaw.away || {}),
    score: isScheduled ? null : detail.away?.score ?? cachedRaw.away?.score ?? null,
    logo: detail.away?.logo || cachedRaw.away?.logo || ''
  };

  const match = {
    ...detail,
    ...cachedRaw,
    id: eventId,
    status: isScheduled ? 'upcoming' : 'finished',
    date: cachedRaw.date || detail.date,
    kickoff: cachedRaw.kickoff || cachedRaw.time || detail.kickoff || '',
    home: mergedHome,
    away: mergedAway
  };

  const mapped = mapLiga1OfficialMatch(match, match.status);
  if (!mapped) return null;

  const normalizedTimeline = isScheduled
    ? []
    : (Array.isArray(detail.events) ? detail.events : []).map(ev => ({
        minute: ev.minute || '',
        team: ev.team || '',
        type: ev.type || 'EVENT',
        player: ev.player || ev.detail || '',
        text: `${ev.minute || ''} ${ev.player || ev.detail || ''}`.trim()
      }));

  const normalizedStats = isScheduled
    ? []
    : Array.isArray(detail.statistics)
    ? detail.statistics
    : [];

  const normalizedLineups = isScheduled
    ? []
    : Array.isArray(detail.lineups)
    ? detail.lineups
    : [];

  const enrichedDetail = {
    ...detail,
    ...match,
    timeline: normalizedTimeline,
    statistics: normalizedStats,
    lineups: normalizedLineups,
    location: detail.venue || match.venue || '',
    kickoffLabel: match.kickoff || '',
    match
  };

  return {
    header: {
      id: mapped.id,
      date: mapped.date,
      league: { slug: LIGA1_OFFICIAL_ID, name: fallbackLeagueName },
      competitions: mapped.competitions
    },
    leagues: [
      { slug: LIGA1_OFFICIAL_ID, name: fallbackLeagueName }
    ],
    details: normalizedTimeline,
    headToHead: [],
    gameInfo: {
      venue: { fullName: detail.venue || match.venue || '' },
      officials: (detail.officials || []).map(official => ({
        displayName: official.name || official.displayName || String(official),
        position: { name: 'Referee' }
      }))
    },
    boxscore: { teams: [] },
    rosters: normalizedLineups,
    liga1Detail: enrichedDetail,
    liga2Detail: enrichedDetail
  };
}

function renderLiga1TopScorers(container, data) {
  const sections = [
    {
      title: 'Top Scorer',
      icon: 'fa-futbol',
      rows: data.topScorers || [],
      suffix: 'gol'
    },
    {
      title: 'Top Assist',
      icon: 'fa-shoe-prints',
      rows: data.topAssists || [],
      suffix: 'assist'
    }
  ].filter(section => section.rows.length);

  if (!sections.length) {
    container.innerHTML = `
      <div class="text-center py-10 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
        Data top scorer dan assist Liga 1 belum tersedia.
      </div>`;
    return;
  }

  container.innerHTML = sections
    .map(
      section => `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-3.5 shadow-xl space-y-2">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="font-black text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <i class="fa-solid ${section.icon}"></i> ${section.title}
            </h3>
            <span class="text-[9px] text-slate-400">${LIGA1_OFFICIAL_COMPETITION_NAME}</span>
          </div>
          <div class="space-y-0.5">
            ${section.rows
              .map((row, index) => {
                const name = row.name || row.player || 'Pemain';
                const club = row.team?.name || row.club || 'Klub';
                const photo =
                  row.photoUrl ||
                  row.photo ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    name
                  )}&background=991b1b&color=fff&bold=true&rounded=true`;
                const clubLogo =
                  row.team?.logoUrl ||
                  row.club_logo ||
                  getLiga1ClubLogo(club) ||
                  PLAIN_SHIELD_LOGO;
                const value = row.value ?? row.total ?? 0;
                return `
                  <div class="flex items-center justify-between p-2 rounded-xl border-b border-slate-800/40 last:border-b-0">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                      <span class="font-black text-xs w-4 text-center ${
                        index === 0 ? 'text-amber-400' : 'text-slate-500'
                      }">${row.rank || index + 1}</span>
                      <img src="${photo}" loading="lazy" class="w-9 h-9 rounded-full object-cover bg-slate-950 border border-slate-800" alt="" onerror="this.src='${PLAIN_PERSON_HEADSHOT}'">
                      <div class="min-w-0">
                        <div class="font-bold text-white text-xs truncate">${name}</div>
                        <div class="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                          <img src="${clubLogo}" class="w-3 h-3 object-contain" alt="">
                          <span class="truncate">${club}</span>
                        </div>
                      </div>
                    </div>
                    <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-black text-xs">${value} ${section.suffix}</span>
                  </div>`;
              })
              .join('')}
          </div>
        </div>`
    )
    .join('');
}
