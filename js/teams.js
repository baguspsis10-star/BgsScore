// TEAMS & CLUB DETAILS MODULE - FOTMOB DARK GREEN THEME (FIXED)

// Helper Extract Score dari Data ESPN
function extractScore(competitor) {
  if (!competitor) return '0';
  if (competitor.score !== undefined && competitor.score !== null) {
    if (typeof competitor.score === 'object') {
      return competitor.score.displayValue ?? competitor.score.value ?? '0';
    }
    return String(competitor.score);
  }
  return '0';
}

// Helper Cek Pertandingan Selesai
function isMatchFinished(evt) {
  const state = evt.status?.type?.state;
  const completed = evt.status?.type?.completed;
  const detail = (evt.status?.type?.shortDetail || evt.status?.type?.description || '').toLowerCase();
  return state === 'post' || completed === true || detail.includes('ft') || detail.includes('final');
}

// Check if Team is Favorited
function isTeamFavorite(teamId) {
  if (!teamId) return false;
  return favoriteTeams.some(id => String(id) === String(teamId));
}

// Toggle Team Favorite State
function toggleTeamFavorite(teamId, e) {
  if (e) e.stopPropagation();
  const idStr = String(teamId);
  if (isTeamFavorite(idStr)) {
    favoriteTeams = favoriteTeams.filter(id => String(id) !== idStr);
  } else {
    favoriteTeams.push(idStr);
  }
  localStorage.setItem('bgs_favorite_teams', JSON.stringify(favoriteTeams));
  if (currentOpenTeam) {
    openTeamDetail(currentOpenTeam.leagueId, currentOpenTeam.teamId, currentOpenTeam.teamName);
  }
}

// Open Team Detail Modal
async function openTeamDetail(leagueId, teamId, teamName, event) {
  if (event) event.stopPropagation();
  currentOpenTeam = { leagueId, teamId, teamName };

  if (typeof closeModal === 'function') {
    closeModal();
  }

  const modal = document.getElementById('team-detail-modal');
  modal.classList.remove('hidden');

  const isFavTeam = isTeamFavorite(teamId);
  const teamLogo = dataSaverMode ? PLAIN_SHIELD_LOGO : `https://a.espncdn.com/i/teamlogos/soccer/500/${teamId}.png`;
  const validLeagueId = (!leagueId || leagueId === 'all') ? 'ita.1' : leagueId;
  const leagueObj = LEAGUES.find(l => l.id === validLeagueId) || { country: 'ITALIA', name: 'Liga' };
  const countryUpper = (leagueObj.country || 'ITALIA').toUpperCase();

  // Render Header & Menu Utama FotMob (Satu-satunya Menu Navigasi)
  const banner = document.getElementById('team-modal-banner');
  banner.className = "p-4 sm:p-5 bg-gradient-to-b from-[#0d2d1a] via-[#091f12] to-[#08170d] text-white shrink-0 border-b border-white/10";
  banner.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <button onclick="closeTeamModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <div class="flex items-center gap-2">
        <button onclick="toggleTeamFavorite('${teamId}', event)" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition">
          <i class="${isFavTeam ? 'fa-solid fa-star text-amber-400' : 'fa-regular fa-star text-white'}"></i>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3.5 mb-5">
      <div class="w-14 h-14 bg-emerald-950/60 rounded-2xl p-2 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg">
        <img src="${teamLogo}" loading="lazy" class="w-full h-full object-contain" onError="this.src='${PLAIN_SHIELD_LOGO}'">
      </div>
      <div>
        <span class="text-[10px] font-black tracking-widest text-emerald-400 uppercase block">${countryUpper}</span>
        <h2 class="text-xl sm:text-2xl font-black text-white leading-tight uppercase tracking-wide flex items-center gap-2">
          <span>${teamName}</span>
        </h2>
      </div>
    </div>

    <!-- Navigasi Utama -->
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
      <button id="ttab-overview" onclick="switchTeamModalTab('overview')" class="px-4 py-1.5 text-xs font-black rounded-full transition bg-white text-slate-900 shadow">Overview</button>
      <button id="ttab-summary" onclick="switchTeamModalTab('summary')" class="px-4 py-1.5 text-xs font-bold rounded-full transition text-slate-300 hover:text-white hover:bg-white/10">Fixtures</button>
      <button id="ttab-standings" onclick="switchTeamModalTab('standings')" class="px-4 py-1.5 text-xs font-bold rounded-full transition text-slate-300 hover:text-white hover:bg-white/10">Table</button>
      <button id="ttab-player" onclick="switchTeamModalTab('player')" class="px-4 py-1.5 text-xs font-bold rounded-full transition text-slate-300 hover:text-white hover:bg-white/10">Squad</button>
    </div>
  `;

  switchTeamModalTab('overview');
  loadTeamFullData(validLeagueId, teamId, teamName);
}

// Close Team Detail Modal
function closeTeamModal() {
  currentOpenTeam = null;
  document.getElementById('team-detail-modal').classList.add('hidden');
}

// Switch Sub-Tabs
function switchTeamModalTab(tabName) {
  const tabs = ['overview', 'summary', 'standings', 'player'];
  tabs.forEach(t => {
    const btn = document.getElementById(`ttab-${t}`);
    const content = document.getElementById(`tcontent-${t}`);

    if (btn && content) {
      if (t === tabName) {
        btn.className = "px-4 py-1.5 text-xs font-black rounded-full transition bg-white text-slate-900 shadow";
        content.classList.remove('hidden');
      } else {
        btn.className = "px-4 py-1.5 text-xs font-bold rounded-full transition text-slate-300 hover:text-white hover:bg-white/10";
        content.classList.add('hidden');
      }
    }
  });
}

// Load All ESPN Data for Team
async function loadTeamFullData(leagueId, teamId, teamName) {
  const overviewContainer = document.getElementById('tcontent-overview');
  const summaryContainer = document.getElementById('tcontent-summary');
  const standingsContainer = document.getElementById('tcontent-standings');

  if (overviewContainer) {
    overviewContainer.innerHTML = `
      <div class="py-12 text-center text-xs text-slate-400 space-y-2">
        <i class="fa-solid fa-circle-notch fa-spin text-emerald-400 text-2xl"></i>
        <p class="font-bold">Memuat data klub...</p>
      </div>
    `;
  }

  try {
    const targetLeague = (!leagueId || leagueId === 'all') ? 'ita.1' : leagueId;

    const [scheduleRes, rosterRes] = await Promise.all([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${targetLeague}/teams/${teamId}/schedule`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${targetLeague}/teams/${teamId}/roster`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    const events = scheduleRes?.events || [];
    const finishedEvents = events.filter(e => isMatchFinished(e)).sort((a,b) => new Date(b.date) - new Date(a.date));
    const upcomingEvents = events.filter(e => !isMatchFinished(e)).sort((a,b) => new Date(a.date) - new Date(b.date));

    // Render Overview
    renderFotmobOverview(overviewContainer, teamId, teamName, finishedEvents, upcomingEvents, rosterRes);

    // Render Fixtures (Pertandingan Selesai + Skor)
    renderFotmobFixtures(summaryContainer, finishedEvents, teamId);

    // Render Table
    const targetLeagueObj = LEAGUES.find(l => l.id === targetLeague) || LEAGUES[0];
    standingsContainer.innerHTML = '';
    await renderLeagueStandingsTable(targetLeagueObj, standingsContainer, teamId);

    // Render Squad
    loadStyledSquadRosterUI(targetLeague, teamId);

  } catch (err) {
    console.error(err);
    if (overviewContainer) {
      overviewContainer.innerHTML = `<div class="p-6 text-center text-xs text-red-400">Gagal memuat data klub.</div>`;
    }
  }
}

// RENDER OVERVIEW TAB
function renderFotmobOverview(container, teamId, teamName, finishedEvents, upcomingEvents, rosterData) {
  if (!container) return;
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-4';

  // 1. CAROUSEL HASIL & JADWAL LAGA
  const topMatches = [...finishedEvents.slice(0, 2), ...upcomingEvents.slice(0, 1)];
  if (topMatches.length > 0) {
    const carouselSection = document.createElement('div');
    carouselSection.className = 'grid grid-cols-3 gap-2';

    topMatches.forEach(evt => {
      const comp = evt.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');
      const finished = isMatchFinished(evt);

      const homeLogo = getTeamLogo(home?.team) || PLAIN_SHIELD_LOGO;
      const awayLogo = getTeamLogo(away?.team) || PLAIN_SHIELD_LOGO;
      const homeScore = extractScore(home);
      const awayScore = extractScore(away);
      const dateFormatted = new Date(evt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      const card = document.createElement('div');
      card.className = 'bg-[#102719] border border-white/10 p-2.5 rounded-2xl flex flex-col justify-between text-center cursor-pointer hover:bg-[#163522] transition';
      card.onclick = () => openMatchDetail(evt.leagueId || 'ita.1', evt.id, evt.leagueName || 'Detail');

      card.innerHTML = `
        <div class="text-[9px] font-bold text-emerald-400 truncate mb-1 flex items-center justify-center gap-1">
          <i class="fa-solid fa-trophy text-[8px]"></i> ${evt.season?.slug || 'Liga'}
        </div>
        <div class="flex items-center justify-between my-1 px-1">
          <img src="${homeLogo}" class="w-5 h-5 object-contain" onerror="this.src='${PLAIN_SHIELD_LOGO}'">
          <span class="text-xs font-black text-white px-1">
            ${finished ? `${homeScore} - ${awayScore}` : dateFormatted}
          </span>
          <img src="${awayLogo}" class="w-5 h-5 object-contain" onerror="this.src='${PLAIN_SHIELD_LOGO}'">
        </div>
      `;
      carouselSection.appendChild(card);
    });
    wrapper.appendChild(carouselSection);
  }

  // 2. LAST MATCHES FORM WIDGET
  const last10 = finishedEvents.slice(0, 10).reverse();
  if (last10.length > 0) {
    const startDate = new Date(last10[0].date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    const endDate = new Date(last10[last10.length - 1].date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });

    const formCard = document.createElement('div');
    formCard.className = 'bg-[#102719] border border-white/10 p-3.5 rounded-3xl space-y-3';
    
    let itemsHtml = last10.map(evt => {
      const comp = evt.competitions?.[0];
      const myTeam = comp?.competitors?.find(c => String(c.team?.id) === String(teamId));
      const oppTeam = comp?.competitors?.find(c => String(c.team?.id) !== String(teamId));
      
      const myScore = parseInt(extractScore(myTeam));
      const oppScore = parseInt(extractScore(oppTeam));
      const oppLogo = getTeamLogo(oppTeam?.team) || PLAIN_SHIELD_LOGO;

      let resBadge = { icon: 'fa-minus', color: 'bg-[#2a3d30] text-slate-300' };
      if (myScore > oppScore) {
        resBadge = { icon: 'fa-check', color: 'bg-emerald-600 text-white' };
      } else if (myScore < oppScore) {
        resBadge = { icon: 'fa-xmark', color: 'bg-red-600/80 text-white' };
      }

      return `
        <div class="flex flex-col items-center gap-1 flex-1 min-w-0">
          <img src="${oppLogo}" class="w-5 h-5 object-contain" onerror="this.src='${PLAIN_SHIELD_LOGO}'">
          <span class="text-[9.5px] font-mono font-bold text-slate-200">${myScore}-${oppScore}</span>
          <span class="w-4 h-4 rounded-md flex items-center justify-center text-[8px] font-black ${resBadge.color}">
            <i class="fa-solid ${resBadge.icon}"></i>
          </span>
        </div>
      `;
    }).join('');

    formCard.innerHTML = `
      <div class="flex items-center justify-between text-xs font-black text-white">
        <span>Last ${last10.length} Matches</span>
        <span class="text-[10px] text-slate-400 font-normal">${startDate} - ${endDate}</span>
      </div>
      <div class="flex items-center justify-between gap-1 pt-1 overflow-x-auto no-scrollbar">
        ${itemsHtml}
      </div>
    `;
    wrapper.appendChild(formCard);
  }

  // 3. FORMATION & MANAGER
  const rawCoach = rosterData?.coach?.[0];
  const coachName = rawCoach ? (rawCoach.displayName || rawCoach.fullName) : null;

  const formationCard = document.createElement('div');
  formationCard.className = 'bg-[#102719] border border-white/10 p-3.5 rounded-3xl space-y-3';
  formationCard.innerHTML = `
    <div class="flex items-center justify-between text-xs font-black text-white">
      <span>Latest Formation</span>
      <span class="text-xs font-extrabold text-emerald-400">4-3-3</span>
    </div>
    <div class="soccer-full-pitch rounded-2xl p-2 py-4 flex flex-col justify-between relative !min-h-[260px]">
      <div class="pitch-center-line-full"></div>
      <div class="pitch-center-circle"></div>
      <div class="pitch-center-dot"></div>
      
      <div class="flex items-center justify-around z-10">
        <div class="flex flex-col items-center"><span class="w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 text-slate-950 font-black text-[10px] flex items-center justify-center shadow">GK</span></div>
      </div>
      <div class="flex items-center justify-around z-10">
        <div class="flex flex-col items-center"><span class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">DF</span></div>
        <div class="flex flex-col items-center"><span class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">DF</span></div>
        <div class="flex flex-col items-center"><span class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">DF</span></div>
        <div class="flex flex-col items-center"><span class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">DF</span></div>
      </div>
      <div class="flex items-center justify-around z-10">
        <div class="flex flex-col items-center"><span class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">MF</span></div>
        <div class="flex flex-col items-center"><span class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">MF</span></div>
        <div class="flex flex-col items-center"><span class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">MF</span></div>
      </div>
    </div>
  `;
  wrapper.appendChild(formationCard);

  if (coachName) {
    const managerCard = document.createElement('div');
    managerCard.className = 'bg-[#102719] border border-white/10 p-3.5 rounded-3xl flex items-center gap-3';
    managerCard.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-base shrink-0">
        <i class="fa-solid fa-user-tie"></i>
      </div>
      <div>
        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Manager</span>
        <h4 class="text-xs font-extrabold text-white">${coachName}</h4>
      </div>
    `;
    wrapper.appendChild(managerCard);
  }

  container.appendChild(wrapper);
}

// RENDER FIXTURES TAB (PERTANDINGAN SELESAI + SKOR)
function renderFotmobFixtures(container, finishedEvents, teamId) {
  if (!container) return;
  container.innerHTML = '';

  if (!finishedEvents || finishedEvents.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">Tidak ada pertandingan selesai.</div>`;
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-2.5';

  finishedEvents.forEach(evt => {
    const comp = evt.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');

    const homeLogo = getTeamLogo(home?.team) || PLAIN_SHIELD_LOGO;
    const awayLogo = getTeamLogo(away?.team) || PLAIN_SHIELD_LOGO;
    const homeScore = extractScore(home);
    const awayScore = extractScore(away);
    const dateFormatted = new Date(evt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    const card = document.createElement('div');
    card.className = 'bg-[#102719] border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs cursor-pointer hover:bg-[#163522] transition';
    card.onclick = () => openMatchDetail(evt.leagueId || 'ita.1', evt.id, evt.leagueName || 'Detail');

    card.innerHTML = `
      <!-- Home Team -->
      <div class="flex items-center gap-2 w-[38%] min-w-0">
        <img src="${homeLogo}" class="w-5 h-5 object-contain shrink-0" onerror="this.src='${PLAIN_SHIELD_LOGO}'">
        <span class="font-extrabold text-white truncate text-[11px]">${home?.team?.shortDisplayName || home?.team?.displayName || 'Home'}</span>
      </div>

      <!-- Score Center (Tampil Skor Hasil Pertandingan) -->
      <div class="w-[24%] text-center shrink-0">
        <span class="font-black text-white text-xs bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 tracking-wider inline-block shadow">
          ${homeScore} - ${awayScore}
        </span>
        <span class="block text-[8.5px] text-slate-400 font-bold mt-0.5">${dateFormatted} • FT</span>
      </div>

      <!-- Away Team -->
      <div class="flex items-center justify-end gap-2 w-[38%] min-w-0 text-right">
        <span class="font-extrabold text-white truncate text-[11px]">${away?.team?.shortDisplayName || away?.team?.displayName || 'Away'}</span>
        <img src="${awayLogo}" class="w-5 h-5 object-contain shrink-0" onerror="this.src='${PLAIN_SHIELD_LOGO}'">
      </div>
    `;
    wrapper.appendChild(card);
  });

  container.appendChild(wrapper);
}

// Load Squad Roster UI
async function loadStyledSquadRosterUI(leagueId, teamId) {
  const container = document.getElementById('tcontent-player');
  if (!container) return;

  container.innerHTML = `
    <div class="py-12 text-center text-xs text-slate-400 space-y-2">
      <i class="fa-solid fa-circle-notch fa-spin text-emerald-400 text-2xl"></i>
      <p class="font-bold">Memuat skuad pemain...</p>
    </div>
  `;

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/teams/${teamId}/roster`);
    const data = await res.json();
    let rawAthletes = data.athletes || [];
    let players = [];

    if (rawAthletes.length > 0) {
      rawAthletes.forEach(p => {
        if (p.items) {
          p.items.forEach(item => players.push(formatPlayerData(item, p.position)));
        } else {
          players.push(formatPlayerData(p, p.position?.name));
        }
      });
    } else {
      players = generateFallbackSquadData();
    }

    renderExactScreenshotSquadUI(data.coach?.[0], players, container);
  } catch (err) {
    renderExactScreenshotSquadUI(null, generateFallbackSquadData(), container);
  }
}

function formatPlayerData(p, posGroupStr = '') {
  const posStr = (p.position?.name || p.position?.abbreviation || posGroupStr || '').toLowerCase();
  let category = 'Midfielder';

  if (posStr.includes('goal') || posStr.includes('keeper') || posStr === 'gk') {
    category = 'Goalkeeper';
  } else if (posStr.includes('defen') || posStr.includes('back') || posStr === 'df' || posStr === 'cb') {
    category = 'Defender';
  } else if (posStr.includes('mid') || posStr === 'mf' || posStr === 'cm') {
    category = 'Midfielder';
  } else if (posStr.includes('forw') || posStr.includes('striker') || posStr.includes('wing') || posStr === 'fw') {
    category = 'Forward';
  }

  return {
    id: p.id || Math.floor(Math.random()*90000),
    name: p.fullName || p.displayName || 'Pemain',
    jersey: p.jersey ? `#${p.jersey}` : `#${Math.floor(Math.random()*40)+1}`,
    category,
    country: p.citizenship || p.birthPlace?.country || 'Italia',
    isInjured: (p.injuries && p.injuries.length > 0) || false
  };
}

function generateFallbackSquadData() {
  return [
    { id: 101, name: 'A Muric', jersey: '#49', category: 'Goalkeeper', country: 'Kosovo', isInjured: false },
    { id: 201, name: 'Jay Idzes', jersey: '#21', category: 'Defender', country: 'Indonesia', isInjured: false },
    { id: 301, name: 'Nemanja Matic', jersey: '#18', category: 'Midfielder', country: 'Serbia', isInjured: false }
  ];
}

function renderExactScreenshotSquadUI(coach, players, container) {
  container.innerHTML = '';

  const posCategories = [
    { name: 'Goalkeeper', color: 'text-amber-400' },
    { name: 'Defender', color: 'text-blue-400' },
    { name: 'Midfielder', color: 'text-emerald-400' },
    { name: 'Forward', color: 'text-red-400' }
  ];

  posCategories.forEach(cat => {
    const catPlayers = players.filter(p => p.category === cat.name);
    if (catPlayers.length === 0) return;

    const posBlock = document.createElement('div');
    posBlock.className = 'bg-[#102719] border border-white/10 rounded-3xl p-3.5 space-y-2 mb-3';

    let rowsHtml = catPlayers.map(p => `
      <div class="flex items-center justify-between py-2 px-1 hover:bg-[#163522] rounded-xl transition">
        <div class="flex items-center gap-2.5 truncate max-w-[85%]">
          <span class="${cat.color} font-black text-xs w-7 shrink-0 text-left">${p.jersey}</span>
          <div class="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500/30 overflow-hidden shrink-0 flex items-center justify-center">
            <img src="${PLAIN_PERSON_HEADSHOT}" loading="lazy" class="w-full h-full object-cover" onload="loadMultiTierPlayerPhoto(this, '${p.id}', '${p.name.replace(/'/g, "\\'")}')" onerror="handlePlayerImgError(this, '${p.name.replace(/'/g, "\\'")}')">
          </div>
          <div class="truncate">
            <div class="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span class="truncate">${p.name}</span>
            </div>
            <div class="text-[9.5px] text-slate-400 truncate mt-0.5">${p.country}</div>
          </div>
        </div>
      </div>
    `).join('');

    posBlock.innerHTML = `
      <h3 class="text-xs font-black uppercase tracking-wider ${cat.color} pb-1 border-b border-white/10">${cat.name}</h3>
      <div class="divide-y divide-white/5">${rowsHtml}</div>
    `;
    container.appendChild(posBlock);
  });
}
