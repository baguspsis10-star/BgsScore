// APP INITIALIZATION & CORE CONTROLLER MODULE

// Global Application States
var activeNav = 'all';
var selectedLeague = 'all';
var selectedDateFilter = '';
var selectedStandingsLeague = null;
var selectedStandingsTab = 'table';

var favoriteMatches = JSON.parse(localStorage.getItem('bgs_favorites')) || [];
var favoriteTeams = JSON.parse(localStorage.getItem('bgs_favorite_teams')) || [];
var soundSettings = JSON.parse(localStorage.getItem('bgs_sound_settings')) || {
  master: true, goal: true, lineup: true, kickoff1: true, halftime: true, kickoff2: true, fulltime: true, corner: false, yellow: false, red: true
};
var dataSaverMode = JSON.parse(localStorage.getItem('bgs_data_saver')) || false;

var cachedEvents = [];
var leagueLogoCache = {};
var playerPhotoCache = {};
var matchStateCache = {};
var recentGoalCache = {};
var currentOpenModal = null;

var showFinishedInLive = true;
var showUpcomingInLive = true;
var showFinishedInFav = true;
var showUpcomingInFav = true;

const PLAIN_SHIELD_LOGO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120"><path d="M50 5 L90 20 L90 70 C90 95 50 115 50 115 C50 115 10 95 10 70 L10 20 Z" fill="%231e293b" stroke="%23334155" stroke-width="4"/><circle cx="50" cy="55" r="20" fill="%230f172a"/></svg>';
const PLAIN_PERSON_HEADSHOT = 'https://ui-avatars.com/api/?name=Player&background=0f172a&color=38bdf8&bold=true';

// Main Data Loading Handler
async function loadData(isSilent = false) {
  const refreshIcon = document.getElementById('refresh-icon');
  if (refreshIcon) refreshIcon.classList.add('fa-spin');

  const loadingEl = document.getElementById('loading');
  const matchesEl = document.getElementById('matches-container');
  const liveEl = document.getElementById('live-container');
  const favEl = document.getElementById('fav-container');
  const standingsEl = document.getElementById('standings-container');
  const searchEl = document.getElementById('search-results-container');

  if (!isSilent) {
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (matchesEl) matchesEl.classList.add('hidden');
    if (liveEl) liveEl.classList.add('hidden');
    if (favEl) favEl.classList.add('hidden');
    if (standingsEl) standingsEl.classList.add('hidden');
    if (searchEl) searchEl.classList.add('hidden');
  }

  updateActiveLeagueBadge();
  if (typeof updateDataSaverUI === 'function') updateDataSaverUI();

  if (activeNav === 'all') {
    if (typeof fetchAllMatches === 'function') await fetchAllMatches();
  } else if (activeNav === 'live') {
    if (typeof fetchLiveMatchesStructured === 'function') await fetchLiveMatchesStructured();
  } else if (activeNav === 'fav') {
    if (typeof fetchFavoritedMatchesStructured === 'function') await fetchFavoritedMatchesStructured();
  } else if (activeNav === 'league') {
    if (typeof fetchStandingsForSelectedLeague === 'function') await fetchStandingsForSelectedLeague();
  }

  if (currentOpenModal && typeof window.openMatchDetail === 'function') {
    await window.openMatchDetail(currentOpenModal.leagueId, currentOpenModal.eventId, currentOpenModal.leagueName, true);
  }

  if (loadingEl) loadingEl.classList.add('hidden');
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
  const badgeContainer = document.getElementById('active-badge-container');
  const modeTag = document.getElementById('active-mode-tag');

  if (navType === 'all') {
    if (topHeader) topHeader.classList.remove('hidden');
    if (dateStrip) dateStrip.classList.remove('hidden');
    if (badgeContainer) badgeContainer.classList.remove('hidden');
    if (modeTag) modeTag.innerText = "Urut Waktu & Tim Favorit";
  } else if (navType === 'live' || navType === 'fav') {
    if (topHeader) topHeader.classList.add('hidden');
    if (dateStrip) dateStrip.classList.add('hidden');
    if (badgeContainer) badgeContainer.classList.add('hidden');
  } else if (navType === 'league') {
    if (topHeader) topHeader.classList.add('hidden');
    if (dateStrip) dateStrip.classList.add('hidden');
    if (badgeContainer) badgeContainer.classList.remove('hidden');
    if (modeTag) modeTag.innerText = "League";
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

  if (!searchContainer) return;
  const q = (query || '').trim().toLowerCase();

  const matchesEl = document.getElementById('matches-container');
  const liveEl = document.getElementById('live-container');
  const favEl = document.getElementById('fav-container');
  const standingsEl = document.getElementById('standings-container');

  if (q === '') {
    if (clearBtn) clearBtn.classList.add('hidden');
    searchContainer.classList.add('hidden');
    if (activeNav === 'all') {
      if (matchesEl) matchesEl.classList.remove('hidden');
      if (dateStrip) dateStrip.classList.remove('hidden');
    }
    if (activeNav === 'live' && liveEl) liveEl.classList.remove('hidden');
    if (activeNav === 'fav' && favEl) favEl.classList.remove('hidden');
    if (activeNav === 'league' && standingsEl) standingsEl.classList.remove('hidden');
    return;
  }

  if (clearBtn) clearBtn.classList.remove('hidden');

  if (matchesEl) matchesEl.classList.add('hidden');
  if (liveEl) liveEl.classList.add('hidden');
  if (favEl) favEl.classList.add('hidden');
  if (standingsEl) standingsEl.classList.add('hidden');
  if (dateStrip) dateStrip.classList.add('hidden');

  searchContainer.innerHTML = '';
  searchContainer.classList.remove('hidden');

  const leagueList = typeof LEAGUES !== 'undefined' ? LEAGUES : [];
  const matchedLeagues = leagueList.filter(l => 
    l.name.toLowerCase().includes(q) || (l.country && l.country.toLowerCase().includes(q))
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
    const badgeFunc = typeof generateUnlicensedLeagueBadge === 'function' ? generateUnlicensedLeagueBadge : () => PLAIN_SHIELD_LOGO;

    leagueSec.innerHTML = `
      <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
        <i class="fa-solid fa-trophy"></i> Liga Ditemukan (${matchedLeagues.length})
      </div>
      <div class="flex flex-col gap-1.5">
        ${matchedLeagues.map(l => `
          <button onclick="if(typeof selectStandingsLeague==='function') selectStandingsLeague('${l.id}'); bottomNavSwitch('league'); clearSearch();" class="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl flex items-center gap-2.5 text-left transition w-full">
            <img src="${badgeFunc(l.id, l.name, l.country)}" loading="lazy" class="w-5 h-5 object-contain shrink-0" alt="">
            <div class="flex-1 min-w-0 pr-1">
              <div class="text-xs font-bold text-white whitespace-normal break-words">${l.flag ? l.flag + ' ' : ''}${l.name}</div>
              <div class="text-[9px] text-slate-400 mt-0.5">${l.country || ''}</div>
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
    if (typeof renderMatchesCards === 'function') {
      renderMatchesCards('search-matches-grid', matchedEvents, true);
    }
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
  if (!badge) return;

  const badgeFunc = typeof generateUnlicensedLeagueBadge === 'function' ? generateUnlicensedLeagueBadge : () => PLAIN_SHIELD_LOGO;

  if (selectedLeague === 'all') {
    badge.innerHTML = `<i class="fa-solid fa-globe text-emerald-400"></i> Semua Liga`;
  } else {
    const leagueList = typeof LEAGUES !== 'undefined' ? LEAGUES : [];
    const found = leagueList.find(l => l.id === selectedLeague);
    if (found) {
      badge.innerHTML = `<img src="${badgeFunc(found.id, found.name, found.country)}" loading="lazy" class="w-3.5 h-3.5 object-contain" alt=""> ${found.flag ? found.flag + ' ' : ''}${found.name}`;
    }
  }
}

// Initialize App & Auto Refresh Loop
document.addEventListener('DOMContentLoaded', () => {
  if (typeof displayTimezoneInfo === 'function') displayTimezoneInfo();
  if (typeof renderDateStrip === 'function') renderDateStrip();
  bottomNavSwitch('all');

  setInterval(() => {
    const todayStr = typeof getFormattedDate === 'function' ? getFormattedDate(new Date()) : '';
    if (activeNav === 'live' || activeNav === 'fav' || (activeNav === 'all' && selectedDateFilter === todayStr)) {
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

// Global Scope Bindings
window.loadData = loadData;
window.bottomNavSwitch = bottomNavSwitch;
window.handleSearch = handleSearch;
window.clearSearch = clearSearch;
window.changeLeague = changeLeague;
window.toggleFinishedInLiveView = toggleFinishedInLiveView;
window.toggleUpcomingInLiveView = toggleUpcomingInLiveView;
window.toggleFinishedInFavView = toggleFinishedInFavView;
window.toggleUpcomingInFavView = toggleUpcomingInFavView;
