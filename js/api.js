// API & NETWORK DATA FETCHING MODULE

// Kamus Pemetaan ID/Slug Liga ESPN ke Nama & Bendera Resmi
const LEAGUE_DICT = {
  // Slug Strings
  'eng.1': { name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'esp.1': { name: 'La Liga', flag: '🇪🇸' },
  'ita.1': { name: 'Serie A', flag: '🇮🇹' },
  'ger.1': { name: 'Bundesliga', flag: '🇩🇪' },
  'fra.1': { name: 'Ligue 1', flag: '🇫🇷' },
  'ned.1': { name: 'Eredivisie', flag: '🇳🇱' },
  'por.1': { name: 'Primeira Liga', flag: '🇵🇹' },
  'tur.1': { name: 'Süper Lig', flag: '🇹🇷' },
  'bel.1': { name: 'Pro League', flag: '🇧🇪' },
  'sco.1': { name: 'Scottish Premiership', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  'uefa.champions': { name: 'UEFA Champions League', flag: '🇪🇺' },
  'uefa.europa': { name: 'UEFA Europa League', flag: '🇪🇺' },
  'uefa.europa.conf': { name: 'UEFA Conference League', flag: '🇪🇺' },
  'uefa.nations': { name: 'UEFA Nations League', flag: '🇪🇺' },
  'idn.1': { name: 'BRI Liga 1', flag: '🇮🇩' },
  'idn.2': { name: 'Pegadaian Liga 2', flag: '🇮🇩' },
  'kr.1': { name: 'K League 1', flag: '🇰🇷' },
  'kr.2': { name: 'K League 2', flag: '🇰🇷' },
  'jpn.1': { name: 'J1 League', flag: '🇯🇵' },
  'usa.1': { name: 'MLS', flag: '🇺🇸' },
  'arg.1': { name: 'Liga Profesional', flag: '🇦🇷' },
  'bra.1': { name: 'Brasileirão', flag: '🇧🇷' },
  'saudi.1': { name: 'Saudi Pro League', flag: '🇸🇦' },
  'fifa.friendly': { name: 'Laga Persahabatan', flag: '🌐' },
  'club.friendly': { name: 'Persahabatan Klub', flag: '⚽' },

  // Angka ID ESPN Fallback
  '8': { name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', slug: 'eng.1' },
  '15': { name: 'La Liga', flag: '🇪🇸', slug: 'esp.1' },
  '12': { name: 'Serie A', flag: '🇮🇹', slug: 'ita.1' },
  '10': { name: 'Bundesliga', flag: '🇩🇪', slug: 'ger.1' },
  '9': { name: 'Ligue 1', flag: '🇫🇷', slug: 'fra.1' },
  '11': { name: 'Eredivisie', flag: '🇳🇱', slug: 'ned.1' },
  '14': { name: 'Primeira Liga', flag: '🇵🇹', slug: 'por.1' },
  '18': { name: 'Süper Lig', flag: '🇹🇷', slug: 'tur.1' },
  '5': { name: 'Scottish Premiership', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', slug: 'sco.1' },
  '2': { name: 'UEFA Champions League', flag: '🇪🇺', slug: 'uefa.champions' },
  '3': { name: 'UEFA Europa League', flag: '🇪🇺', slug: 'uefa.europa' },
  '2310': { name: 'UEFA Conference League', flag: '🇪🇺', slug: 'uefa.europa.conf' },
  '2070': { name: 'UEFA Nations League', flag: '🇪🇺', slug: 'uefa.nations' },
  '19': { name: 'MLS', flag: '🇺🇸', slug: 'usa.1' }
};

// Helper Ekstraksi Data Liga Presisi & Anti-Crash dari ESPN Event
function extractLeagueDataFromEvent(evt, globalLeagues = []) {
  try {
    if (!evt) return { leagueId: 'club.friendly', leagueName: 'Liga', leagueLogo: '', leagueFlag: '⚽' };

    let rawId = String(evt.league?.id || evt.competitions?.[0]?.league?.id || '');
    let rawSlug = String(evt.league?.slug || evt.competitions?.[0]?.league?.slug || evt.season?.slug || '');

    if (!rawId && evt.uid) {
      const match = evt.uid.match(/~l:([^~]+)~/);
      if (match) rawId = match[1];
    }

    const leaguesList = Array.isArray(globalLeagues) ? globalLeagues : [];
    const foundGlobal = leaguesList.find(g => 
      (g.id && String(g.id) === rawId) || 
      (g.slug && String(g.slug) === rawSlug) ||
      (g.uid && evt.uid && evt.uid.includes(g.uid))
    );

    const nameFromApi = foundGlobal?.name || foundGlobal?.displayName || evt.league?.name || evt.competitions?.[0]?.league?.name || evt.competitions?.[0]?.notes?.[0]?.headline || '';

    const dictInfo = LEAGUE_DICT[rawSlug] || LEAGUE_DICT[rawId] || LEAGUE_DICT[foundGlobal?.slug] || LEAGUE_DICT[foundGlobal?.id] || {};
    const appLeagues = (typeof LEAGUES !== 'undefined' && Array.isArray(LEAGUES)) ? LEAGUES : [];
    const matchedApp = appLeagues.find(l => l.id === rawSlug || l.id === dictInfo.slug || l.id === foundGlobal?.slug) || {};

    let finalName = dictInfo.name || matchedApp.name || nameFromApi || 'Liga';

    if (typeof finalName === 'string') {
      finalName = finalName.replace(/\s*\(\d+\)/g, '').trim();
    } else {
      finalName = 'Liga';
    }

    if (!finalName || finalName.toLowerCase() === 'liga' || finalName.toLowerCase() === 'regular-season') {
      finalName = dictInfo.name || matchedApp.name || (nameFromApi && nameFromApi.toLowerCase() !== 'regular-season' ? nameFromApi : 'Liga');
    }

    const finalSlug = matchedApp.id || dictInfo.slug || foundGlobal?.slug || rawSlug || 'club.friendly';

    let finalFlag = '⚽';
    if (matchedApp.flag) finalFlag = matchedApp.flag;
    else if (dictInfo.flag) finalFlag = dictInfo.flag;
    else if (typeof getLeagueFlag === 'function') {
      try { finalFlag = getLeagueFlag(finalSlug); } catch(e) {}
    }

    return {
      leagueId: finalSlug,
      leagueName: finalName,
      leagueLogo: matchedApp.logo || evt.league?.logos?.[0]?.href || foundGlobal?.logos?.[0]?.href || '',
      leagueFlag: finalFlag
    };
  } catch (err) {
    console.error("Error extractLeagueDataFromEvent:", err);
    return {
      leagueId: 'club.friendly',
      leagueName: 'Liga',
      leagueLogo: '',
      leagueFlag: '⚽'
    };
  }
}

// Multi-Tier League Logo Loader (ESPN -> SportsDB -> Custom Badge Fallback)
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

// Multi-Tier Player Photo Loader (ESPN -> SportsDB -> UI Avatars Fallback)
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

// Fetch Fallback Match Data via Fotmob API (Khusus Korea & Indonesia)
async function fetchFotmobMatches(dateStr) {
  try {
    const res = await fetch(`https://www.fotmob.com/api/matches?date=${dateStr}`);
    const data = await res.json();
    
    // ID Liga Fotmob: 47 (Indo 1), 8985 (Indo 2), 140 (Korea 1), 9131 (Korea 2)
    const targetFotmobIds = [47, 8985, 140, 9131];
    const filteredLeagues = (data.leagues || []).filter(l => 
      targetFotmobIds.includes(l.id) || 
      (l.name && (l.name.toLowerCase().includes('k league') || l.name.toLowerCase().includes('indonesia')))
    );

    let parsedEvents = [];
    filteredLeagues.forEach(league => {
      let mappedLeagueId = 'idn.1';
      let mappedLeagueName = league.name;

      if (league.id === 140 || league.name.includes('K League 1')) {
        mappedLeagueId = 'kr.1';
        mappedLeagueName = 'K League 1';
      } else if (league.id === 9131 || league.name.includes('K League 2')) {
        mappedLeagueId = 'kr.2';
        mappedLeagueName = 'K League 2';
      } else if (league.id === 8985) {
        mappedLeagueId = 'idn.2';
        mappedLeagueName = 'Pegadaian Liga 2';
      } else if (league.id === 47) {
        mappedLeagueId = 'idn.1';
        mappedLeagueName = 'BRI Liga 1';
      }

      const flagEmoji = mappedLeagueId.startsWith('kr') ? "🇰🇷" : "🇮🇩";

      (league.matches || []).forEach(m => {
        parsedEvents.push({
          id: `fotmob_${m.id}`,
          date: m.status?.utcTime || new Date().toISOString(),
          leagueName: mappedLeagueName,
          leagueId: mappedLeagueId,
          leagueFlag: flagEmoji,
          status: {
            type: {
              state: m.status?.started ? (m.status?.finished ? 'post' : 'in') : 'pre',
              shortDetail: m.status?.scoreStr || (m.status?.cancelled ? 'Canceled' : 'VS'),
              description: m.status?.reason?.short || ''
            }
          },
          competitions: [{
            competitors: [
              {
                homeAway: 'home',
                score: String(m.home?.score ?? 0),
                team: { 
                  id: m.home?.id, 
                  displayName: m.home?.name, 
                  shortDisplayName: m.home?.name,
                  logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${m.home?.id}.png`
                }
              },
              {
                homeAway: 'away',
                score: String(m.away?.score ?? 0),
                team: { 
                  id: m.away?.id, 
                  displayName: m.away?.name, 
                  shortDisplayName: m.away?.name,
                  logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${m.away?.id}.png`
                }
              }
            ]
          }]
        });
      });
    });

    return parsedEvents;
  } catch (err) {
    console.warn("Gagal mengambil data pertandingan dari API Fotmob:", err);
    return [];
  }
}

// Fetch All Matches for Selected Date and League Filter
async function fetchAllMatches() {
  try {
    let espnEvents = [];
    
    if (selectedLeague === 'all') {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${selectedDateFilter}`);
      const data = await res.json();
      const globalLeagues = data.leagues || [];
      espnEvents = (data.events || []).map(evt => {
        const lData = extractLeagueDataFromEvent(evt, globalLeagues);
        return {
          ...evt,
          leagueName: lData.leagueName,
          leagueId: lData.leagueId,
          leagueLogo: lData.leagueLogo,
          leagueFlag: lData.leagueFlag
        };
      });
    } else {
      const matched = (typeof LEAGUES !== 'undefined' ? LEAGUES : []).find(l => l.id === selectedLeague) || {};
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${selectedLeague}/scoreboard?dates=${selectedDateFilter}`);
      const data = await res.json();
      const globalLeagues = data.leagues || [];
      espnEvents = (data.events || []).map(evt => {
        const lData = extractLeagueDataFromEvent(evt, globalLeagues);
        return {
          ...evt,
          leagueName: matched.name || lData.leagueName || 'Liga',
          leagueId: selectedLeague,
          leagueLogo: matched.logo || lData.leagueLogo || '',
          leagueFlag: matched.flag || lData.leagueFlag || '⚽'
        };
      });
    }

    const shouldFetchFotmob = selectedLeague === 'all' || ['kr.1', 'kr.2', 'idn.1', 'idn.2'].includes(selectedLeague);
    const fotmobEvents = shouldFetchFotmob ? await fetchFotmobMatches(selectedDateFilter) : [];

    let allEvents = [...espnEvents];
    if (fotmobEvents.length > 0) {
      const existingIds = new Set(allEvents.map(e => e.id));
      fotmobEvents.forEach(fEvt => {
        if (!existingIds.has(fEvt.id)) {
          allEvents.push(fEvt);
        }
      });
    }

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
    
    document.getElementById('matches-container')?.classList.remove('hidden');
  } catch (err) {
    console.warn("Gagal memuat pertandingan:", err);
    const container = document.getElementById('matches-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-6 text-slate-500 border border-slate-800/40 rounded-2xl bg-slate-900/30 text-xs backdrop-blur">
          Gagal mengambil data pertandingan. Silakan periksa koneksi internet Anda.
        </div>
      `;
      container.classList.remove('hidden');
    }
  }
}

// Fetch Live Matches (Finished 24h, Active Live, Upcoming 12h)
async function fetchLiveMatchesStructured() {
  const container = document.getElementById('live-container');
  if (!container) return;
  
  const today = new Date();
  const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
  const dateRangeStr = `${getFormattedDate(yesterday)}-${getFormattedDate(today)}`;

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${dateRangeStr}`);
    const data = await res.json();
    const globalLeagues = data.leagues || [];
    const espnEvents = (data.events || []).map(evt => {
      const lData = extractLeagueDataFromEvent(evt, globalLeagues);
      return {
        ...evt,
        leagueName: lData.leagueName,
        leagueId: lData.leagueId,
        leagueLogo: lData.leagueLogo,
        leagueFlag: lData.leagueFlag
      };
    });

    const fotmobEvents = await fetchFotmobMatches(getFormattedDate(today));

    const eventMap = new Map();
    espnEvents.forEach(evt => eventMap.set(evt.id, evt));
    fotmobEvents.forEach(evt => {
      if (!eventMap.has(evt.id)) eventMap.set(evt.id, evt);
    });

    let allEvents = Array.from(eventMap.values());
    
    cachedEvents = allEvents;
    if (typeof monitorLiveFavoriteEvents === 'function') {
      allEvents.forEach(evt => monitorLiveFavoriteEvents(evt));
    }

    const now = new Date();
    const past24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const next12h = new Date(now.getTime() + (12 * 60 * 60 * 1000));

    let finishedEvents = allEvents.filter(e => {
      const d = new Date(e.date);
      return e.status?.type?.state === 'post' && d >= past24h;
    });

    let liveEvents = allEvents.filter(e => e.status?.type?.state === 'in');

    let upcomingEvents = allEvents.filter(e => {
      const d = new Date(e.date);
      return e.status?.type?.state === 'pre' && d > now && d <= next12h;
    });

    if (typeof sortEventsByFavoriteAndDate === 'function') {
      finishedEvents = sortEventsByFavoriteAndDate(finishedEvents);
      liveEvents = sortEventsByFavoriteAndDate(liveEvents);
      upcomingEvents = sortEventsByFavoriteAndDate(upcomingEvents);
    }

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
    if (typeof renderMatchesCards === 'function') renderMatchesCards('live-finished-grid', finishedEvents, true);

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
    if (typeof renderMatchesCards === 'function') renderMatchesCards('live-active-grid', liveEvents, true);

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
    if (typeof renderMatchesCards === 'function') renderMatchesCards('live-upcoming-grid', upcomingEvents, true);

    container.classList.remove('hidden');
  } catch (err) {
    console.warn("Gagal memuat data live:", err);
  }
}

// Fetch Favorited Matches (Finished 2 Days, Active Live, & Upcoming 7 Days)
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

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${dateRangeStr}`);
    const data = await res.json();
    const globalLeagues = data.leagues || [];
    const espnEvents = (data.events || []).map(evt => {
      const lData = extractLeagueDataFromEvent(evt, globalLeagues);
      return {
        ...evt,
        leagueName: lData.leagueName,
        leagueId: lData.leagueId,
        leagueLogo: lData.leagueLogo,
        leagueFlag: lData.leagueFlag
      };
    });

    const fotmobEvents = await fetchFotmobMatches(getFormattedDate(today));

    const eventMap = new Map();
    espnEvents.forEach(evt => eventMap.set(evt.id, evt));
    fotmobEvents.forEach(evt => {
      if (!eventMap.has(evt.id)) eventMap.set(evt.id, evt);
    });

    const favEvents = Array.from(eventMap.values()).filter(evt => {
      const comp = evt.competitions?.[0];
      const homeId = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.id;
      const awayId = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.id;

      return isFavorite(evt.id) || isTeamFavorite(homeId) || isTeamFavorite(awayId);
    });

    cachedEvents = favEvents;
    if (typeof monitorLiveFavoriteEvents === 'function') {
      favEvents.forEach(evt => monitorLiveFavoriteEvents(evt));
    }

    let finishedEvents = favEvents.filter(e => e.status?.type?.state === 'post');
    let liveEvents = favEvents.filter(e => e.status?.type?.state === 'in');
    let upcomingEvents = favEvents.filter(e => e.status?.type?.state === 'pre');

    if (typeof sortEventsByFavoriteAndDate === 'function') {
      finishedEvents = sortEventsByFavoriteAndDate(finishedEvents);
      liveEvents = sortEventsByFavoriteAndDate(liveEvents);
      upcomingEvents = sortEventsByFavoriteAndDate(upcomingEvents);
    }

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
      if (typeof renderMatchesCards === 'function') renderMatchesCards('fav-active-grid', liveEvents, true);
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
      if (typeof renderMatchesCards === 'function') renderMatchesCards('fav-finished-grid', finishedEvents, true, 'finished-fav');
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
      if (typeof renderMatchesCards === 'function') renderMatchesCards('fav-upcoming-grid', upcomingEvents, true);
    }

    container.classList.remove('hidden');
  } catch (err) {
    console.warn("Gagal memuat favorit:", err);
  }
}

// Fetch Last 5 Matches for Specific Team Schedule
async function fetchTeamRecentMatches(leagueId, teamId) {
  try {
    const currentYear = new Date().getFullYear();
    
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/schedule`);
    const data = await res.json();
    let events = data.events || [];

    let finished = events
      .filter(e => e.status?.type?.state === 'post')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (finished.length < 5) {
      try {
        const prevRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/schedule?season=${currentYear - 1}`);
        const prevData = await prevRes.json();
        const prevEvents = prevData.events || [];

        const prevFinished = prevEvents
          .filter(e => e.status?.type?.state === 'post')
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const combinedMap = new Map();
        [...finished, ...prevFinished].forEach(e => combinedMap.set(e.id, e));
        
        finished = Array.from(combinedMap.values())
          .sort((a, b) => new Date(b.date) - new Date(a.date));
      } catch (err) {}
    }

    return finished.slice(0, 5);
  } catch (e) {
    return [];
  }
}

// Fetch and Render Form & Head to Head Section
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
      ${typeof renderFormBlock === 'function' ? renderFormBlock(homeName, homeRecent, homeTeamId) : ''}
      ${typeof renderFormBlock === 'function' ? renderFormBlock(awayName, awayRecent, awayTeamId) : ''}
      ${h2hHtml}
    </div>
  `;
}
