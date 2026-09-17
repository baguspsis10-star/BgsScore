// ==========================================
// API & NETWORK DATA FETCHING MODULE (ESPN API + DATA.JS INTEGRATION)
// ==========================================

// 1. Helper pemecah rentang tanggal "YYYYMMDD-YYYYMMDD" menjadi array tanggal harian
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
    dates.push(typeof getFormattedDate === 'function' ? getFormattedDate(cur) : cur.toISOString().slice(0,10).replace(/-/g,''));
    cur.setDate(cur.getDate() + 1);
    count++;
  }
  return dates.length > 0 ? dates : [startStr];
}

// 2. Helper pencocokan data liga dari response ESPN dengan array LEAGUES di data.js
function matchLeagueWithDataJs(extractedSlug, rawName, currentSlug) {
  if (typeof LEAGUES === 'undefined' || !Array.isArray(LEAGUES)) return null;

  const cleanRaw = rawName ? rawName.toLowerCase().trim() : '';

  return LEAGUES.find(l => {
    const lId = l.id.toLowerCase();
    const lName = l.name.toLowerCase();

    return (
      (extractedSlug && lId === extractedSlug.toLowerCase()) ||
      (currentSlug && currentSlug !== 'all' && lId === currentSlug.toLowerCase()) ||
      (cleanRaw && lName === cleanRaw) ||
      (cleanRaw && (cleanRaw.includes(lName) || lName.includes(cleanRaw)))
    );
  });
}

// 3. Helper utama fetch pertandingan ESPN & mapping otomatis ke data.js
async function fetchMatchesByLeagueOrAll(leagueId, dateStr) {
  const slug = (!leagueId || leagueId === 'all') ? 'all' : leagueId;
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${dateStr}`);
    if (!res.ok) return [];
    const data = await res.json();
    
    const rootLeague = data.leagues?.[0];

    return (data.events || []).map(evt => {
      const comp = evt.competitions?.[0];
      
      // Ekstrak League ID / Slug dari ESPN API
      let extractedSlug = evt.league?.slug || comp?.league?.slug || evt.season?.slug || rootLeague?.slug;
      
      if (!extractedSlug && evt.uid) {
        const uidMatch = evt.uid.match(/~l:([^~]+)/);
        if (uidMatch) extractedSlug = uidMatch[1];
      }

      // Ekstrak Nama Liga Mentah
      const rawName = evt.league?.name || comp?.league?.name || evt.season?.name || rootLeague?.name || evt.leagueName;

      // Pencocokan presisi dengan LEAGUES di data.js
      const foundLeague = matchLeagueWithDataJs(extractedSlug, rawName, slug);

      const finalLeagueName = foundLeague?.name || rawName || 'Liga Sepak Bola';
      const finalLeagueId = foundLeague?.id || extractedSlug || slug;
      const finalLeagueFlag = foundLeague?.flag || (typeof getLeagueFlag === 'function' ? getLeagueFlag(finalLeagueId) : '⚽');
      const finalLeagueLogo = foundLeague?.logo || evt.league?.logos?.[0]?.href || rootLeague?.logos?.[0]?.href || PLAIN_SHIELD_LOGO;
      const finalCategory = foundLeague?.category || 'Lainnya';

      return {
        ...evt,
        leagueName: finalLeagueName,
        leagueId: finalLeagueId,
        leagueLogo: finalLeagueLogo,
        leagueFlag: finalLeagueFlag,
        leagueCategory: finalCategory
      };
    });
  } catch (e) {
    return [];
  }
}

// 4. Batch Fetcher teroptimasi untuk memanggil seluruh liga dari data.js
async function fetchBatchLeagues(leaguesList, getDateStrFn) {
  if (!leaguesList || leaguesList.length === 0) return [];

  const eventMap = new Map();
  const sampleDate = getDateStrFn(leaguesList[0]);
  const dateList = expandDateRange(sampleDate);

  // Jika memanggil banyak liga (mode 'all'), fetch endpoint global + batch liga khusus agar liga lokal terpanggil
  if (leaguesList.length >= 10) {
    const globalPromises = dateList.map(d => fetchMatchesByLeagueOrAll('all', d));
    const globalResults = await Promise.all(globalPromises);
    globalResults.flat().forEach(e => eventMap.set(e.id, e));
  }

  // Batch fetch liga per 5 item dari data.js
  const BATCH_SIZE = 5;
  for (let i = 0; i < leaguesList.length; i += BATCH_SIZE) {
    const batch = leaguesList.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (league) => {
      const leagueDateList = expandDateRange(getDateStrFn(league));
      const datePromises = leagueDateList.map(d => fetchMatchesByLeagueOrAll(league.id, d));
      const dateResults = await Promise.all(datePromises);
      return dateResults.flat();
    });

    const results = await Promise.all(promises);
    results.flat().forEach(e => eventMap.set(e.id, e));
  }

  return Array.from(eventMap.values());
}

// 5. Logo & Photo Loaders dengan Dukungan IndexedDB & Memory Cache dari data.js
async function loadMultiTierLeagueLogo(img, leagueId, leagueName, primaryUrl) {
  if (!leagueName || (typeof dataSaverMode !== 'undefined' && dataSaverMode) || img.dataset.logoProcessed === 'true') return;
  img.dataset.logoProcessed = 'true';

  const cacheKey = `league_logo_${leagueId}`;

  if (typeof leagueLogoCache !== 'undefined' && leagueLogoCache[cacheKey]) {
    img.src = leagueLogoCache[cacheKey];
    return;
  }

  if (typeof getPhotoFromCache === 'function') {
    const dbCached = await getPhotoFromCache(cacheKey);
    if (dbCached) {
      if (typeof leagueLogoCache !== 'undefined') leagueLogoCache[cacheKey] = dbCached;
      img.src = dbCached;
      return;
    }
  }

  if (primaryUrl) {
    if (typeof leagueLogoCache !== 'undefined') leagueLogoCache[cacheKey] = primaryUrl;
    if (typeof savePhotoToCache === 'function') await savePhotoToCache(cacheKey, primaryUrl);
    img.src = primaryUrl;
    img.onerror = () => {
      img.src = typeof generateUnlicensedLeagueBadge === 'function' 
        ? generateUnlicensedLeagueBadge(leagueId, leagueName) 
        : PLAIN_SHIELD_LOGO;
    };
    return;
  }

  img.src = typeof generateUnlicensedLeagueBadge === 'function' 
    ? generateUnlicensedLeagueBadge(leagueId, leagueName) 
    : PLAIN_SHIELD_LOGO;
}

async function loadMultiTierPlayerPhoto(img, pId, pName) {
  if (!pName || (typeof dataSaverMode !== 'undefined' && dataSaverMode) || img.dataset.photoProcessed === 'true') return;
  img.dataset.photoProcessed = 'true';

  const cleanedName = typeof cleanPlayerName === 'function' ? cleanPlayerName(pName) : pName.trim();

  if (typeof playerPhotoCache !== 'undefined' && playerPhotoCache[cleanedName]) {
    img.src = playerPhotoCache[cleanedName];
    return;
  }

  if (typeof getPhotoFromCache === 'function') {
    const dbCached = await getPhotoFromCache(cleanedName);
    if (dbCached) {
      if (typeof playerPhotoCache !== 'undefined') playerPhotoCache[cleanedName] = dbCached;
      img.src = dbCached;
      return;
    }
  }

  const espnUrl = pId ? `https://a.espncdn.com/i/headshots/soccer/players/full/${pId}.png` : null;

  if (espnUrl) {
    const testImg = new Image();
    testImg.src = espnUrl;
    testImg.onload = async () => {
      img.src = espnUrl;
      if (typeof playerPhotoCache !== 'undefined') playerPhotoCache[cleanedName] = espnUrl;
      if (typeof savePhotoToCache === 'function') await savePhotoToCache(cleanedName, espnUrl);
    };
    testImg.onerror = () => showPlayerCircleFallback(img, cleanedName);
  } else {
    showPlayerCircleFallback(img, cleanedName);
  }
}

function showPlayerCircleFallback(img, pName) {
  img.onerror = null;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=22c55e&color=ffffff&bold=true&rounded=true&size=128`;
  img.src = avatarUrl;
}

// 6. Fetch Detail / Summary Pertandingan
async function fetchMatchSummary(leagueId, eventId) {
  if (!eventId) return null;
  const targetLeague = leagueId || 'all';

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${targetLeague}/summary?event=${eventId}`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Gagal mengambil summary dari ESPN API:", err);
    return null;
  }
}

// 7. Fetch Semua Pertandingan Sesuai Filter data.js
async function fetchAllMatches() {
  const container = document.getElementById('matches-container');

  try {
    const targetDate = selectedDateFilter || (typeof getFormattedDate === 'function' ? getFormattedDate(new Date()) : new Date().toISOString().slice(0,10).replace(/-/g,''));

    const targets = selectedLeague === 'all' 
      ? LEAGUES 
      : LEAGUES.filter(l => l.id === selectedLeague);

    let allEvents = await fetchBatchLeagues(targets, () => targetDate);

    if (typeof sortEventsByFavoriteAndDate === 'function') {
      allEvents = sortEventsByFavoriteAndDate(allEvents);
    }
    
    cachedEvents = allEvents;

    if (typeof monitorLiveFavoriteEvents === 'function') {
      allEvents.forEach(evt => monitorLiveFavoriteEvents(evt));
    }
    
    if (typeof renderMatchesCards === 'function') {
      renderMatchesCards('matches-container', allEvents, selectedLeague === 'all');
    }
  } catch (err) {
    console.error("Gagal mengambil data pertandingan ESPN:", err);
  } finally {
    if (container) container.classList.remove('hidden');
  }
}

// 8. Fetch Pertandingan Live (Struktur 24j Terakhir, Live, & 12j Mendatang)
async function fetchLiveMatchesStructured() {
  const container = document.getElementById('live-container');
  if (!container) return;

  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
    const formatDateFn = typeof getFormattedDate === 'function' ? getFormattedDate : (d) => d.toISOString().slice(0,10).replace(/-/g,'');
    const dateRangeStr = `${formatDateFn(yesterday)}-${formatDateFn(today)}`;

    const allEventsRaw = await fetchBatchLeagues(LEAGUES, () => dateRangeStr);

    const eventMap = new Map();
    allEventsRaw.forEach(evt => eventMap.set(evt.id, evt));

    let allEvents = Array.from(eventMap.values());
    cachedEvents = allEvents;

    if (typeof monitorLiveFavoriteEvents === 'function') {
      allEvents.forEach(evt => monitorLiveFavoriteEvents(evt));
    }

    const now = new Date();
    const past24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const next12h = new Date(now.getTime() + (12 * 60 * 60 * 1000));

    const sortFn = typeof sortEventsByFavoriteAndDate === 'function' ? sortEventsByFavoriteAndDate : (arr) => arr;

    const finishedEvents = sortFn(allEvents.filter(e => {
      const d = new Date(e.date);
      return e.status?.type?.state === 'post' && d >= past24h;
    }));

    const liveEvents = sortFn(allEvents.filter(e => e.status?.type?.state === 'in'));

    const upcomingEvents = sortFn(allEvents.filter(e => {
      const d = new Date(e.date);
      return e.status?.type?.state === 'pre' && d > now && d <= next12h;
    }));

    container.innerHTML = '';

    // Section Finished
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
    if (typeof renderMatchesCards === 'function') renderMatchesCards('live-finished-grid', finishedEvents, true);

    // Section Live
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
    if (typeof renderMatchesCards === 'function') renderMatchesCards('live-active-grid', liveEvents, true);

    // Section Upcoming
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
    if (typeof renderMatchesCards === 'function') renderMatchesCards('live-upcoming-grid', upcomingEvents, true);
  } catch (err) {
    console.error("Gagal memuat laga live:", err);
  } finally {
    container.classList.remove('hidden');
  }
}

// 9. Fetch Pertandingan Favorit Berdasarkan State data.js
async function fetchFavoritedMatchesStructured() {
  const container = document.getElementById('fav-container');
  if (!container) return;

  const hasFavMatches = typeof favoriteMatches !== 'undefined' && favoriteMatches.length > 0;
  const hasFavTeams = typeof favoriteTeams !== 'undefined' && favoriteTeams.length > 0;

  if (!hasFavMatches && !hasFavTeams) {
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
    const formatDateFn = typeof getFormattedDate === 'function' ? getFormattedDate : (d) => d.toISOString().slice(0,10).replace(/-/g,'');
    const dateRangeStr = `${formatDateFn(past2Days)}-${formatDateFn(next7Days)}`;

    const allEventsRaw = await fetchBatchLeagues(LEAGUES, () => dateRangeStr);

    const eventMap = new Map();
    allEventsRaw.forEach(evt => eventMap.set(evt.id, evt));

    const favEvents = Array.from(eventMap.values()).filter(evt => {
      const comp = evt.competitions?.[0];
      const homeId = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.id;
      const awayId = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.id;

      const favMatchCheck = typeof isFavorite === 'function' ? isFavorite(evt.id) : (favoriteMatches && favoriteMatches.includes(evt.id));
      const favTeamCheck = typeof isTeamFavorite === 'function' ? (isTeamFavorite(homeId) || isTeamFavorite(awayId)) : false;

      return favMatchCheck || favTeamCheck;
    });

    cachedEvents = favEvents;
    if (typeof monitorLiveFavoriteEvents === 'function') favEvents.forEach(evt => monitorLiveFavoriteEvents(evt));

    const sortFn = typeof sortEventsByFavoriteAndDate === 'function' ? sortEventsByFavoriteAndDate : (arr) => arr;
    const finishedEvents = sortFn(favEvents.filter(e => e.status?.type?.state === 'post'));
    const liveEvents = sortFn(favEvents.filter(e => e.status?.type?.state === 'in'));
    const upcomingEvents = sortFn(favEvents.filter(e => e.status?.type?.state === 'pre'));

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

    if (liveEvents.length > 0 && typeof renderMatchesCards === 'function') {
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

    if (finishedEvents.length > 0 && typeof renderMatchesCards === 'function') {
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

    if (upcomingEvents.length > 0 && typeof renderMatchesCards === 'function') {
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

// 10. Fetch 5 Laga Terakhir Tim
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

// 11. Fetch Form & Head to Head (H2H)
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
              const matchDate = typeof formatLocalDate === 'function' ? formatLocalDate(m.date) : new Date(m.date).toLocaleDateString('id-ID');

              return `
                <div class="bg-[#180d30] p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <span class="text-[9px] text-slate-400 w-1/3">${matchDate}</span>
                  <div class="flex items-center justify-center gap-1.5 w-2/3">
                    <span class="font-semibold text-slate-200 text-right truncate w-5/12">${hTeam?.team?.shortDisplayName || ''}</span>
                    <span class="font-bold bg-white/10 px-1.5 py-0.5 rounded text-emerald-400 text-[11px]">${hTeam?.score \vert{}\vert{} '0'} -${aTeam?.score || '0'}</span>
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

    const renderBlockFn = typeof renderFormBlock === 'function' ? renderFormBlock : () => '';

    container.innerHTML = `
      <div class="space-y-3">
        <div class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <i class="fa-solid fa-clock-rotate-left text-emerald-400"></i> 5 Pertandingan Terakhir
        </div>
        ${renderBlockFn(homeName, homeRecent, homeTeamId)}
        ${renderBlockFn(awayName, awayRecent, awayTeamId)}
        ${h2hHtml}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="text-center py-4 text-red-400 text-xs">Gagal memuat data H2H.</div>`;
  }
}
