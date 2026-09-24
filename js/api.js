// ==========================================
// API & NETWORK DATA FETCHING MODULE (ESPN API + REPLIT LIGA 1 + AVATAR CIRCLE FALLBACK)
// ==========================================

// URL Backend Replit BRI Liga 1
const REPLIT_LIGA1_URL = 'https://node-express-app--bgsdesign22.replit.app/api/Liga1';
const REPLIT_LIGA1_FINISHED_URL = 'https://node-express-app--bgsdesign22.replit.app/api/liga1/finished';
const REPLIT_LIGA1_STANDINGS_URL = 'https://node-express-app--bgsdesign22.replit.app/api/liga1/standings';

// ESPN mengirim beberapa pertandingan pada endpoint "all" hanya dengan
// numeric league ID di UID. Simpan alias yang sudah diketahui agar nama
// kompetisi tetap konsisten dengan halaman detail pertandingan.
const ESPN_LEAGUE_ID_ALIASES = {
  '8315': 'caf.nations_qual'
};

function isCompetitionStageLabel(value) {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return /^(group stage|regular season|round(?: [a-z0-9]+)?|quarterfinals?|semifinals?|finals?|playoffs?)$/.test(
    normalized
  );
}

// Pemetaan klub Liga 1 ke ID logo API-Football.
// Backend Replit saat ini mengirim nama klub dan skor, belum mengirim URL logo.
const LIGA1_TEAM_LOGO_IDS = {
  'PERSIK KEDIRI': '4241',
  'MADURA UNITED FC': '2444',
  'MADURA UNITED': '2444',
  'ISENMULANG KALTENG FC': '24993',
  'PERSEBAYA SURABAYA': '2446',
  'PERSITA': '4244',
  'GARUDAYAKSA FC': '26645',
  'GARUDAYAKSA': '26645',
  'AREMA FC': '2438',
  'BHAYANGKARA PRESISI LAMPUNG FC': '2443',
  'BALI UNITED FC': '2448',
  'PERSIJAP JEPARA': '11132',
  'PSIM YOGYAKARTA': '4235',
  'PERSIJA JAKARTA': '10134',
  'JAVA UNITED FC': '22409',
  'BORNEO FC SAMARINDA': '2442',
  'BORNEO SAMARINDA': '2442',
  'PSS SLEMAN': '3882',
  'PSM MAKASSAR': '2441',
  'PERSIB BANDUNG': '2445',
  'DEWA UNITED BANTEN FC': '3412',
  'DEWA UNITED BANTEN': '3412'
};

function normalizeLiga1TeamName(name) {
  return String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function getLiga1TeamLogo(teamName, providedLogo = '') {
  if (
    typeof providedLogo === 'string' &&
    /^https?:\/\//i.test(providedLogo)
  ) {
    return providedLogo;
  }

  const normalizedName = normalizeLiga1TeamName(teamName);
  const teamId = LIGA1_TEAM_LOGO_IDS[normalizedName];

  if (teamId) {
    return `https://media.api-sports.io/football/teams/${teamId}.png`;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName || 'Team')}&background=15803d&color=fff&bold=true&rounded=true`;
}

// Mengambil klasemen khusus BRI Liga 1 dari API Replit.
// Response API:
// [
//   {
//     position, team, played, won, drawn, lost,
//     goalsFor, goalsAgainst, goalDifference, points, form
//   }
// ]
async function fetchLiga1Standings() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(REPLIT_LIGA1_STANDINGS_URL, {
      signal: controller.signal,
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Liga 1 standings HTTP ${res.status}`);
    }

    const payload = await res.json();

    if (!Array.isArray(payload)) {
      throw new Error('Format klasemen Liga 1 tidak valid');
    }

    return payload
      .filter(row => row && typeof row === 'object' && row.team)
      .map(row => ({
        position: Number(row.position) || 0,
        team: String(row.team),
        played: Number(row.played) || 0,
        won: Number(row.won) || 0,
        drawn: Number(row.drawn) || 0,
        lost: Number(row.lost) || 0,
        goalsFor: Number(row.goalsFor) || 0,
        goalsAgainst: Number(row.goalsAgainst) || 0,
        goalDifference: Number(row.goalDifference) || 0,
        points: Number(row.points) || 0,
        form: String(row.form || '')
      }))
      .sort((a, b) => a.position - b.position);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Normalisasi tanggal API Liga 1 dan filter aplikasi menjadi YYYYMMDD.
// API Liga 1 mengirim tanggal seperti "2026-10-09",
// sedangkan date strip aplikasi menggunakan "20261009".
function normalizeLiga1DateKey(dateValue) {
  const value = String(dateValue || '');
  const match = value.match(/^(\d{4})-?(\d{2})-?(\d{2})/);

  return match
    ? `${match[1]}${match[2]}${match[3]}`
    : '';
}

function mapLiga1Matches(rawMatches, dateFilter = '', fallbackStatus = 'scheduled') {
  const selectedDateKey = normalizeLiga1DateKey(dateFilter);

  const filteredMatches = selectedDateKey
    ? rawMatches.filter(match => {
        return (
          normalizeLiga1DateKey(match.date) ===
          selectedDateKey
        );
      })
    : rawMatches;

  return filteredMatches.map(match => {
    let state = 'pre';
    const statusLower = String(
      match.status || fallbackStatus || ''
    ).toLowerCase();

    if (
      statusLower === 'ft' ||
      statusLower === 'finished' ||
      statusLower === 'post'
    ) {
      state = 'post';
    } else if (
      statusLower === 'live' ||
      statusLower === 'ht' ||
      statusLower === 'halftime' ||
      statusLower === 'in'
    ) {
      state = 'in';
    }

    let safeDate = new Date().toISOString();
    if (match.date) {
      safeDate = match.date.includes('T')
        ? match.date
        : `${match.date}T15:30:00Z`;
    }

    const statusObj = {
      type: {
        state,
        completed: state === 'post',
        description: match.status
          ? String(match.status).toUpperCase()
          : String(fallbackStatus || 'SCHEDULED').toUpperCase(),
        shortDetail: match.status
          ? String(match.status).toUpperCase()
          : String(fallbackStatus || 'SCHEDULED').toUpperCase()
      }
    };

    const homeTeamName = match.homeTeam || 'Home Team';
    const awayTeamName = match.awayTeam || 'Away Team';

    const homeTeamLogo = getLiga1TeamLogo(
      homeTeamName,
      match.homeLogo || match.homeTeamLogo
    );

    const awayTeamLogo = getLiga1TeamLogo(
      awayTeamName,
      match.awayLogo || match.awayTeamLogo
    );

    return {
      id:
        match.id ||
        `indo-${Date.now()}-${Math.random()}`,

      date: safeDate,
      name: `${homeTeamName} vs ${awayTeamName}`,
      shortName: `${homeTeamName.substring(0, 3)} vs ${awayTeamName.substring(0, 3)}`,
      leagueName: 'BRI Liga 1',
      leagueId: 'indonesia.1',
      leagueFlag: '🇮🇩',
      leagueLogo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2205.png',
      status: statusObj,

      competitions: [
        {
          id:
            match.id ||
            `comp-${Date.now()}`,
          date: safeDate,
          status: statusObj,

          competitors: [
            {
              homeAway: 'home',
              score:
                match.homeScore !== null &&
                match.homeScore !== undefined
                  ? String(match.homeScore)
                  : '-',

              team: {
                id: `team-home-${encodeURIComponent(homeTeamName)}`,
                displayName: homeTeamName,
                shortDisplayName: homeTeamName,
                logo: homeTeamLogo
              }
            },

            {
              homeAway: 'away',
              score:
                match.awayScore !== null &&
                match.awayScore !== undefined
                  ? String(match.awayScore)
                  : '-',

              team: {
                id: `team-away-${encodeURIComponent(awayTeamName)}`,
                displayName: awayTeamName,
                shortDisplayName: awayTeamName,
                logo: awayTeamLogo
              }
            }
          ]
        }
      ]
    };
  });
}

async function fetchLiga1MatchesFromEndpoint(
  endpoint,
  dateFilter = '',
  fallbackStatus = 'scheduled'
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const rawMatches = await res.json();

    if (!Array.isArray(rawMatches)) return [];

    return mapLiga1Matches(
      rawMatches,
      dateFilter,
      fallbackStatus
    );
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
}

// Jadwal Liga 1 yang belum selesai / akan datang
async function fetchLigaIndonesiaData(dateFilter = '') {
  return fetchLiga1MatchesFromEndpoint(
    REPLIT_LIGA1_URL,
    dateFilter,
    'scheduled'
  );
}

// Pertandingan Liga 1 yang sudah selesai
async function fetchLigaIndonesiaFinishedData(dateFilter = '') {
  return fetchLiga1MatchesFromEndpoint(
    REPLIT_LIGA1_FINISHED_URL,
    dateFilter,
    'finished'
  );
}

// Helper pemecah rentang tanggal "YYYYMMDD-YYYYMMDD" menjadi array tanggal harian
function expandDateRange(rangeStr) {
  if (!rangeStr || !rangeStr.includes('-')) return [rangeStr];
  const [startStr, endStr] = rangeStr.split('-');
  if (startStr.length !== 8 || endStr.length !== 8) return [startStr];
  
  const dates = [];
  let cur = new Date(
    parseInt(startStr.substring(0,4)),
    parseInt(startStr.substring(4,6)) - 1,
    parseInt(startStr.substring(6,8))
  );
  const end = new Date(
    parseInt(endStr.substring(0,4)),
    parseInt(endStr.substring(4,6)) - 1,
    parseInt(endStr.substring(6,8))
  );
  
  let count = 0;
  while (cur <= end && count < 8) {
    dates.push(getFormattedDate(cur));
    cur.setDate(cur.getDate() + 1);
    count++;
  }
  return dates.length > 0 ? dates : [startStr];
}

// Helper pintar untuk fetch pertandingan dengan ekstraksi nama & bendera liga yang akurat
async function fetchMatchesByLeagueOrAll(leagueId, dateStr) {
  const slug = (!leagueId || leagueId === 'all') ? 'all' : leagueId;
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${dateStr}`);
    if (!res.ok) return [];
    const data = await res.json();
    
    const rootLeague = data.leagues?.[0];

    return (data.events || []).map(evt => {
      const comp = evt.competitions?.[0];

      const uidLeagueId = evt.uid?.match(/~l:([^~]+)/)?.[1] || '';
      const aliasedLeagueId = ESPN_LEAGUE_ID_ALIASES[uidLeagueId] || '';
      const slugCandidates = [
        aliasedLeagueId,
        slug !== 'all' ? slug : '',
        evt.league?.slug,
        comp?.league?.slug,
        rootLeague?.slug,
        evt.season?.slug
      ].filter(Boolean);

      const extractedSlug =
        slugCandidates.find(value => !isCompetitionStageLabel(value)) ||
        slugCandidates[0] ||
        '';

      const nameCandidates = [
        evt.league?.name,
        comp?.league?.name,
        rootLeague?.name,
        evt.season?.name,
        evt.leagueName
      ].filter(value => value && !isCompetitionStageLabel(value));

      let rawName = nameCandidates[0] || '';

      if (!rawName && extractedSlug && !isCompetitionStageLabel(extractedSlug)) {
        rawName = extractedSlug
          .split(/[.-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      const foundLeague = typeof LEAGUES !== 'undefined' 
        ? LEAGUES.find(l => 
            (extractedSlug && (l.id === extractedSlug || extractedSlug.startsWith(l.id + '.'))) || 
            (slug !== 'all' && l.id === slug) ||
            (rawName && l.name.toLowerCase() === rawName.toLowerCase()) ||
            (rawName && rawName.toLowerCase().includes(l.name.toLowerCase()))
          ) 
        : null;

      const finalLeagueName = foundLeague?.name || rawName || 'Pertandingan';
      const finalLeagueId = foundLeague?.id || extractedSlug || slug;
      const finalLeagueFlag = foundLeague?.flag || (typeof getLeagueFlag === 'function' ? getLeagueFlag(finalLeagueId) : '⚽');
      const finalLeagueLogo = foundLeague?.logo || evt.league?.logos?.[0]?.href || rootLeague?.logos?.[0]?.href || '';

      return {
        ...evt,
        leagueName: finalLeagueName,
        leagueId: finalLeagueId,
        leagueLogo: finalLeagueLogo,
        leagueFlag: finalLeagueFlag
      };
    }).filter(event => !isExcludedNcaamatch(event));
  } catch (e) {
    return [];
  }
}

// Helper fetch batch teroptimasi
async function fetchBatchLeagues(leaguesList, getDateStrFn) {
  if (!leaguesList || leaguesList.length === 0) return [];
  
  const sampleDate = getDateStrFn(leaguesList[0]);
  const dateList = expandDateRange(sampleDate);

  if (leaguesList.length >= 10) {
    const promises = dateList.map(d => fetchMatchesByLeagueOrAll('all', d));
    const results = await Promise.all(promises);
    const eventMap = new Map();
    results.flat().forEach(e => eventMap.set(e.id, e));
    return Array.from(eventMap.values());
  }

  const BATCH_SIZE = 5;
  let allEvents = [];

  for (let i = 0; i < leaguesList.length; i += BATCH_SIZE) {
    const batch = leaguesList.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (league) => {
      const leagueDateList = expandDateRange(getDateStrFn(league));
      const datePromises = leagueDateList.map(d => fetchMatchesByLeagueOrAll(league.id, d));
      const dateResults = await Promise.all(datePromises);
      const map = new Map();
      dateResults.flat().forEach(e => map.set(e.id, e));
      return Array.from(map.values());
    });

    const results = await Promise.all(promises);
    allEvents.push(...results.flat());
  }

  return allEvents;
}

// 1. ESPN League Logo Loader
async function loadMultiTierLeagueLogo(img, leagueId, leagueName, primaryUrl) {
  if (!leagueName || dataSaverMode || img.dataset.logoProcessed === 'true') return;
  img.dataset.logoProcessed = 'true';

  const cacheKey = `league_logo_${leagueId}`;

  if (leagueLogoCache[cacheKey]) {
    img.src = leagueLogoCache[cacheKey];
    return;
  }

  const dbCached = await getPhotoFromCache(cacheKey);
  if (dbCached) {
    leagueLogoCache[cacheKey] = dbCached;
    img.src = dbCached;
    return;
  }

  if (primaryUrl) {
    leagueLogoCache[cacheKey] = primaryUrl;
    await savePhotoToCache(cacheKey, primaryUrl);
    img.src = primaryUrl;
    img.onerror = () => {
      img.src = generateUnlicensedLeagueBadge(leagueId, leagueName);
    };
    return;
  }

  img.src = generateUnlicensedLeagueBadge(leagueId, leagueName);
}

// 2. ESPN Player Photo Loader
async function loadMultiTierPlayerPhoto(img, pId, pName) {
  if (!pName || dataSaverMode || img.dataset.photoProcessed === 'true') return;
  img.dataset.photoProcessed = 'true';

  const cleanedName = typeof cleanPlayerName === 'function' ? cleanPlayerName(pName) : pName.trim();

  if (playerPhotoCache[cleanedName]) {
    img.src = playerPhotoCache[cleanedName];
    return;
  }

  const dbCached = await getPhotoFromCache(cleanedName);
  if (dbCached) {
    playerPhotoCache[cleanedName] = dbCached;
    img.src = dbCached;
    return;
  }

  const espnUrl = pId 
    ? `https://a.espncdn.com/i/headshots/soccer/players/full/${pId}.png` 
    : null;

  if (espnUrl) {
    const testImg = new Image();
    testImg.src = espnUrl;
    testImg.onload = async () => {
      img.src = espnUrl;
      playerPhotoCache[cleanedName] = espnUrl;
      await savePhotoToCache(cleanedName, espnUrl);
    };
    testImg.onerror = () => {
      showPlayerCircleFallback(img, cleanedName);
    };
  } else {
    showPlayerCircleFallback(img, cleanedName);
  }
}

// Fallback Lingkaran Avatar Bulat
function showPlayerCircleFallback(img, pName) {
  img.onerror = null;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=22c55e&color=ffffff&bold=true&rounded=true&size=128`;
  img.src = avatarUrl;
}

// 3. Fetch Detail / Summary Pertandingan (ESPN API)
async function fetchMatchSummary(leagueId, eventId) {
  if (!leagueId || !eventId) {
    console.error("League ID atau Event ID tidak valid:", { leagueId, eventId });
    return null;
  }

  if (isLiga1LeagueId(leagueId)) {
    const cachedEvent = Array.isArray(cachedEvents)
      ? cachedEvents.find(event => String(event.id) === String(eventId))
      : null;
    return fetchLiga1MatchDetailSummary(cachedEvent, 'BRI SUPER LEAGUE 2026-27');
  }

  if (isLiga2LeagueId(leagueId)) {
    const cachedEvent = Array.isArray(cachedEvents)
      ? cachedEvents.find(event => String(event.id) === String(eventId))
      : null;
    return fetchLiga2MatchDetailSummary(cachedEvent, 'Pegadaian Championship 2026-27');
  }

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/summary?event=${eventId}`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    return await res.json();
  } catch (err) {
    console.error("Gagal mengambil summary dari ESPN API:", err);
    return null;
  }
}

// 4. Fetch All Matches (Memisahkan Sumber Replit Liga 1 & ESPN)
async function fetchAllMatches() {
  const container = document.getElementById('matches-container');

  try {
    const targetDate = selectedDateFilter || getFormattedDate(new Date());
    let allEvents = [];

    // Jika filter khusus Liga 1 -> Ambil murni dari Replit
    if (isLiga2LeagueId(selectedLeague)) {
      allEvents = await fetchLiga2EventsForDate(targetDate);
    }
    else if (
      selectedLeague === 'idn.1' ||
      selectedLeague === 'indonesia.1' ||
      selectedLeague === 'liga1'
    ) {
      const [upcomingEvents, finishedEvents] = await Promise.all([
        fetchLigaIndonesiaData(targetDate),
        fetchLigaIndonesiaFinishedData(targetDate)
      ]);

      allEvents = [
        ...finishedEvents,
        ...upcomingEvents
      ];
    } 
    // Jika filter 'Semua Liga' -> Ambil ESPN + Replit Liga 1 secara paralel
    else if (selectedLeague === 'all') {
      const [
        espnEvents,
        indoEvents,
        finishedIndoEvents,
        liga2Events
      ] = await Promise.all([
        fetchBatchLeagues(LEAGUES.filter(l => !isLiga2LeagueId(l.id) && !isLiga1LeagueId(l.id)), () => targetDate),
        fetchLigaIndonesiaData(targetDate),
        fetchLigaIndonesiaFinishedData(targetDate),
        fetchLiga2EventsForDate(targetDate)
      ]);

      allEvents = [
        ...finishedIndoEvents,
        ...indoEvents,
        ...liga2Events,
        ...espnEvents
      ];
    } 
    // Jika filter liga asing (EPL, La Liga, UCL, dll.) -> Murni 100% dari ESPN
    else {
      const targets = LEAGUES.filter(l => l.id === selectedLeague);
      allEvents = await fetchBatchLeagues(targets, () => targetDate);
    }

    const uniqueEvents = new Map();
    allEvents.forEach(event => {
      uniqueEvents.set(String(event.id), event);
    });

    allEvents = sortEventsByFavoriteAndDate(
      Array.from(uniqueEvents.values()).filter(
        event => !isExcludedNcaamatch(event)
      )
    );
    cachedEvents = allEvents;

    allEvents.forEach(evt => monitorLiveFavoriteEvents(evt));
    renderMatchesCards('matches-container', allEvents, selectedLeague === 'all');
  } catch (err) {
    console.error("Gagal mengambil data pertandingan:", err);
  } finally {
    if (container) container.classList.remove('hidden');
  }
}

// 5. Fetch Live Matches Structured
async function fetchLiveMatchesStructured() {
  const container = document.getElementById('live-container');
  if (!container) return;

  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
    const dateRangeStr = `${getFormattedDate(yesterday)}-${getFormattedDate(today)}`;

    const [allEventsRaw, indoEvents, liga2Events] = await Promise.all([
      fetchBatchLeagues(LEAGUES.filter(l => !isLiga2LeagueId(l.id) && !isLiga1LeagueId(l.id)), () => dateRangeStr),
      fetchLigaIndonesiaData(),
      fetchLiga2EventsForDate()
    ]);

    const eventMap = new Map();
    allEventsRaw.forEach(evt => eventMap.set(evt.id, evt));
    indoEvents.forEach(evt => eventMap.set(evt.id, evt));
    liga2Events.forEach(evt => eventMap.set(evt.id, evt));

    let allEvents = Array.from(eventMap.values()).filter(
      event => !isExcludedNcaamatch(event)
    );
    
    cachedEvents = allEvents;
    allEvents.forEach(evt => monitorLiveFavoriteEvents(evt));

    const now = new Date();
    const past24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const next12h = new Date(now.getTime() + (12 * 60 * 60 * 1000));

    const finishedEvents = sortEventsByFavoriteAndDate(allEvents.filter(e => {
      const d = new Date(e.date);
      return e.status?.type?.state === 'post' && d >= past24h;
    }));

    const liveEvents = sortEventsByFavoriteAndDate(allEvents.filter(e => e.status?.type?.state === 'in'));

    const upcomingEvents = sortEventsByFavoriteAndDate(allEvents.filter(e => {
      const d = new Date(e.date);
      return e.status?.type?.state === 'pre' && d > now && d <= next12h;
    }));

    container.innerHTML = '';

    const finishedSec = document.createElement('div');
    finishedSec.className = 'space-y-2.5';
    finishedSec.innerHTML = `
      <button onclick="toggleFinishedInLiveView()" class="w-full bg-[#180d30] border border-white/10 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-400 font-bold hover:bg-[#231344] transition shadow-lg">
        <span class="flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-emerald-400"></i> Pertandingan Selesai (24 Jam Terakhir) (${finishedEvents.length})
        </span>
        <i id="finished-toggle-icon" class="fa-solid fa-chevron-${showFinishedInLive ? 'up' : 'down'} text-[10px]"></i>
      </button>
      <div id="live-finished-grid" class="space-y-2.5 ${showFinishedInLive ? '' : 'hidden'}"></div>
    `;
    container.appendChild(finishedSec);
    renderMatchesCards('live-finished-grid', finishedEvents, true);

    const liveSec = document.createElement('div');
    liveSec.className = 'space-y-2.5';
    liveSec.innerHTML = `
      <div class="flex items-center justify-between pb-1 border-b border-white/10 text-slate-300">
        <span class="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
          <span class="flex h-2 w-2 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Pertandingan Sedang Live
        </span>
        <span class="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">${liveEvents.length}</span>
      </div>
      <div id="live-active-grid" class="space-y-2.5"></div>
    `;
    container.appendChild(liveSec);
    renderMatchesCards('live-active-grid', liveEvents, true);

    const upcomingSec = document.createElement('div');
    upcomingSec.className = 'space-y-2.5';
    upcomingSec.innerHTML = `
      <button onclick="toggleUpcomingInLiveView()" class="w-full bg-[#180d30] border border-white/10 p-3 rounded-xl flex items-center justify-between text-xs text-blue-400 font-bold hover:bg-[#231344] transition shadow-lg">
        <span class="flex items-center gap-2">
          <i class="fa-regular fa-calendar-days text-blue-400"></i> Pertandingan Mendatang (12 Jam Ke Depan) (${upcomingEvents.length})
        </span>
        <i id="upcoming-toggle-icon" class="fa-solid fa-chevron-${showUpcomingInLive ? 'up' : 'down'} text-[10px]"></i>
      </button>
      <div id="live-upcoming-grid" class="space-y-2.5 ${showUpcomingInLive ? '' : 'hidden'}"></div>
    `;
    container.appendChild(upcomingSec);
    renderMatchesCards('live-upcoming-grid', upcomingEvents, true);
  } catch (err) {
    console.error("Gagal memuat laga live:", err);
  } finally {
    container.classList.remove('hidden');
  }
}

// 6. Fetch Favorited Matches
async function fetchFavoritedMatchesStructured() {
  const container = document.getElementById('fav-container');
  if (!container) return;

  if (favoriteMatches.length === 0 && favoriteTeams.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 px-4 text-slate-400 bg-[#180d30] border border-white/10 rounded-2xl">
        <i class="fa-solid fa-star text-3xl text-amber-500/40 mb-3 block"></i>
        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">Belum Ada Favorit</h3>
        <p class="text-[11px] text-slate-400">Tekan ikon bintang <i class="fa-regular fa-star text-amber-400"></i> pada pertandingan atau klub untuk menampilkannya di sini.</p>
      </div>
    `;
    container.classList.remove('hidden');
    return;
  }

  try {
    const today = new Date();
    const past2Days = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000));
    const next7Days = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    const dateRangeStr = `${getFormattedDate(past2Days)}-${getFormattedDate(next7Days)}`;

    const [allEventsRaw, indoEvents, liga2Events] = await Promise.all([
      fetchBatchLeagues(LEAGUES.filter(l => !isLiga2LeagueId(l.id) && !isLiga1LeagueId(l.id)), () => dateRangeStr),
      fetchLigaIndonesiaData(),
      fetchLiga2EventsForDate()
    ]);

    const eventMap = new Map();
    allEventsRaw.forEach(evt => eventMap.set(evt.id, evt));
    indoEvents.forEach(evt => eventMap.set(evt.id, evt));
    liga2Events.forEach(evt => eventMap.set(evt.id, evt));

    const favEvents = Array.from(eventMap.values())
      .filter(evt => !isExcludedNcaamatch(evt))
      .filter(evt => {
      const comp = evt.competitions?.[0];
      const homeId = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.id;
      const awayId = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.id;

      return isFavorite(evt.id) || isTeamFavorite(homeId) || isTeamFavorite(awayId);
      });

    cachedEvents = favEvents;
    favEvents.forEach(evt => monitorLiveFavoriteEvents(evt));

    const finishedEvents = sortEventsByFavoriteAndDate(favEvents.filter(e => e.status?.type?.state === 'post'));
    const liveEvents = sortEventsByFavoriteAndDate(favEvents.filter(e => e.status?.type?.state === 'in'));
    const upcomingEvents = sortEventsByFavoriteAndDate(favEvents.filter(e => e.status?.type?.state === 'pre'));

    container.innerHTML = '';

    if (finishedEvents.length === 0 && liveEvents.length === 0 && upcomingEvents.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 text-slate-400 bg-[#180d30] border border-white/10 rounded-2xl text-xs">
          <i class="fa-solid fa-calendar-xmark text-2xl mb-2 block text-slate-500"></i>
          Tidak ada jadwal pertandingan untuk klub/pertandingan favorit Anda minggu ini.
        </div>
      `;
      return;
    }

    if (liveEvents.length > 0) {
      const liveSec = document.createElement('div');
      liveSec.className = 'space-y-2.5 mb-4';
      liveSec.innerHTML = `
        <div class="flex items-center justify-between pb-1.5 border-b border-red-500/30 text-slate-300">
          <span class="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Pertandingan Live (${liveEvents.length})
          </span>
        </div>
        <div id="fav-active-grid" class="space-y-2.5"></div>
      `;
      container.appendChild(liveSec);
      renderMatchesCards('fav-active-grid', liveEvents, true);
    }

    if (finishedEvents.length > 0) {
      showFinishedInFav = false;
      const finishedSec = document.createElement('div');
      finishedSec.className = 'space-y-2.5 mb-4';
      finishedSec.innerHTML = `
        <button onclick="toggleFinishedInFavView()" class="w-full bg-[#180d30] border border-emerald-500/80 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-400 font-bold hover:bg-[#231344] transition shadow-lg">
          <span class="flex items-center gap-2">
            <i class="fa-solid fa-circle-check text-emerald-400"></i> Pertandingan Selesai (${finishedEvents.length})
          </span>
          <i id="fav-finished-toggle-icon" class="fa-solid fa-chevron-down text-[10px]"></i>
        </button>
        <div id="fav-finished-grid" class="space-y-2.5 hidden"></div>
      `;
      container.appendChild(finishedSec);
      renderMatchesCards('fav-finished-grid', finishedEvents, true, 'finished-fav');
    }

    if (upcomingEvents.length > 0) {
      showUpcomingInFav = true;
      const upcomingSec = document.createElement('div');
      upcomingSec.className = 'space-y-2.5 pt-2 border-t border-white/10';
      upcomingSec.innerHTML = `
        <button onclick="toggleUpcomingInFavView()" class="w-full bg-[#180d30] border border-white/10 p-3 rounded-xl flex items-center justify-between text-xs text-blue-400 font-bold hover:bg-[#231344] transition shadow-lg">
          <span class="flex items-center gap-2">
            <i class="fa-regular fa-calendar-days text-blue-400"></i> Pertandingan Mendatang (${upcomingEvents.length})
          </span>
          <i id="fav-upcoming-toggle-icon" class="fa-solid fa-chevron-up text-[10px]"></i>
        </button>
        <div id="fav-upcoming-grid" class="space-y-2.5"></div>
      `;
      container.appendChild(upcomingSec);
      renderMatchesCards('fav-upcoming-grid', upcomingEvents, true);
    }
  } catch (err) {
    console.error("Gagal memuat favorit:", err);
  } finally {
    container.classList.remove('hidden');
  }
}

// 7. Fetch 5 Pertandingan Terakhir Tim
async function fetchTeamRecentMatches(leagueId, teamId) {
  try {
    const currentYear = new Date().getFullYear();
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/schedule`);
    if (!res.ok) return [];
    
    const data = await res.json();
    let events = data.events || [];

    let finished = events
      .filter(e => e.status?.type?.state === 'post')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (finished.length < 5) {
      try {
        const prevRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/schedule?season=${currentYear - 1}`);
        if (prevRes.ok) {
          const prevData = await prevRes.json();
          const prevEvents = prevData.events || [];

          const prevFinished = prevEvents
            .filter(e => e.status?.type?.state === 'post')
            .sort((a, b) => new Date(b.date) - new Date(a.date));

          const combinedMap = new Map();
          [...finished, ...prevFinished].forEach(e => combinedMap.set(e.id, e));
          
          finished = Array.from(combinedMap.values())
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        }
      } catch (err) {}
    }

    return finished.slice(0, 5);
  } catch (e) {
    return [];
  }
}

// 8. Fetch dan Render Bagian Form & Head to Head (H2H)
async function fetchFormAndH2H(leagueId, homeTeamId, awayTeamId, homeName, awayName, h2hEvents) {
  const container = document.getElementById('mcontent-h2h');
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-400"></i>
      <p class="text-xs">Memuat 5 laga terakhir & H2H...</p>
    </div>
  `;

  try {
    const [homeRecent, awayRecent] = await Promise.all([
      fetchTeamRecentMatches(leagueId, homeTeamId),
      fetchTeamRecentMatches(leagueId, awayTeamId)
    ]);

    let h2hHtml = '';
    if (h2hEvents && h2hEvents.length > 0) {
      h2hHtml = `
        <div class="space-y-2 pt-2">
          <h4 class="text-xs font-bold uppercase text-slate-400 tracking-wider">Pertemuan Head to Head</h4>
          <div class="space-y-2">
            ${h2hEvents.map(m => {
              const hTeam = m.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home');
              const aTeam = m.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away');
              const matchDate = formatLocalDate(m.date);

              return `
                <div class="bg-[#180d30] p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <span class="text-[9px] text-slate-400 w-1/3">${matchDate}</span>
                  <div class="flex items-center justify-center gap-1.5 w-2/3">
                    <span class="font-semibold text-slate-200 text-right truncate w-5/12">${hTeam?.team?.shortDisplayName || ''}</span>
                    <span class="font-bold bg-white/10 px-1.5 py-0.5 rounded text-emerald-400 text-[11px]">${hTeam?.score || '0'} -${aTeam?.score || '0'}</span>
                    <span class="font-semibold text-slate-200 text-left truncate w-5/12">${aTeam?.team?.shortDisplayName || ''}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      h2hHtml = `
        <div class="text-center py-4 text-slate-400 bg-[#180d30] rounded-xl border border-white/10 text-xs">
          Data H2H langsung tidak tersedia.
        </div>
      `;
    }

    container.innerHTML = `
      <div class="space-y-3">
        <div class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <i class="fa-solid fa-clock-rotate-left text-emerald-400"></i> 5 Pertandingan Terakhir
        </div>
        ${renderFormBlock(homeName, homeRecent, homeTeamId)}
        ${renderFormBlock(awayName, awayRecent, awayTeamId)}
        ${h2hHtml}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="text-center py-4 text-red-400 text-xs">Gagal memuat data H2H.</div>`;
  }
}