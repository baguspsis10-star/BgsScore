// API FETCH & DATA CONTROLLER MODULE - BGS SCOREHUB

// 1. Fetch Seluruh Pertandingan Berdasarkan Tanggal & Filter Liga
async function fetchAllMatches() {
  const container = document.getElementById('matches-container');
  if (!container) return;

  const dateStr = selectedDateFilter || getFormattedDate(new Date());
  
  try {
    let rawEvents = [];

    if (selectedLeague === 'all') {
      // Fetch dari global endpoint ESPN + Liga-liga Utama
      const primaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${dateStr}`;
      const featuredLeagues = ['eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'idn.1', 'uefa.champions', 'usa.1'];
      
      const fetchPromises = [
        fetch(primaryUrl).then(r => r.ok ? r.json() : null).catch(() => null),
        ...featuredLeagues.map(slug => 
          fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${dateStr}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      ];

      const responses = await Promise.all(fetchPromises);
      
      responses.forEach((res, idx) => {
        if (!res || !res.events) return;
        const leagueSlug = idx === 0 ? '' : featuredLeagues[idx - 1];
        
        res.events.forEach(evt => {
          const matchedLeague = LEAGUES.find(l => l.id === leagueSlug || l.id === evt.leagueId) || {};
          rawEvents.push({
            ...evt,
            leagueId: leagueSlug || evt.leagueId || 'all',
            leagueName: evt.leagueName || matchedLeague.name || res.leagues?.[0]?.name || 'Kompetisi',
            leagueFlag: matchedLeague.flag || getLeagueFlag(leagueSlug) || '⚽',
            leagueLogo: matchedLeague.logo || ''
          });
        });
      });
    } else {
      // Fetch Liga Spesifik
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${selectedLeague}/scoreboard?dates=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        const matchedLeague = LEAGUES.find(l => l.id === selectedLeague) || {};
        rawEvents = (data.events || []).map(evt => ({
          ...evt,
          leagueId: selectedLeague,
          leagueName: matchedLeague.name || data.leagues?.[0]?.name || 'Kompetisi',
          leagueFlag: matchedLeague.flag || '⚽',
          leagueLogo: matchedLeague.logo || ''
        }));
      }
    }

    // Deduplikasi Pertandingan Berdasarkan Event ID
    const uniqueEventsMap = new Map();
    rawEvents.forEach(evt => {
      if (!uniqueEventsMap.has(evt.id)) {
        uniqueEventsMap.set(evt.id, evt);
      }
    });

    cachedEvents = Array.from(uniqueEventsMap.values());

    // Jalankan Monitor Suara & Notifikasi untuk Laga Favorit
    cachedEvents.forEach(evt => monitorLiveFavoriteEvents(evt));

    // Render ke UI Container
    container.classList.remove('hidden');
    renderMatchesCards('matches-container', cachedEvents, true);

  } catch (err) {
    console.error("Gagal mengambil data pertandingan:", err);
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400 bg-[#180d30] border border-white/10 rounded-2xl text-xs space-y-2">
        <i class="fa-solid fa-triangle-exclamation text-2xl text-amber-400"></i>
        <p class="font-bold text-white">Gagal memuat pertandingan.</p>
        <p class="text-[10px] text-slate-400">Pastikan koneksi internet kamu stabil dan coba tekan tombol refresh.</p>
      </div>
    `;
    container.classList.remove('hidden');
  }
}

// 2. Fetch Pertandingan Live (Tampilan Tab Live)
async function fetchLiveMatchesStructured() {
  const container = document.getElementById('live-container');
  if (!container) return;

  container.innerHTML = `
    <div class="py-12 text-center text-xs text-slate-400 space-y-2">
      <i class="fa-solid fa-circle-notch fa-spin text-red-500 text-2xl"></i>
      <p class="font-bold text-white">Memuat pertandingan berlangsung...</p>
    </div>
  `;
  container.classList.remove('hidden');

  try {
    const dateStr = getFormattedDate(new Date());
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${dateStr}`);
    let events = [];

    if (res.ok) {
      const data = await res.json();
      events = (data.events || []).map(evt => {
        const matchedLeague = LEAGUES.find(l => l.id === evt.leagueId) || {};
        return {
          ...evt,
          leagueId: evt.leagueId || 'all',
          leagueName: matchedLeague.name || data.leagues?.[0]?.name || 'Kompetisi',
          leagueFlag: matchedLeague.flag || '⚽'
        };
      });
    }

    // Monitoring Notifikasi
    events.forEach(evt => monitorLiveFavoriteEvents(evt));

    const liveEvents = events.filter(e => e.status?.type?.state === 'in');
    const upcomingEvents = events.filter(e => e.status?.type?.state === 'pre');
    const finishedEvents = events.filter(e => e.status?.type?.state === 'post');

    container.innerHTML = '';

    // Sesi 1: Pertandingan Sedang Berlangsung (LIVE)
    const liveBox = document.createElement('div');
    liveBox.className = 'space-y-2.5';
    liveBox.innerHTML = `
      <div class="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-white/10">
        <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span> Live Sekarang (${liveEvents.length})
      </div>
      <div id="live-active-grid" class="space-y-2.5"></div>
    `;
    container.appendChild(liveBox);
    renderMatchesCards('live-active-grid', liveEvents, true);

    // Sesi 2: Pertandingan Mendatang Hari Ini
    if (upcomingEvents.length > 0) {
      const upBox = document.createElement('div');
      upBox.className = 'space-y-2.5 pt-2';
      upBox.innerHTML = `
        <div onclick="toggleUpcomingInLiveView()" class="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center justify-between cursor-pointer pb-1 border-b border-white/10 select-none">
          <span class="flex items-center gap-1.5"><i class="fa-regular fa-clock"></i> Mendatang Hari Ini (${upcomingEvents.length})</span>
          <i id="upcoming-toggle-icon" class="fa-solid fa-chevron-${showUpcomingInLive ? 'up' : 'down'} text-[10px]"></i>
        </div>
        <div id="live-upcoming-grid" class="space-y-2.5 ${showUpcomingInLive ? '' : 'hidden'}"></div>
      `;
      container.appendChild(upBox);
      renderMatchesCards('live-upcoming-grid', upcomingEvents, true);
    }

    // Sesi 3: Pertandingan Selesai Hari Ini
    if (finishedEvents.length > 0) {
      const finBox = document.createElement('div');
      finBox.className = 'space-y-2.5 pt-2';
      finBox.innerHTML = `
        <div onclick="toggleFinishedInLiveView()" class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between cursor-pointer pb-1 border-b border-white/10 select-none">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-circle-check"></i> Selesai Hari Ini (${finishedEvents.length})</span>
          <i id="finished-toggle-icon" class="fa-solid fa-chevron-${showFinishedInLive ? 'up' : 'down'} text-[10px]"></i>
        </div>
        <div id="live-finished-grid" class="space-y-2.5 ${showFinishedInLive ? '' : 'hidden'}"></div>
      `;
      container.appendChild(finBox);
      renderMatchesCards('live-finished-grid', finishedEvents, true);
    }

  } catch (err) {
    console.error("Gagal memuat live matches:", err);
    container.innerHTML = `<p class="text-center text-slate-400 text-xs py-10">Gagal mengambil jadwal live.</p>`;
  }
}

// 3. Fetch Pertandingan Favorit (Tab Favorit)
async function fetchFavoritedMatchesStructured() {
  const container = document.getElementById('fav-container');
  if (!container) return;

  container.innerHTML = `
    <div class="py-12 text-center text-xs text-slate-400 space-y-2">
      <i class="fa-solid fa-circle-notch fa-spin text-amber-400 text-2xl"></i>
      <p class="font-bold text-white">Memuat pertandingan favorit...</p>
    </div>
  `;
  container.classList.remove('hidden');

  try {
    if (!cachedEvents || cachedEvents.length === 0) {
      const dateStr = selectedDateFilter || getFormattedDate(new Date());
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        cachedEvents = data.events || [];
      }
    }

    // Filter Pertandingan atau Tim Favorit
    const favEvents = cachedEvents.filter(evt => {
      const comp = evt.competitions?.[0];
      const hId = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.id;
      const aId = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.id;

      const isMatchFav = isFavorite(evt.id);
      const isTeamFav = isTeamFavorite(hId) || isTeamFavorite(aId);
      return isMatchFav || isTeamFav;
    });

    if (favEvents.length === 0) {
      container.innerHTML = `
        <div class="text-center py-16 px-4 bg-[#180d30] border border-white/10 rounded-3xl space-y-3 shadow-xl">
          <i class="fa-solid fa-star text-4xl text-amber-400/80 block drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]"></i>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">Belum Ada Favorit</h3>
          <p class="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
            Tekan ikon bintang (<i class="fa-regular fa-star text-amber-400"></i>) pada pertandingan atau klub untuk mengikuti perkembangan skor secara langsung!
          </p>
        </div>
      `;
      return;
    }

    const liveFav = favEvents.filter(e => e.status?.type?.state === 'in');
    const upcomingFav = favEvents.filter(e => e.status?.type?.state === 'pre');
    const finishedFav = favEvents.filter(e => e.status?.type?.state === 'post');

    container.innerHTML = '';

    if (liveFav.length > 0) {
      const box = document.createElement('div');
      box.className = 'space-y-2.5';
      box.innerHTML = `
        <div class="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-white/10">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span> Live Favorit (${liveFav.length})
        </div>
        <div id="fav-active-grid" class="space-y-2.5"></div>
      `;
      container.appendChild(box);
      renderMatchesCards('fav-active-grid', liveFav, true);
    }

    if (upcomingFav.length > 0) {
      const box = document.createElement('div');
      box.className = 'space-y-2.5 pt-2';
      box.innerHTML = `
        <div onclick="toggleUpcomingInFavView()" class="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center justify-between cursor-pointer pb-1 border-b border-white/10 select-none">
          <span class="flex items-center gap-1.5"><i class="fa-regular fa-star"></i> Mendatang Favorit (${upcomingFav.length})</span>
          <i id="fav-upcoming-toggle-icon" class="fa-solid fa-chevron-${showUpcomingInFav ? 'up' : 'down'} text-[10px]"></i>
        </div>
        <div id="fav-upcoming-grid" class="space-y-2.5 ${showUpcomingInFav ? '' : 'hidden'}"></div>
      `;
      container.appendChild(box);
      renderMatchesCards('fav-upcoming-grid', upcomingFav, true, 'upcoming-fav');
    }

    if (finishedFav.length > 0) {
      const box = document.createElement('div');
      box.className = 'space-y-2.5 pt-2';
      box.innerHTML = `
        <div onclick="toggleFinishedInFavView()" class="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between cursor-pointer pb-1 border-b border-white/10 select-none">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-circle-check"></i> Selesai Favorit (${finishedFav.length})</span>
          <i id="fav-finished-toggle-icon" class="fa-solid fa-chevron-${showFinishedInFav ? 'up' : 'down'} text-[10px]"></i>
        </div>
        <div id="fav-finished-grid" class="space-y-2.5 ${showFinishedInFav ? '' : 'hidden'}"></div>
      `;
      container.appendChild(box);
      renderMatchesCards('fav-finished-grid', finishedFav, true, 'finished-fav');
    }

  } catch (err) {
    console.error("Gagal memuat favorit:", err);
    container.innerHTML = `<p class="text-center text-slate-400 text-xs py-10">Gagal memuat favorit.</p>`;
  }
}

// 4. Fetch Performa Terakhir & Head-to-Head (H2H) di Modal Pertandingan
async function fetchFormAndH2H(leagueSlug, homeTeamId, awayTeamId, homeName, awayName, h2hData = []) {
  const container = document.getElementById('mcontent-h2h');
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-400"></i>
      <p class="text-xs font-bold">Memuat riwayat pertandingan & H2H...</p>
    </div>
  `;

  try {
    const slug = leagueSlug && leagueSlug !== 'all' ? leagueSlug : 'esp.1';
    
    // Fetch riwayat pertandingan kedua tim secara paralel
    const [homeRes, awayRes] = await Promise.all([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams/${homeTeamId}/schedule`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams/${awayTeamId}/schedule`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    const getFinishedMatches = (resData) => {
      if (!resData || !resData.events) return [];
      return resData.events
        .filter(e => e.status?.type?.state === 'post')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    };

    const homeFormMatches = getFinishedMatches(homeRes);
    const awayFormMatches = getFinishedMatches(awayRes);

    const homeFormHtml = renderFormBlock(homeName, homeFormMatches, homeTeamId);
    const awayFormHtml = renderFormBlock(awayName, awayFormMatches, awayTeamId);

    // H2H Block
    let h2hHtml = '';
    if (h2hData && h2hData.length > 0) {
      const rows = h2hData.map(evt => {
        const comp = evt.competitions?.[0] || evt;
        const h = comp.competitors?.find(c => c.homeAway === 'home');
        const a = comp.competitors?.find(c => c.homeAway === 'away');
        const formattedDate = new Date(evt.date || comp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        return `
          <div class="flex items-center justify-between bg-[#0f0720] p-2.5 rounded-xl border border-white/5 text-xs">
            <span class="text-[10px] text-slate-400 w-20 shrink-0">${formattedDate}</span>
            <div class="flex items-center gap-1.5 flex-1 justify-end font-semibold text-slate-200 truncate">
              <span class="truncate">${h?.team?.displayName || 'Home'}</span>
              <img src="${getTeamLogo(h?.team)}" class="w-4 h-4 object-contain shrink-0" alt="">
            </div>
            <span class="font-black text-white px-2 py-0.5 bg-white/10 rounded-md border border-white/10 text-[11px] mx-2 shrink-0">${h?.score ?? '0'} - ${a?.score ?? '0'}</span>
            <div class="flex items-center gap-1.5 flex-1 justify-start font-semibold text-slate-200 truncate">
              <img src="${getTeamLogo(a?.team)}" class="w-4 h-4 object-contain shrink-0" alt="">
              <span class="truncate">${a?.team?.displayName || 'Away'}</span>
            </div>
          </div>
        `;
      }).join('');

      h2hHtml = `
        <div class="bg-[#180d30] p-3.5 rounded-2xl border border-white/10 space-y-2.5 shadow-sm">
          <div class="text-xs font-bold text-white pb-2 border-b border-white/10 flex items-center gap-1.5">
            <i class="fa-solid fa-handshake text-emerald-400"></i> Head to Head (H2H) Terakhir
          </div>
          <div class="space-y-1.5">${rows}</div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="space-y-3">
        ${homeFormHtml}
        ${awayFormHtml}
        ${h2hHtml}
      </div>
    `;

  } catch (err) {
    console.error("Gagal memuat Form/H2H:", err);
    container.innerHTML = `<p class="text-center text-slate-400 text-xs py-6">Data riwayat pertandingan tidak dapat dimuat.</p>`;
  }
}

// 5. Muat Foto Pemain Secara Multi-Tier (IndexedDB Cache -> ESPN CDN -> Fallback Avatar)
async function loadMultiTierPlayerPhoto(imgEl, playerId, playerName) {
  if (!imgEl || imgEl.dataset.loaded === 'true') return;

  // Jika hemat data aktif, pertahankan avatar default
  if (typeof dataSaverMode !== 'undefined' && dataSaverMode) {
    imgEl.dataset.loaded = 'true';
    return;
  }

  // Cek foto dari Cache IndexedDB
  try {
    const cachedPhoto = await getPhotoFromCache(playerId);
    if (cachedPhoto) {
      imgEl.src = cachedPhoto;
      imgEl.dataset.loaded = 'true';
      return;
    }
  } catch (e) {}

  // Jika tidak ada di cache, coba muat dari CDN Resmi ESPN
  const espnPhotoUrl = `https://a.espncdn.com/i/headshots/soccer/players/full/${playerId}.png`;
  
  const tempImg = new Image();
  tempImg.onload = () => {
    imgEl.src = espnPhotoUrl;
    imgEl.dataset.loaded = 'true';
    savePhotoToCache(playerId, espnPhotoUrl);
  };
  
  tempImg.onerror = () => {
    // Fallback Avatar jika foto ESPN tidak tersedia
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=22c55e&color=ffffff&bold=true&rounded=true&size=128`;
    imgEl.src = avatarUrl;
    imgEl.dataset.loaded = 'true';
  };

  tempImg.src = espnPhotoUrl;
}
