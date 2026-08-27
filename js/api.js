// API & NETWORK DATA FETCHING MODULE (100% PURE ESPN API)

// ESPN League Logo Loader
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

// ESPN Player Photo Loader
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

  const espnUrl = pId 
    ? `https://a.espncdn.com/i/headshots/soccer/players/full/${pId}.png` 
    : `https://a.espncdn.com/i/headshots/nophoto.png`;

  img.src = espnUrl;
  img.onerror = () => {
    img.src = `https://a.espncdn.com/i/headshots/nophoto.png`;
  };

  playerPhotoCache[cleanedName] = espnUrl;
  await savePhotoToCache(cleanedName, espnUrl);
}

// Fetch All Matches for Selected Date and League Filter
async function fetchAllMatches() {
  const container = document.getElementById('matches-container');

  try {
    const targets = selectedLeague === 'all' 
      ? LEAGUES 
      : LEAGUES.filter(l => l.id === selectedLeague);

    const espnPromises = targets.map(async (league) => {
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard?dates=${selectedDateFilter}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.events || []).map(evt => ({ 
          ...evt, 
          leagueName: league.name, 
          leagueId: league.id, 
          leagueLogo: league.logo,
          leagueFlag: league.flag 
        }));
      } catch (e) {
        return [];
      }
    });

    const espnResults = await Promise.all(espnPromises);
    let allEvents = espnResults.flat();

    allEvents = sortEventsByFavoriteAndDate(allEvents);
    cachedEvents = allEvents;

    allEvents.forEach(evt => monitorLiveFavoriteEvents(evt));
    renderMatchesCards('matches-container', allEvents, selectedLeague === 'all');
  } catch (err) {
    console.error("Gagal mengambil data pertandingan ESPN:", err);
  } finally {
    if (container) container.classList.remove('hidden');
  }
}

// Fetch Live Matches (Finished 24h, Active Live, Upcoming 12h)
async function fetchLiveMatchesStructured() {
  const container = document.getElementById('live-container');
  if (!container) return;

  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
    const dateRangeStr = `${getFormattedDate(yesterday)}-${getFormattedDate(today)}`;

    const espnPromises = LEAGUES.map(async (league) => {
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard?dates=${dateRangeStr}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.events || []).map(evt => ({ 
          ...evt, 
          leagueName: league.name, 
          leagueId: league.id, 
          leagueLogo: league.logo,
          leagueFlag: league.flag 
        }));
      } catch (e) {
        return [];
      }
    });

    const allEventArrays = await Promise.all(espnPromises);

    const eventMap = new Map();
    allEventArrays.flat().forEach(evt => eventMap.set(evt.id, evt));

    let allEvents = Array.from(eventMap.values());
    
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
  } catch (err) {
    console.error("Gagal memuat laga live:", err);
  } finally {
    container.classList.remove('hidden');
  }
}

// Fetch Favorited Matches
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

  try {
    const today = new Date();
    const past2Days = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000));
    const next7Days = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    const dateRangeStr = `${getFormattedDate(past2Days)}-${getFormattedDate(next7Days)}`;

    const espnPromises = LEAGUES.map(async (league) => {
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard?dates=${dateRangeStr}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.events || []).map(evt => ({ 
          ...evt, 
          leagueName: league.name, 
          leagueId: league.id, 
          leagueLogo: league.logo,
          leagueFlag: league.flag 
        }));
      } catch (e) {
        return [];
      }
    });

    const allEventArrays = await Promise.all(espnPromises);

    const eventMap = new Map();
    allEventArrays.flat().forEach(evt => eventMap.set(evt.id, evt));

    const favEvents = Array.from(eventMap.values()).filter(evt => {
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
      renderMatchesCards('fav-finished-grid', finishedEvents, true, 'finished-fav');
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
  } catch (err) {
    console.error("Gagal memuat favorit:", err);
  } finally {
    container.classList.remove('hidden');
  }
}

// Fetch Last 5 Matches for Specific Team
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
  } catch (err) {
    container.innerHTML = `<div class="text-center py-4 text-red-400 text-xs">Gagal memuat data H2H.</div>`;
  }
}
