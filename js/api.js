// ==========================================
// API & NETWORK DATA FETCHING MODULE (ESPN API + AVATAR CIRCLE FALLBACK)
// ==========================================

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

    return (data.events || []).map(evt => {
      const comp = evt.competitions?.[0];
      
      // 1. Ekstrak Identifier Liga dari event
      let espnLeagueId = evt.league?.id || comp?.league?.id;
      let espnLeagueSlug = evt.league?.slug || comp?.league?.slug || evt.season?.slug;

      // Terkadang ID tersembunyi di dalam UID (contoh: s:600~l:2~e:12345 -> '2' adalah ID liga)
      if (evt.uid) {
        const uidMatch = evt.uid.match(/~l:([^~]+)/);
        if (uidMatch) {
          const extracted = uidMatch[1];
          if (!isNaN(extracted)) espnLeagueId = espnLeagueId || extracted; // Jika angka, berarti itu ID
          else espnLeagueSlug = espnLeagueSlug || extracted; // Jika teks, berarti itu slug
        }
      }

      // 2. Ambil metadata RESMI liga dari array root data.leagues
      // Ini mencegah nama turnamen tertimpa oleh nama fase seperti "League Phase" atau "Third Round"
      const officialLeague = (data.leagues || []).find(l => 
        (espnLeagueId && l.id === espnLeagueId) || 
        (espnLeagueSlug && l.slug === espnLeagueSlug)
      ) || data.leagues?.[0];

      // 3. Ekstrak Slug Akhir
      let extractedSlug = officialLeague?.slug || espnLeagueSlug;

      // 4. Ekstrak Nama Mentah (Prioritaskan officialLeague agar nama fase tertimpa)
      let rawName = officialLeague?.name || evt.league?.name || comp?.league?.name || evt.season?.name || evt.leagueName;

      // Jaga-jaga jika masih bocor dan terbaca sebagai fase turnamen
      const isPhaseName = rawName && /phase|round|stage|group|final|qualifying/i.test(rawName);
      if ((!rawName || isPhaseName) && extractedSlug) {
        rawName = extractedSlug
          .split(/[.-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      // 5. Cari pencocokan presisi di daftar LEAGUES lokal (data.js)
      const foundLeague = typeof LEAGUES !== 'undefined' 
        ? LEAGUES.find(l => 
            (extractedSlug && (l.id === extractedSlug || extractedSlug.startsWith(l.id + '.'))) || 
            (slug !== 'all' && l.id === slug) ||
            (rawName && l.name.toLowerCase() === rawName.toLowerCase()) ||
            (rawName && rawName.toLowerCase().includes(l.name.toLowerCase()))
          ) 
        : null;

      // 6. Terapkan hasil akhir ke objek pertandingan
      const finalLeagueName = foundLeague?.name || rawName || 'Pertandingan';
      const finalLeagueId = foundLeague?.id || extractedSlug || slug;
      const finalLeagueFlag = foundLeague?.flag || (typeof getLeagueFlag === 'function' ? getLeagueFlag(finalLeagueId) : '⚽');
      const finalLeagueLogo = foundLeague?.logo || officialLeague?.logos?.[0]?.href || evt.league?.logos?.[0]?.href || '';

      return {
        ...evt,
        leagueName: finalLeagueName,
        leagueId: finalLeagueId,
        leagueLogo: finalLeagueLogo,
        leagueFlag: finalLeagueFlag
      };
    });
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
    // Mode 'all': fetch setiap tanggal harian secara paralel
    const promises = dateList.map(d => fetchMatchesByLeagueOrAll('all', d));
    const results = await Promise.all(promises);
    const eventMap = new Map();
    results.flat().forEach(e => eventMap.set(e.id, e));
    return Array.from(eventMap.values());
  }

  // Mode spesifik liga
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

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/summary?event=${eventId}`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    return await res.json();
  } catch (err) {
    console.error("Gagal mengambil summary dari ESPN API:", err);
    return null;
  }
}

// 4. Fetch All Matches
async function fetchAllMatches() {
  const container = document.getElementById('matches-container');

  try {
    const targetDate = selectedDateFilter || getFormattedDate(new Date());

    const targets = selectedLeague === 'all' 
      ? LEAGUES 
      : LEAGUES.filter(l => l.id === selectedLeague);

    let allEvents = await fetchBatchLeagues(targets, () => targetDate);

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

// 5. Fetch Live Matches
async function fetchLiveMatchesStructured() {
  const container = document.getElementById('live-container');
  if (!container) return;

  try {
    const today = new Date();
    const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
    const dateRangeStr = `${getFormattedDate(yesterday)}-${getFormattedDate(today)}`;

    const allEventsRaw = await fetchBatchLeagues(LEAGUES, () => dateRangeStr);

    const eventMap = new Map();
    allEventsRaw.forEach(evt => eventMap.set(evt.id, evt));

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

    const allEventsRaw = await fetchBatchLeagues(LEAGUES, () => dateRangeStr);

    const eventMap = new Map();
    allEventsRaw.forEach(evt => eventMap.set(evt.id, evt));

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
                    <span class="font-bold bg-white/10 px-1.5 py-0.5 rounded text-emerald-400 text-[11px]">${hTeam?.score || '0'} - ${aTeam?.score || '0'}</span>
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
