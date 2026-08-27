// ==========================================
// 1. STATE & CACHE GLOBAL
// ==========================================
let dataSaverMode = false;
let leagueLogoCache = {};
let playerPhotoCache = {};
let cachedEvents = [];
let favoriteMatches = [];
let favoriteTeams = [];
let selectedLeague = 'all';
let selectedDateFilter = new Date().toISOString().split('T')[0].replace(/-/g, '');

let showFinishedInLive = false;
let showUpcomingInLive = true;
let showFinishedInFav = false;
let showUpcomingInFav = true;

// Daftar liga murni ESPN (Liga Korea dihapus)
const LEAGUES = [
  { id: 'eng.1', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'esp.1', name: 'La Liga', flag: '🇪🇸' },
  { id: 'ita.1', name: 'Serie A', flag: '🇮🇹' },
  { id: 'ger.1', name: 'Bundesliga', flag: '🇩🇪' },
  { id: 'idn.1', name: 'BRI Liga 1', flag: '🇮🇩' }
];

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================
async function getPhotoFromCache(key) { return null; }
async function savePhotoToCache(key, value) {}
function cleanPlayerName(name) { return name ? name.trim() : ''; }
function isPlayerNameMatching(a, b) { return true; }
async function getBase64FromUrl(url) { return url; }
function generateUnlicensedLeagueBadge(id, name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'L')}&background=0f172a&color=38bdf8&bold=true`;
}
function getFormattedDate(d) { return d.toISOString().split('T')[0].replace(/-/g, ''); }
function formatLocalDate(dStr) { return new Date(dStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); }
function isFavorite(id) { return favoriteMatches.includes(id); }
function isTeamFavorite(id) { return favoriteTeams.includes(id); }
function monitorLiveFavoriteEvents(evt) {}
function sortEventsByFavoriteAndDate(events) { return events; }

// Toggle Handlers Tampilan
function toggleFinishedInLiveView() {
  showFinishedInLive = !showFinishedInLive;
  const grid = document.getElementById('live-finished-grid');
  const icon = document.getElementById('finished-toggle-icon');
  if (grid) grid.classList.toggle('hidden', !showFinishedInLive);
  if (icon) icon.className = `fa-solid fa-chevron-${showFinishedInLive ? 'up' : 'down'} text-[10px]`;
}

function toggleUpcomingInLiveView() {
  showUpcomingInLive = !showUpcomingInLive;
  const grid = document.getElementById('live-upcoming-grid');
  const icon = document.getElementById('upcoming-toggle-icon');
  if (grid) grid.classList.toggle('hidden', !showUpcomingInLive);
  if (icon) icon.className = `fa-solid fa-chevron-${showUpcomingInLive ? 'up' : 'down'} text-[10px]`;
}

function toggleFinishedInFavView() {
  showFinishedInFav = !showFinishedInFav;
  const grid = document.getElementById('fav-finished-grid');
  const icon = document.getElementById('fav-finished-toggle-icon');
  if (grid) grid.classList.toggle('hidden', !showFinishedInFav);
  if (icon) icon.className = `fa-solid fa-chevron-${showFinishedInFav ? 'up' : 'down'} text-[10px]`;
}

function toggleUpcomingInFavView() {
  showUpcomingInFav = !showUpcomingInFav;
  const grid = document.getElementById('fav-upcoming-grid');
  const icon = document.getElementById('fav-upcoming-toggle-icon');
  if (grid) grid.classList.toggle('hidden', !showUpcomingInFav);
  if (icon) icon.className = `fa-solid fa-chevron-${showUpcomingInFav ? 'up' : 'down'} text-[10px]`;
}

// ==========================================
// 3. LOGO & PLAYER PHOTO LOADERS
// ==========================================
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

  const testImage = (url) => new Promise((resolve) => {
    const tester = new Image();
    tester.src = url;
    tester.onload = () => resolve(true);
    tester.onerror = () => resolve(false);
  });

  const isGenericTrophy = !primaryUrl || primaryUrl.endsWith('/4.png') || primaryUrl.includes('5d4x5v1534346808.png');

  if (!isGenericTrophy) {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(primaryUrl)}&w=100&output=webp`;
    if (await testImage(proxyUrl)) {
      leagueLogoCache[cacheKey] = proxyUrl;
      await savePhotoToCache(cacheKey, proxyUrl);
      img.src = proxyUrl;
      return;
    }
  }

  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?l=${encodeURIComponent(leagueName)}`);
    const data = await res.json();
    const found = data?.countrys?.[0] || data?.leagues?.[0];
    const tsdbBadge = found?.strBadge || found?.strLogo;
    
    if (tsdbBadge && !tsdbBadge.includes('5d4x5v1534346808.png')) {
      const proxyTsdb = `https://images.weserv.nl/?url=${encodeURIComponent(tsdbBadge)}&w=100&output=webp`;
      if (await testImage(proxyTsdb)) {
        leagueLogoCache[cacheKey] = proxyTsdb;
        await savePhotoToCache(cacheKey, proxyTsdb);
        img.src = proxyTsdb;
        return;
      }
    }
  } catch (e) {}

  img.src = generateUnlicensedLeagueBadge(leagueId, leagueName);
}

async function loadMultiTierPlayerPhoto(img, pId, pName) {
  if (!pName || dataSaverMode || img.dataset.photoProcessed === 'true') return;
  img.dataset.photoProcessed = 'true';

  const cleanedName = cleanPlayerName(pName);

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

  if (pId) {
    const espnUrl = `https://a.espncdn.com/i/headshots/soccer/players/full/${pId}.png`;
    const espnLoaded = await new Promise(resolve => {
      const tester = new Image();
      tester.src = espnUrl;
      tester.onload = () => resolve(true);
      tester.onerror = () => resolve(false);
    });

    if (espnLoaded) {
      const base64Data = await getBase64FromUrl(espnUrl);
      playerPhotoCache[cleanedName] = base64Data;
      await savePhotoToCache(cleanedName, base64Data);
      img.src = base64Data;
      return;
    }
  }

  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(cleanedName)}`);
    const data = await res.json();
    if (data?.player && Array.isArray(data.player)) {
      const matchedPlayer = data.player.find(p => 
        p.strSport && 
        p.strSport.toLowerCase() === 'soccer' && 
        isPlayerNameMatching(pName, p.strPlayer)
      );

      const tsdbPhoto = matchedPlayer?.strCutout || matchedPlayer?.strRender || matchedPlayer?.strThumb;
      if (tsdbPhoto) {
        const base64Data = await getBase64FromUrl(tsdbPhoto);
        playerPhotoCache[cleanedName] = base64Data;
        await savePhotoToCache(cleanedName, base64Data);
        img.src = base64Data;
        return;
      }
    }
  } catch (e) {}

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=0f172a&color=38bdf8&bold=true`;
  playerPhotoCache[cleanedName] = avatarUrl;
  await savePhotoToCache(cleanedName, avatarUrl);
  img.src = avatarUrl;
}

// ==========================================
// 4. RENDER UI COMPONENTS
// ==========================================
function renderMatchesCards(containerId, events, showLeagueHeader = true) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
        Tidak ada pertandingan ditemukan.
      </div>`;
    return;
  }

  container.innerHTML = events.map(evt => {
    const comp = evt.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');
    const state = evt.status?.type?.state;
    const isLive = state === 'in';
    const isPost = state === 'post';
    const statusText = evt.status?.type?.shortDetail || 'VS';

    return `
      <div onclick="fetchMatchDetails('${evt.id}', '${evt.leagueId}')" 
           class="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 rounded-xl cursor-pointer transition shadow-md hover:bg-slate-800/50">
        
        ${showLeagueHeader ? `
          <div class="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800/60 mb-2">
            <span class="font-semibold flex items-center gap-1.5">
              <span>${evt.leagueFlag || '⚽'}</span> ${evt.leagueName}
            </span>
            ${isLive ? `<span class="text-red-400 font-bold animate-pulse">● LIVE</span>` : ''}
          </div>
        ` : ''}

        <div class="flex items-center justify-between text-xs">
          <!-- Tim Tuan Rumah -->
          <div class="flex items-center gap-2 w-5/12">
            <img src="${home?.team?.logo || ''}" class="w-6 h-6 object-contain" onerror="this.src='https://ui-avatars.com/api/?name=H'" />
            <span class="font-semibold text-slate-200 truncate">${home?.team?.shortDisplayName || home?.team?.displayName || 'Home'}</span>
          </div>

          <!-- Skor / Status -->
          <div class="flex flex-col items-center justify-center w-2/12 text-center">
            <span class="font-bold px-2 py-0.5 rounded text-[11px] ${isLive ? 'bg-red-500/20 text-red-400' : isPost ? 'bg-slate-800 text-emerald-400' : 'bg-slate-800 text-slate-300'}">
              ${isPost || isLive ? `${home?.score || 0} - ${away?.score || 0}` : statusText}
            </span>
          </div>

          <!-- Tim Tamu -->
          <div class="flex items-center justify-end gap-2 w-5/12 text-right">
            <span class="font-semibold text-slate-200 truncate">${away?.team?.shortDisplayName || away?.team?.displayName || 'Away'}</span>
            <img src="${away?.team?.logo || ''}" class="w-6 h-6 object-contain" onerror="this.src='https://ui-avatars.com/api/?name=A'" />
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFormBlock(teamName, recentMatches, teamId) {
  if (!recentMatches || recentMatches.length === 0) {
    return `<div class="text-[11px] text-slate-500 py-1">Tidak ada data riwayat untuk ${teamName}</div>`;
  }

  return `
    <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
      <div class="text-xs font-bold text-slate-300 mb-2">${teamName}</div>
      <div class="flex gap-1.5">
        ${recentMatches.map(m => {
          const comp = m.competitions?.[0];
          const myTeam = comp?.competitors?.find(c => String(c.team?.id) === String(teamId));
          const oppTeam = comp?.competitors?.find(c => String(c.team?.id) !== String(teamId));
          
          let resultClass = 'bg-slate-700 text-slate-300';
          let resultChar = 'D';

          if (myTeam && oppTeam) {
            const myScore = parseInt(myTeam.score || 0);
            const oppScore = parseInt(oppTeam.score || 0);
            if (myScore > oppScore) { resultClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'; resultChar = 'W'; }
            else if (myScore < oppScore) { resultClass = 'bg-red-500/20 text-red-400 border border-red-500/30'; resultChar = 'L'; }
          }

          return `<span class="w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${resultClass}">${resultChar}</span>`;
        }).join('')}
      </div>
    </div>
  `;
}

// Modal Detail Pertandingan
async function fetchMatchDetails(eventId, leagueId) {
  let modalContainer = document.getElementById('match-modal');
  
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'match-modal';
    modalContainer.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    document.body.appendChild(modalContainer);
  }

  modalContainer.classList.remove('hidden');
  modalContainer.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full text-center text-slate-400 text-xs shadow-2xl">
      <i class="fa-solid fa-circle-notch fa-spin text-emerald-400 text-2xl mb-2"></i>
      <p>Memuat detail pertandingan...</p>
    </div>
  `;

  try {
    const validLeague = leagueId && leagueId !== 'undefined' ? leagueId : 'eng.1';
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${validLeague}/summary?event=${eventId}`);
    const data = await res.json();

    const header = data.header?.competitions?.[0];
    const home = header?.competitors?.find(c => c.homeAway === 'home');
    const away = header?.competitors?.find(c => c.homeAway === 'away');

    modalContainer.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b border-slate-800 pb-2">
          <span class="text-xs font-bold text-slate-300">${data.header?.league?.name || 'Detail Pertandingan'}</span>
          <button onclick="document.getElementById('match-modal').classList.add('hidden')" class="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        <div class="flex items-center justify-between py-2">
          <div class="text-center w-5/12">
            <img src="${home?.team?.logos?.[0]?.href || ''}" class="w-12 h-12 mx-auto mb-1 object-contain" />
            <div class="text-xs font-bold text-slate-200">${home?.team?.displayName || 'Home'}</div>
          </div>
          <div class="text-center w-2/12">
            <span class="text-xl font-black text-emerald-400">${home?.score || '0'} - ${away?.score || '0'}</span>
            <div class="text-[10px] text-slate-500 mt-1">${data.header?.status?.type?.shortDetail || ''}</div>
          </div>
          <div class="text-center w-5/12">
            <img src="${away?.team?.logos?.[0]?.href || ''}" class="w-12 h-12 mx-auto mb-1 object-contain" />
            <div class="text-xs font-bold text-slate-200">${away?.team?.displayName || 'Away'}</div>
          </div>
        </div>

        <div id="mcontent-h2h" class="pt-2"></div>
      </div>
    `;

    if (home?.team?.id && away?.team?.id) {
      fetchFormAndH2H(validLeague, home.team.id, away.team.id, home.team.displayName, away.team.displayName, data.headToHead || []);
    }

  } catch (err) {
    console.error("Gagal memuat detail:", err);
    modalContainer.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full text-center text-red-400 text-xs">
        Gagal memuat detail pertandingan.
        <button onclick="document.getElementById('match-modal').classList.add('hidden')" class="mt-4 block mx-auto px-4 py-1.5 bg-slate-800 text-slate-200 rounded-lg">Tutup</button>
      </div>`;
  }
}

// ==========================================
// 5. ESPN API FETCHING LOGIC (100% ESPN)
// ==========================================
async function fetchAllMatches() {
  const targets = selectedLeague === 'all' 
    ? LEAGUES 
    : LEAGUES.filter(l => l.id === selectedLeague);

  const espnPromises = targets.map(league => 
    fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard?dates=${selectedDateFilter}`)
      .then(res => res.json())
      .then(data => (data.events || []).map(evt => ({ 
        ...evt, 
        leagueName: league.name, 
        leagueId: league.id, 
        leagueLogo: league.logo,
        leagueFlag: league.flag 
      })))
      .catch(() => [])
  );

  const espnResults = await Promise.all(espnPromises);
  let allEvents = espnResults.flat();

  allEvents = sortEventsByFavoriteAndDate(allEvents);
  cachedEvents = allEvents;

  allEvents.forEach(evt => monitorLiveFavoriteEvents(evt));

  renderMatchesCards('matches-container', allEvents, selectedLeague === 'all');
  const container = document.getElementById('matches-container');
  if (container) container.classList.remove('hidden');
}

async function fetchLiveMatchesStructured() {
  const container = document.getElementById('live-container');
  if (!container) return;

  const today = new Date();
  const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
  const dateRangeStr = `${getFormattedDate(yesterday)}-${getFormattedDate(today)}`;

  const espnPromises = LEAGUES.map(league => 
    fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard?dates=${dateRangeStr}`)
      .then(res => res.json())
      .then(data => (data.events || []).map(evt => ({ 
        ...evt, 
        leagueName: league.name, 
        leagueId: league.id, 
        leagueLogo: league.logo,
        leagueFlag: league.flag 
      })))
      .catch(() => [])
  );

  const allEventArrays = await Promise.all(espnPromises);
  let allEvents = allEventArrays.flat();

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
    <button onclick="toggleFinishedInLiveView()" class="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-400 font-bold hover:bg-slate-800/80 transition shadow-lg">
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
    <div class="flex items-center justify-between pb-1 border-b border-slate-800 text-slate-300">
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
    <button onclick="toggleUpcomingInLiveView()" class="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs text-blue-400 font-bold hover:bg-slate-800/80 transition shadow-lg">
      <span class="flex items-center gap-2">
        <i class="fa-regular fa-calendar-days text-blue-400"></i> Pertandingan Mendatang (12 Jam Ke Depan) (${upcomingEvents.length})
      </span>
      <i id="upcoming-toggle-icon" class="fa-solid fa-chevron-${showUpcomingInLive ? 'up' : 'down'} text-[10px]"></i>
    </button>
    <div id="live-upcoming-grid" class="space-y-2.5 ${showUpcomingInLive ? '' : 'hidden'}"></div>
  `;
  container.appendChild(upcomingSec);
  renderMatchesCards('live-upcoming-grid', upcomingEvents, true);

  container.classList.remove('hidden');
}

async function fetchFavoritedMatchesStructured() {
  const container = document.getElementById('fav-container');
  if (!container) return;

  if (favoriteMatches.length === 0 && favoriteTeams.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 px-4 text-slate-500 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <i class="fa-solid fa-star text-3xl text-amber-500/40 mb-3 block"></i>
        <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Belum Ada Favorit</h3>
        <p class="text-[11px] text-slate-400">Tekan ikon bintang <i class="fa-regular fa-star text-amber-400"></i> pada pertandingan atau klub untuk menampilkannya di sini.</p>
      </div>
    `;
    container.classList.remove('hidden');
    return;
  }

  const today = new Date();
  const past2Days = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000));
  const next7Days = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
  const dateRangeStr = `${getFormattedDate(past2Days)}-${getFormattedDate(next7Days)}`;

  const espnPromises = LEAGUES.map(league => 
    fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard?dates=${dateRangeStr}`)
      .then(res => res.json())
      .then(data => (data.events || []).map(evt => ({ 
        ...evt, 
        leagueName: league.name, 
        leagueId: league.id, 
        leagueLogo: league.logo,
        leagueFlag: league.flag 
      })))
      .catch(() => [])
  );

  const allEventArrays = await Promise.all(espnPromises);
  let allEvents = allEventArrays.flat();

  const favEvents = allEvents.filter(evt => {
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
      <div class="text-center py-10 text-slate-500 bg-slate-900/40 border border-slate-800 rounded-2xl text-xs">
        <i class="fa-solid fa-calendar-xmark text-2xl mb-2 block text-slate-600"></i>
        Tidak ada jadwal pertandingan untuk klub/pertandingan favorit Anda minggu ini.
      </div>
    `;
    container.classList.remove('hidden');
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
      <button onclick="toggleFinishedInFavView()" class="w-full bg-slate-900 border border-emerald-500/80 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-400 font-bold hover:bg-slate-800/80 transition shadow-lg shadow-emerald-950/20">
        <span class="flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-emerald-400"></i> Pertandingan Selesai (${finishedEvents.length})
        </span>
        <i id="fav-finished-toggle-icon" class="fa-solid fa-chevron-down text-[10px]"></i>
      </button>
      <div id="fav-finished-grid" class="space-y-2.5 hidden"></div>
    `;
    container.appendChild(finishedSec);
    renderMatchesCards('fav-finished-grid', finishedEvents, true);
  }

  if (upcomingEvents.length > 0) {
    showUpcomingInFav = true;

    const upcomingSec = document.createElement('div');
    upcomingSec.className = 'space-y-2.5 pt-2 border-t border-slate-800/60';
    upcomingSec.innerHTML = `
      <button onclick="toggleUpcomingInFavView()" class="w-full bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs text-blue-400 font-bold hover:bg-slate-800/80 transition shadow-lg">
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

  container.classList.remove('hidden');
}

async function fetchTeamRecentMatches(leagueId, teamId) {
  try {
    const validLeague = leagueId && leagueId !== 'undefined' ? leagueId : 'eng.1';
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${validLeague}/teams/${teamId}/schedule`);
    const data = await res.json();
    let events = data.events || [];

    let finished = events
      .filter(e => e.status?.type?.state === 'post')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return finished.slice(0, 5);
  } catch (e) {
    return [];
  }
}

async function fetchFormAndH2H(leagueId, homeTeamId, awayTeamId, homeName, awayName, h2hEvents) {
  const container = document.getElementById('mcontent-h2h');
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-500"></i>
      <p class="text-xs">Memuat 5 laga terakhir & H2H...</p>
    </div>
  `;

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
              <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                <span class="text-[9px] text-slate-500 w-1/3">${matchDate}</span>
                <div class="flex items-center justify-center gap-1.5 w-2/3">
                  <span class="font-semibold text-slate-300 text-right truncate w-5/12">${hTeam?.team?.shortDisplayName || ''}</span>
                  <span class="font-bold bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 text-[11px]">${hTeam?.score || '0'} - ${aTeam?.score || '0'}</span>
                  <span class="font-semibold text-slate-300 text-left truncate w-5/12">${aTeam?.team?.shortDisplayName || ''}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    h2hHtml = `
      <div class="text-center py-4 text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
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
}
