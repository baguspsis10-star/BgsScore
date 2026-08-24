// APP INITIALIZATION & CORE CONTROLLER MODULE

// Main Data Loading Handler
async function loadData(isSilent = false) {
  const refreshIcon = document.getElementById('refresh-icon');
  if (refreshIcon) refreshIcon.classList.add('fa-spin');

  if (!isSilent) {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('matches-container').classList.add('hidden');
    document.getElementById('live-container').classList.add('hidden');
    if (document.getElementById('fav-container')) document.getElementById('fav-container').classList.add('hidden');
    document.getElementById('standings-container').classList.add('hidden');
    document.getElementById('search-results-container').classList.add('hidden');
  }

  updateActiveLeagueBadge();
  updateDataSaverUI();

  if (activeNav === 'all') {
    await fetchAllMatches();
  } else if (activeNav === 'live') {
    await fetchLiveMatchesStructured();
  } else if (activeNav === 'fav') {
    await fetchFavoritedMatchesStructured();
  } else if (activeNav === 'league') {
    await fetchStandingsForSelectedLeague();
  }

  if (currentOpenModal) {
    await openMatchDetail(currentOpenModal.leagueId, currentOpenModal.eventId, currentOpenModal.leagueName, true);
  }

  document.getElementById('loading').classList.add('hidden');
  if (refreshIcon) refreshIcon.classList.remove('fa-spin');
}

// Bottom Navigation Switcher
function bottomNavSwitch(navType) {
  activeNav = navType;
  clearSearch();

  document.querySelectorAll('.bnav-item').forEach(el => {
    el.classList.remove('text-emerald-400', 'font-bold');
    el.classList.add('text-slate-400');
  });

  const activeBtn = document.getElementById(`bnav-${navType}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-400');
    activeBtn.classList.add('text-emerald-400', 'font-bold');
  }

  const topHeader = document.getElementById('top-all-matches-header');
  const dateStrip = document.getElementById('date-strip-container');

  if (navType === 'all') {
    if (topHeader) topHeader.classList.remove('hidden');
    if (dateStrip) dateStrip.classList.remove('hidden');
    document.getElementById('active-badge-container').classList.remove('hidden');
    document.getElementById('active-mode-tag').innerText = "Urut Waktu & Tim Favorit";
  } else if (navType === 'live' || navType === 'fav') {
    if (topHeader) topHeader.classList.add('hidden');
    if (dateStrip) dateStrip.classList.add('hidden');
    document.getElementById('active-badge-container').classList.add('hidden');
  } else if (navType === 'league') {
    if (topHeader) topHeader.classList.add('hidden');
    if (dateStrip) dateStrip.classList.add('hidden');
    document.getElementById('active-badge-container').classList.remove('hidden');
    document.getElementById('active-mode-tag').innerText = "League";
    selectedStandingsLeague = null;
    selectedStandingsTab = 'table';
  }

  loadData(false);
}

// Search Handler
function handleSearch(query) {
  const searchContainer = document.getElementById('search-results-container');
  const clearBtn = document.getElementById('search-clear-btn');
  const dateStrip = document.getElementById('date-strip-container');
  const q = query.trim().toLowerCase();

  if (q === '') {
    clearBtn.classList.add('hidden');
    searchContainer.classList.add('hidden');
    if (activeNav === 'all') {
      document.getElementById('matches-container').classList.remove('hidden');
      if (dateStrip) dateStrip.classList.remove('hidden');
    }
    if (activeNav === 'live') document.getElementById('live-container').classList.remove('hidden');
    if (activeNav === 'fav') document.getElementById('fav-container').classList.remove('hidden');
    if (activeNav === 'league') document.getElementById('standings-container').classList.remove('hidden');
    return;
  }

  clearBtn.classList.remove('hidden');

  document.getElementById('matches-container').classList.add('hidden');
  document.getElementById('live-container').classList.add('hidden');
  if (document.getElementById('fav-container')) document.getElementById('fav-container').classList.add('hidden');
  document.getElementById('standings-container').classList.add('hidden');
  if (dateStrip) dateStrip.classList.add('hidden');

  searchContainer.innerHTML = '';
  searchContainer.classList.remove('hidden');

  const matchedLeagues = LEAGUES.filter(l => 
    l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)
  );

  const matchedEvents = cachedEvents.filter(e => {
    const homeName = e.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.displayName || '';
    const awayName = e.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.displayName || '';
    const leagueName = e.leagueName || '';
    return homeName.toLowerCase().includes(q) || awayName.toLowerCase().includes(q) || leagueName.toLowerCase().includes(q);
  });

  if (matchedLeagues.length === 0 && matchedEvents.length === 0) {
    searchContainer.innerHTML = `
      <div class="text-center py-10 text-slate-500 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs">
        <i class="fa-solid fa-magnifying-glass text-2xl mb-2 block text-slate-600"></i>
        Tidak ditemukan liga atau pertandingan untuk "<strong>${query}</strong>"
      </div>
    `;
    return;
  }

  if (matchedLeagues.length > 0) {
    const leagueSec = document.createElement('div');
    leagueSec.className = 'space-y-2';
    leagueSec.innerHTML = `
      <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
        <i class="fa-solid fa-trophy"></i> Liga Ditemukan (${matchedLeagues.length})
      </div>
      <div class="flex flex-col gap-1.5">
        ${matchedLeagues.map(l => `
          <button onclick="selectStandingsLeague('${l.id}'); bottomNavSwitch('league'); clearSearch();" class="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl flex items-center gap-2.5 text-left transition w-full">
            <img src="${generateUnlicensedLeagueBadge(l.id, l.name, l.country)}" loading="lazy" class="w-5 h-5 object-contain shrink-0" alt="">
            <div class="flex-1 min-w-0 pr-1">
              <div class="text-xs font-bold text-white whitespace-normal break-words">${l.flag ? l.flag + ' ' : ''}${l.name}</div>
              <div class="text-[9px] text-slate-400 mt-0.5">${l.country}</div>
            </div>
            <i class="fa-solid fa-chevron-right text-[9px] text-slate-600 shrink-0"></i>
          </button>
        `).join('')}
      </div>
    `;
    searchContainer.appendChild(leagueSec);
  }

  if (matchedEvents.length > 0) {
    const matchSec = document.createElement('div');
    matchSec.className = 'space-y-2 pt-2';
    matchSec.innerHTML = `
      <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
        <i class="fa-solid fa-futbol"></i> Pertandingan Ditemukan (${matchedEvents.length})
      </div>
      <div id="search-matches-grid" class="space-y-2.5"></div>
    `;
    searchContainer.appendChild(matchSec);
    renderMatchesCards('search-matches-grid', matchedEvents, true);
  }
}

// Clear Search Field
function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  handleSearch('');
}

// Toggle Finished Section in Live View
function toggleFinishedInLiveView() {
  showFinishedInLive = !showFinishedInLive;
  const el = document.getElementById('live-finished-grid');
  const icon = document.getElementById('finished-toggle-icon');
  if (el) el.classList.toggle('hidden', !showFinishedInLive);
  if (icon) icon.className = `fa-solid fa-chevron-${showFinishedInLive ? 'up' : 'down'} text-[10px]`;
}

// Toggle Upcoming Section in Live View
function toggleUpcomingInLiveView() {
  showUpcomingInLive = !showUpcomingInLive;
  const el = document.getElementById('live-upcoming-grid');
  const icon = document.getElementById('upcoming-toggle-icon');
  if (el) el.classList.toggle('hidden', !showUpcomingInLive);
  if (icon) icon.className = `fa-solid fa-chevron-${showUpcomingInLive ? 'up' : 'down'} text-[10px]`;
}

// Toggle Finished Section in Favorited View
function toggleFinishedInFavView() {
  showFinishedInFav = !showFinishedInFav;
  const el = document.getElementById('fav-finished-grid');
  const icon = document.getElementById('fav-finished-toggle-icon');
  if (el) el.classList.toggle('hidden', !showFinishedInFav);
  if (icon) icon.className = `fa-solid fa-chevron-${showFinishedInFav ? 'up' : 'down'} text-[10px]`;
}

// Toggle Upcoming Section in Favorited View
function toggleUpcomingInFavView() {
  showUpcomingInFav = !showUpcomingInFav;
  const el = document.getElementById('fav-upcoming-grid');
  const icon = document.getElementById('fav-upcoming-toggle-icon');
  if (el) el.classList.toggle('hidden', !showUpcomingInFav);
  if (icon) icon.className = `fa-solid fa-chevron-${showUpcomingInFav ? 'up' : 'down'} text-[10px]`;
}

// Change Selected League Filter
function changeLeague(leagueId) {
  selectedLeague = leagueId;
  document.querySelectorAll('.league-btn').forEach(btn => {
    btn.classList.remove('bg-emerald-600', 'text-white');
    btn.classList.add('bg-slate-800', 'text-slate-300');
  });
  const activeBtn = document.getElementById(`btn-${leagueId}`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-slate-800', 'text-slate-300');
    activeBtn.classList.add('bg-emerald-600', 'text-white');
  }
  loadData(false);
}

// Update Active League Badge UI
function updateActiveLeagueBadge() {
  const badge = document.getElementById('active-league-badge');
  if (selectedLeague === 'all') {
    badge.innerHTML = `<i class="fa-solid fa-globe text-emerald-400"></i> Semua Liga`;
  } else {
    const found = LEAGUES.find(l => l.id === selectedLeague);
    if (found) {
      badge.innerHTML = `<img src="${generateUnlicensedLeagueBadge(found.id, found.name, found.country)}" loading="lazy" class="w-3.5 h-3.5 object-contain" alt=""> ${found.flag ? found.flag + ' ' : ''}${found.name}`;
    }
  }
}

// Initialize App & Auto Refresh Loop
document.addEventListener('DOMContentLoaded', () => {
  displayTimezoneInfo();
  renderDateStrip();
  bottomNavSwitch('all');

  setInterval(() => {
    if (activeNav === 'live' || activeNav === 'fav' || (activeNav === 'all' && selectedDateFilter === getFormattedDate(new Date()))) {
      loadData(true);
    }
  }, 10000);
});

// Service Worker Engine Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swCode = `
      const CACHE_NAME = 'bgs-scorehub-v2';
      self.addEventListener('install', (e) => self.skipWaiting());
      self.addEventListener('activate', (e) => self.clients.claim());
      
      self.addEventListener('fetch', (e) => {
        if (e.request.destination === 'image') {
          e.respondWith(
            caches.match(e.request).then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              return fetch(e.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                  cache.put(e.request, networkResponse.clone());
                  return networkResponse;
                });
              });
            })
          );
        }
      });
    `;

    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);

    navigator.serviceWorker.register(swUrl)
      .then(() => console.log('BGS Cache Engine Active!'))
      .catch(err => console.error('ServiceWorker Error:', err));
  });
}
