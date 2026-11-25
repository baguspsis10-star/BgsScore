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
  const isoMatch = text.match(/(\d{4})-?(\d{2})-?(\d{2})/);
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
  const localized = text.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!localized) return '';

  const month = months[localized[2].toLowerCase()];
  return month
    ? `${localized[3]}${month}${localized[1].padStart(2, '0')}`
    : '';
}

function liga1OfficialDateTime(match) {
  if (match?.kickoffIso) return match.kickoffIso;

  const dateKey = normalizeLiga1OfficialDateKey(match?.date || match?.id);
  if (!dateKey) return new Date().toISOString();

  const rawTime = String(match?.kickoff || match?.time || '').trim();
  const kickoff = rawTime.match(/(\d{1,2}):(\d{2})/);
  const time = kickoff
    ? `${kickoff[1].padStart(2, '0')}:${kickoff[2]}`
    : '15:30';

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

  if (['live', 'in', 'ht', 'halftime', 'playing', 'ongoing', 'berlangsung'].includes(value)) {
    return 'in';
  }

  if (['finished', 'ft', 'post', 'completed', 'final', 'selesai', 'result', 'ended', 'done'].includes(value)) {
    return 'post';
  }

  if (['upcoming', 'pre', 'scheduled', 'not_started', 'ns', 'tba', 'fixture'].includes(value)) {
    return 'pre';
  }

  return '';
}

function isPlausibleFootballScore(homeVal, awayVal, rawMatch = {}) {
  if (
    homeVal === null ||
    homeVal === undefined ||
    homeVal === '' ||
    homeVal === '-' ||
    awayVal === null ||
    awayVal === undefined ||
    awayVal === '' ||
    awayVal === '-'
  ) {
    return false;
  }

  const hNum = Number(homeVal);
  const aNum = Number(awayVal);
  if (Number.isNaN(hNum) || Number.isNaN(aNum) || hNum < 0 || aNum < 0) {
    return false;
  }

  if (hNum > 12 || aNum > 12) return false;

  const timeStr = String(rawMatch.kickoff || rawMatch.time || '').trim();
  if (timeStr) {
    const tMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (
      tMatch &&
      hNum === parseInt(tMatch[1], 10) &&
      aNum === parseInt(tMatch[2], 10)
    ) {
      return false;
    }
  }

  return true;
}

function detectLiga1MatchState(rawMatch, fallbackStatus = '') {
  if (!rawMatch || typeof rawMatch !== 'object') return 'pre';

  const explicit = liga1OfficialStatus(rawMatch.status || fallbackStatus);
  if (explicit === 'pre') return 'pre';
  if (explicit === 'in') return 'in';

  const home = rawMatch.home || rawMatch.homeTeam || {};
  const away = rawMatch.away || rawMatch.awayTeam || {};
  const hScore = home.score ?? rawMatch.score?.home ?? rawMatch.homeScore;
  const aScore = away.score ?? rawMatch.score?.away ?? rawMatch.awayScore;
  const validScore = isPlausibleFootballScore(hScore, aScore, rawMatch);

  if (explicit === 'post') {
    return validScore ? 'post' : 'pre';
  }

  return validScore ? 'post' : 'pre';
}

function mapLiga1OfficialMatch(rawMatch, fallbackStatus = '') {
  if (!rawMatch || typeof rawMatch !== 'object') return null;

  const home = rawMatch.home || rawMatch.homeTeam || {};
  const away = rawMatch.away || rawMatch.awayTeam || {};
  const homeName = home.name || 'Home Team';
  const awayName = away.name || 'Away Team';
  const state = detectLiga1MatchState(rawMatch, fallbackStatus);
  const date = liga1OfficialDateTime(rawMatch);
  const eventId =
    rawMatch.id ||
    `${normalizeLiga1OfficialDateKey(rawMatch.date)}-${homeName}-${awayName}`;

  const rawHomeScore = home.score ?? rawMatch.score?.home ?? rawMatch.homeScore ?? null;
  const rawAwayScore = away.score ?? rawMatch.score?.away ?? rawMatch.awayScore ?? null;

  const homeScore =
    state === 'pre' || !isPlausibleFootballScore(rawHomeScore, rawAwayScore, rawMatch)
      ? null
      : rawHomeScore;
  const awayScore =
    state === 'pre' || !isPlausibleFootballScore(rawHomeScore, rawAwayScore, rawMatch)
      ? null
      : rawAwayScore;

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
  const classify = targetState =>
    matches.filter(match => detectLiga1MatchState(match) === targetState);

  const clubs = (Array.isArray(payload.clubs) ? payload.clubs : []).map(club => ({
    ...club,
    logoUrl: club.logoUrl || club.logo || ''
  }));

  liga1OfficialClubLogoMap = Object.fromEntries(
    clubs
      .filter(club => club?.name && (club?.logoUrl || club?.logo))
      .map(club => [normalizeLiga1TeamName(club.name), club.logoUrl || club.logo])
  );

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
    upcoming: Array.isArray(payload.upcoming) && payload.upcoming.length
      ? payload.upcoming
      : classify('pre'),
    live: Array.isArray(payload.live) && payload.live.length
      ? payload.live
      : classify('in'),
    finished: Array.isArray(payload.finished) && payload.finished.length
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

function extractMatchesArray(res) {
  if (!res || typeof res !== 'object') return [];
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.matches)) return res.matches;
  return [];
}

function buildMatchDedupKey(match, idx = 0) {
  const home = normalizeLiga1TeamName(match?.home?.name || match?.homeTeam?.name || '');
  const away = normalizeLiga1TeamName(match?.away?.name || match?.awayTeam?.name || '');
  const dateKey = normalizeLiga1OfficialDateKey(match?.date || match?.id);
  if (home && away && dateKey) {
    return `${dateKey}-${home}-${away}`;
  }
  if (match?.id) {
    return String(match.id).toUpperCase();
  }
  return `match-${idx}-${home}-${away}`;
}

async function fetchLiga1OfficialSnapshot(force = false) {
  const cacheFresh =
    liga1OfficialSnapshotCache &&
    Date.now() - liga1OfficialSnapshotCacheAt < 15000;
  if (!force && cacheFresh) return liga1OfficialSnapshotCache;

  const results = await Promise.allSettled([
    fetchLiga1OfficialApi('/matches'),
    fetchLiga1OfficialApi('/matches?status=upcoming'),
    fetchLiga1OfficialApi('/matches?status=finished'),
    fetchLiga1OfficialApi('/matches?status=live'),
    fetchLiga1OfficialApi('/standings'),
    fetchLiga1OfficialApi('/stats'),
    fetchLiga1OfficialApi('/clubs')
  ]);

  const read = index =>
    results[index].status === 'fulfilled' ? results[index].value : {};

  const defaultMatches = extractMatchesArray(read(0));
  const upcomingMatches = extractMatchesArray(read(1)).map(m => ({
    ...m,
    status: m.status || 'upcoming'
  }));
  const finishedMatches = extractMatchesArray(read(2)).map(m => ({
    ...m,
    status: m.status || 'finished'
  }));
  const liveMatches = extractMatchesArray(read(3)).map(m => ({
    ...m,
    status: m.status || 'live'
  }));

  const mergedMap = new Map();
  [
    ...defaultMatches,
    ...upcomingMatches,
    ...finishedMatches,
    ...liveMatches
  ].forEach((match, idx) => {
    if (!match || typeof match !== 'object') return;
    const key = buildMatchDedupKey(match, idx);
    const prev = mergedMap.get(key);
    mergedMap.set(key, prev ? { ...prev, ...match } : match);
  });

  const standingsRes = read(4);
  const statsRes = read(5);
  const clubsRes = read(6);
  const statsData = statsRes.data || statsRes || {};

  const payload = {
    matches: Array.from(mergedMap.values()),
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
    fetchedAt: read(0).updated_at || new Date().toISOString()
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
  allRaw.forEach((match, idx) => {
    unique.set(buildMatchDedupKey(match, idx), match);
  });

  const dateKey = normalizeLiga1OfficialDateKey(dateFilter);
  return Array.from(unique.values())
    .map(match => mapLiga1OfficialMatch(match))
    .filter(Boolean)
    .filter(
      event =>
        !dateKey ||
        normalizeLiga1OfficialDateKey(event.liga1Raw?.date || event.date) === dateKey
    );
}

async function fetchLigaIndonesiaData(dateFilter = '') {
  const snapshot = await fetchLiga1OfficialSnapshot();
  const rawMatches = [...snapshot.live, ...snapshot.upcoming];
  const dateKey = normalizeLiga1OfficialDateKey(dateFilter);
  return rawMatches
    .map(match => mapLiga1OfficialMatch(match, 'upcoming'))
    .filter(Boolean)
    .filter(
      event =>
        !dateKey ||
        normalizeLiga1OfficialDateKey(event.liga1Raw?.date || event.date) === dateKey
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
        normalizeLiga1OfficialDateKey(event.liga1Raw?.date || event.date) === dateKey
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

// =========================================================
// ADAPTER DETAIL PERTANDINGAN LIGA 1 -> FORMAT MODAL BGS
// =========================================================

function resolveLiga1EventTeamSide(ev, homeName, awayName) {
  const side = String(ev.side || ev.team_side || ev.homeAway || '').toLowerCase();
  if (side === 'home' || side === 'away') return side;

  const evTeamNorm = normalizeLiga1TeamName(
    typeof ev.team === 'object' ? ev.team?.name || ev.team?.displayName : ev.team
  );
  const homeNorm = normalizeLiga1TeamName(homeName);
  const awayNorm = normalizeLiga1TeamName(awayName);

  if (
    evTeamNorm &&
    awayNorm &&
    (evTeamNorm === awayNorm || awayNorm.includes(evTeamNorm) || evTeamNorm.includes(awayNorm))
  ) {
    return 'away';
  }
  return 'home';
}

function mapLiga1DetailEventsToEspnDetails(rawEvents, homeTeam, awayTeam) {
  if (!Array.isArray(rawEvents)) return [];

  return rawEvents.map((ev, idx) => {
    const rawType = String(ev.type || ev.event || ev.kind || '').toLowerCase();
    const rawDetail = String(ev.detail || ev.text || ev.description || '').toLowerCase();
    const combined = `${rawType} ${rawDetail}`;

    let typeText = 'Event';
    if (combined.includes('own goal') || combined.includes('og') || combined.includes('bunuh diri')) {
      typeText = 'Own Goal';
    } else if (combined.includes('pen') && (combined.includes('miss') || combined.includes('gagal'))) {
      typeText = 'Missed Penalty';
    } else if (combined.includes('pen')) {
      typeText = 'Penalty - Goal';
    } else if (combined.includes('goal') || combined.includes('gol')) {
      typeText = 'Goal';
    } else if (combined.includes('red') || combined.includes('merah')) {
      typeText = 'Red Card';
    } else if (combined.includes('yellow') || combined.includes('kuning')) {
      typeText = 'Yellow Card';
    } else if (combined.includes('sub') || combined.includes('pergantian') || combined.includes('ganti')) {
      typeText = 'Substitution';
    }

    const side = resolveLiga1EventTeamSide(ev, homeTeam.displayName, awayTeam.displayName);
    const targetTeamId = side === 'away' ? awayTeam.id : homeTeam.id;

    const minuteRaw = String(ev.minute || ev.time || ev.clock || '0').replace(/'/g, '').trim();
    const primaryPlayer =
      ev.player ||
      ev.player_in ||
      ev.playerIn ||
      ev.scorer ||
      ev.name ||
      ev.detail ||
      'Pemain';
    const secondaryPlayer =
      ev.player_out ||
      ev.playerOut ||
      ev.assist ||
      '';

    const participants = [
      {
        athlete: {
          id: `l1-ath-${normalizeLiga1TeamName(primaryPlayer).replace(/\s+/g, '-') || idx}`,
          displayName: String(primaryPlayer).trim(),
          fullName: String(primaryPlayer).trim()
        }
      }
    ];

    if (secondaryPlayer) {
      participants.push({
        athlete: {
          id: `l1-ath-${normalizeLiga1TeamName(secondaryPlayer).replace(/\s+/g, '-') || idx + '-2'}`,
          displayName: String(secondaryPlayer).trim(),
          fullName: String(secondaryPlayer).trim()
        }
      });
    }

    return {
      clock: { displayValue: minuteRaw ? `${minuteRaw}'` : '0\'' },
      time: minuteRaw ? `${minuteRaw}'` : '0\'',
      team: { id: targetTeamId },
      type: { text: typeText },
      text: `${typeText}: ${primaryPlayer}`,
      participants
    };
  });
}

function mapLiga1StatsToBoxscore(rawStats, homeTeam, awayTeam) {
  const rows = Array.isArray(rawStats) ? rawStats : [];
  const homeStats = [];
  const awayStats = [];

  const statNameMap = [
    { match: ['penguasaan', 'possession'], espnName: 'possessionPct' },
    { match: ['tembakan ke gawang', 'shots on target', 'shot on target'], espnName: 'shotsOnTarget' },
    { match: ['total tembakan', 'shots off target', 'tembakan'], espnName: 'shotsOffTarget' },
    { match: ['tendangan sudut', 'corner'], espnName: 'wonCorners' },
    { match: ['pelanggaran', 'foul'], espnName: 'foulsCommitted' },
    { match: ['kartu kuning', 'yellow'], espnName: 'yellowCards' },
    { match: ['kartu merah', 'red'], espnName: 'redCards' }
  ];

  rows.forEach(row => {
    const label = String(row.metric || row.label || row.name || '').toLowerCase();
    const found = statNameMap.find(m => m.match.some(k => label.includes(k)));
    const espnName = found ? found.espnName : label;

    const cleanVal = (v) => {
      if (v === undefined || v === null) return '0';
      return String(v).replace('%', '').trim();
    };

    homeStats.push({
      name: espnName,
      label: row.metric || row.label || row.name || espnName,
      displayValue: cleanVal(row.home)
    });
    awayStats.push({
      name: espnName,
      label: row.metric || row.label || row.name || espnName,
      displayValue: cleanVal(row.away)
    });
  });

  return {
    teams: [
      { team: homeTeam, statistics: homeStats },
      { team: awayTeam, statistics: awayStats }
    ]
  };
}

function normalizeLiga1PlayerEntry(p, idx, isStarter, teamPrefix) {
  if (!p) return null;
  if (typeof p === 'string') {
    const numMatch = p.match(/^#?(\d+)\s+(.+)$/);
    const jersey = numMatch ? numMatch[1] : String(idx + 1);
    const name = numMatch ? numMatch[2].trim() : p.trim();
    return {
      starter: isStarter,
      jersey,
      position: { abbreviation: idx === 0 && isStarter ? 'GK' : 'MF' },
      athlete: {
        id: `${teamPrefix}-p-${idx}`,
        displayName: name,
        fullName: name
      }
    };
  }

  const name = p.name || p.player || p.displayName || p.full_name || 'Pemain';
  const jersey = String(p.number ?? p.jersey ?? p.no ?? idx + 1);
  const rawPos = String(p.position || p.pos || '').toUpperCase();
  let posAbbr = rawPos;
  if (!posAbbr) {
    posAbbr = idx === 0 && isStarter ? 'GK' : 'MF';
  } else if (posAbbr.includes('GOAL') || posAbbr.includes('KIPER')) {
    posAbbr = 'GK';
  } else if (posAbbr.includes('DEF') || posAbbr.includes('BEK')) {
    posAbbr = 'DF';
  } else if (posAbbr.includes('MID') || posAbbr.includes('GELANDANG')) {
    posAbbr = 'MF';
  } else if (posAbbr.includes('FOR') || posAbbr.includes('STRIKER') || posAbbr.includes('PENYERANG')) {
    posAbbr = 'FW';
  }

  return {
    starter: isStarter,
    jersey,
    position: { abbreviation: posAbbr },
    athlete: {
      id: p.id || `${teamPrefix}-p-${jersey}-${idx}`,
      displayName: name,
      fullName: name
    }
  };
}

function mapLiga1LineupsToRosters(rawLineups, homeTeam, awayTeam) {
  if (!rawLineups) return [];

  let homeRaw = null;
  let awayRaw = null;

  if (Array.isArray(rawLineups)) {
    if (rawLineups[0]?.roster) return rawLineups;
    homeRaw = rawLineups[0] || null;
    awayRaw = rawLineups[1] || null;
  } else if (typeof rawLineups === 'object') {
    homeRaw = rawLineups.home || rawLineups.homeTeam || null;
    awayRaw = rawLineups.away || rawLineups.awayTeam || null;
  }

  if (!homeRaw || !awayRaw) return [];

  const buildRosterList = (sideData, prefix) => {
    const startersRaw =
      sideData.starting ||
      sideData.starters ||
      sideData.lineup ||
      sideData.starting_xi ||
      (Array.isArray(sideData) ? sideData.slice(0, 11) : []);
    const subsRaw =
      sideData.substitutes ||
      sideData.subs ||
      sideData.bench ||
      (Array.isArray(sideData) ? sideData.slice(11) : []);

    const starters = (Array.isArray(startersRaw) ? startersRaw : [])
      .map((p, i) => normalizeLiga1PlayerEntry(p, i, true, prefix))
      .filter(Boolean);
    const subs = (Array.isArray(subsRaw) ? subsRaw : [])
      .map((p, i) => normalizeLiga1PlayerEntry(p, i + 11, false, prefix))
      .filter(Boolean);

    return [...starters, ...subs];
  };

  const homeRoster = buildRosterList(homeRaw, 'h');
  const awayRoster = buildRosterList(awayRaw, 'a');

  if (homeRoster.length === 0 || awayRoster.length === 0) return [];

  return [
    {
      team: homeTeam,
      formation: homeRaw.formation || '',
      roster: homeRoster
    },
    {
      team: awayTeam,
      formation: awayRaw.formation || '',
      roster: awayRoster
    }
  ];
}

async function fetchLiga1MatchDetailSummary(
  cachedEvent,
  fallbackLeagueName = LIGA1_OFFICIAL_COMPETITION_NAME,
  fallbackEventId = ''
) {
  const eventId =
    cachedEvent?.id ||
    cachedEvent?.liga1Raw?.id ||
    fallbackEventId;
  if (!eventId) return null;

  const response = await fetchLiga1OfficialApi(
    `/match-detail?id=${encodeURIComponent(eventId)}`
  );
  const detail = response.data || response.match || response;
  const cachedRaw = cachedEvent?.liga1Raw || {};

  const combinedRaw = {
    ...cachedRaw,
    ...detail,
    home: {
      ...(cachedRaw.home || {}),
      ...(detail.home || {}),
      score: detail.home?.score ?? cachedRaw.home?.score ?? null,
      logo: detail.home?.logo || detail.home?.logoUrl || cachedRaw.home?.logo || ''
    },
    away: {
      ...(cachedRaw.away || {}),
      ...(detail.away || {}),
      score: detail.away?.score ?? cachedRaw.away?.score ?? null,
      logo: detail.away?.logo || detail.away?.logoUrl || cachedRaw.away?.logo || ''
    }
  };

  const detectedState = detectLiga1MatchState(combinedRaw);
  const hasDetailContent =
    (Array.isArray(detail.events) && detail.events.length > 0) ||
    (Array.isArray(detail.statistics) && detail.statistics.length > 0) ||
    Boolean(detail.lineups);
  const isScheduled = detectedState === 'pre' && !hasDetailContent;

  const match = {
    ...combinedRaw,
    id: eventId,
    status: isScheduled ? 'upcoming' : detectedState === 'in' ? 'live' : 'finished',
    date: detail.date || cachedRaw.date,
    kickoff: detail.kickoff || cachedRaw.kickoff || cachedRaw.time || ''
  };

  const mapped = mapLiga1OfficialMatch(match, match.status);
  if (!mapped) return null;

  const homeComp = mapped.competitions[0].competitors.find(c => c.homeAway === 'home');
  const awayComp = mapped.competitions[0].competitors.find(c => c.homeAway === 'away');
  const homeTeam = homeComp.team;
  const awayTeam = awayComp.team;

  const rawEvents = detail.events || detail.timeline || [];
  const rawStats = detail.statistics || detail.stats || [];
  const rawLineups = detail.lineups || detail.lineup || null;

  const normalizedDetails = mapLiga1DetailEventsToEspnDetails(
    rawEvents,
    homeTeam,
    awayTeam
  );
  const mappedBoxscore = mapLiga1StatsToBoxscore(
    rawStats,
    homeTeam,
    awayTeam
  );
  const mappedRosters = mapLiga1LineupsToRosters(
    rawLineups,
    homeTeam,
    awayTeam
  );

  const enrichedDetail = {
    ...detail,
    ...match,
    timeline: normalizedDetails,
    statistics: Array.isArray(rawStats) ? rawStats : [],
    lineups: mappedRosters,
    location: detail.venue || detail.stadium || match.venue || '',
    attendance: detail.attendance || '',
    kickoffLabel: detail.kickoff || match.kickoff || '',
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
    details: normalizedDetails,
    headToHead: [],
    gameInfo: {
      venue: { fullName: detail.venue || detail.stadium || match.venue || '' },
      officials: (detail.officials || (detail.referee ? [detail.referee] : [])).map(official => ({
        displayName: official.name || official.displayName || String(official),
        position: { name: 'Referee' }
      }))
    },
    boxscore: mappedBoxscore,
    rosters: mappedRosters,
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
