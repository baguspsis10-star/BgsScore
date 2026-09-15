// TEAMS & CLUB DETAILS MODULE - FOTMOB DARK GREEN THEME REWRITE

function isTeamFavorite(teamId) {
  if (!teamId) return false;
  return favoriteTeams.some(id => String(id) === String(teamId));
}

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
  const leagueObj = LEAGUES.find(l => l.id === leagueId) || { country: 'Klub Sepak Bola', name: 'Liga' };
  const countryUpper = (leagueObj.country || 'INTERNATIONAL').toUpperCase();

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

    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
      <button id="ttab-overview" onclick="switchTeamModalTab('overview')" class="px-4 py-1.5 text-xs font-black rounded-full transition bg-white text-slate-900 shadow">Overview</button>
      <button id="ttab-summary" onclick="switchTeamModalTab('summary')" class="px-4 py-1.5 text-xs font-bold rounded-full transition text-slate-300 hover:text-white hover:bg-white/10">Fixtures</button>
      <button id="ttab-standings" onclick="switchTeamModalTab('standings')" class="px-4 py-1.5 text-xs font-bold rounded-full transition text-slate-300 hover:text-white hover:bg-white/10">Table</button>
      <button id="ttab-player" onclick="switchTeamModalTab('player')" class="px-4 py-1.5 text-xs font-bold rounded-full transition text-slate-300 hover:text-white hover:bg-white/10">Squad</button>
    </div>
  `;

  switchTeamModalTab('overview');
  loadTeamFullData(leagueId, teamId, teamName);
}

function closeTeamModal() {
  currentOpenTeam = null;
  document.getElementById('team-detail-modal').classList.add('hidden');
}

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
    let targetLeague = (leagueId && leagueId !== 'all') ? leagueId : 'esp.1';

    const [scheduleRes, rosterRes] = await Promise.all([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${targetLeague}/teams/${teamId}/schedule`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${targetLeague}/teams/${teamId}/roster`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    const events = scheduleRes?.events || [];
    const finishedEvents = events.filter(e => e.status?.type?.state === 'post').sort((a,b) => new Date(b.date) - new Date(a.date));
    const upcomingEvents = events.filter(e => e.status?.type?.state === 'pre' || e.status?.type?.state === 'in').sort((a,b) => new Date(a.date) - new Date(b.date));

    renderFotmobOverview(overviewContainer, teamId, teamName, finishedEvents, upcomingEvents, rosterRes);
    renderFotmobFixtures(summaryContainer, events, teamId);

    const targetLeagueObj = LEAGUES.find(l => l.id === targetLeague) || LEAGUES[0];
    standingsContainer.innerHTML = '';
    await renderLeagueStandingsTable(targetLeagueObj, standingsContainer, teamId);

    loadStyledSquadRosterUI(targetLeague, teamId);

    // FITUR BARU: Muat berita terkini khusus klub
    loadTeamSpecificNews(teamId, overviewContainer);

  } catch (err) {
    if (overviewContainer) {
      overviewContainer.innerHTML = `<div class="p-6 text-center text-xs text-red-400">Gagal memuat data klub.</div>`;
    }
  }
}

// FITUR BARU: Fetch Berita Terkini Khusus Tim (News Update)
async function loadTeamSpecificNews(teamId, container) {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/news?team=${teamId}`);
    const data = await res.json();
    const articles = data.articles || [];

    if (articles.length === 0) return;

    const newsBlock = document.createElement('div');
    newsBlock.className = 'bg-[#102719] border border-white/10 p-3.5 rounded-3xl space-y-3 mt-3 shadow-lg';
    newsBlock.innerHTML = `
      <h4 class="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between pb-1 border-b border-white/10">
        <span class="flex items-center gap-1.5"><i class="fa-solid fa-newspaper text-emerald-400"></i> Kabar Terkini Klub</span>
        <span class="text-[9px] text-slate-400 font-normal">ESPN News</span>
      </h4>
      <div class="space-y-2">
        ${articles.slice(0, 3).map(art => `
          <a href="${art.links?.web?.href || '#'}" target="_blank" rel="noopener" class="flex items-center gap-2.5 p-2 bg-black/40 hover:bg-black/60 border border-white/5 rounded-2xl transition group">
            ${art.images?.[0]?.url ? `<img src="${art.images[0].url}" class="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10">` : ''}
            <div class="min-w-0 flex-1">
              <h5 class="text-[11px] font-bold text-slate-200 truncate leading-snug group-hover:text-emerald-400 transition">${art.headline}</h5>
              <p class="text-[9px] text-slate-400 truncate mt-0.5">${art.description || ''}</p>
            </div>
            <i class="fa-solid fa-chevron-right text-[8px] text-slate-500 mr-1 shrink-0"></i>
          </a>
        `).join('')}
      </div>
    `;
    container.appendChild(newsBlock);
  } catch (e) {}
}

function renderFotmobOverview(container, teamId, teamName, finishedEvents, upcomingEvents, rosterData) {
  if (!container) return;
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-4';

  const topMatches = [...finishedEvents.slice(0, 1), ...upcomingEvents.slice(0, 2)];
  if (topMatches.length > 0) {
    const carouselSection = document.createElement('div');
    carouselSection.className = 'grid grid-cols-3 gap-2';

    topMatches.forEach(evt => {
      const comp = evt.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');
      const state = evt.status?.type?.state;
      const isPost = state === 'post';

      const homeLogo = getTeamLogo(home?.team) || PLAIN_SHIELD_LOGO;
      const awayLogo = getTeamLogo(away?.team) || PLAIN_SHIELD_LOGO;
      const dateFormatted = new Date(evt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const timeFormatted = new Date(evt.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

      const card = document.createElement('div');
      card.className = 'bg-[#102719] border border-white/10 p-2.5 rounded-2xl flex flex-col justify-between text-center cursor-pointer hover:bg-[#163522] transition';
      card.onclick = () => openMatchDetail(evt.leagueId || 'esp.1', evt.id, evt.leagueName || 'Detail');

      card.innerHTML = `
        <div class="text-[9px] font-bold text-emerald-400 truncate mb-1.5 flex items-center justify-center gap-1">
          <i class="fa-solid fa-trophy text-[8px]"></i> ${evt.season?.slug || 'League'}
        </div>
        <div class="flex items-center justify-between my-1 px-1">
          <img src="${homeLogo}" class="w-5 h-5 object-contain">
          <span class="text-xs font-black text-white px-1">
            ${isPost ? `${home?.score || 0} - ${away?.score || 0}` : `${dateFormatted}<br><span class="text-[9px] text-slate-400 font-normal">${timeFormatted}</span>`}
          </span>
          <img src="${awayLogo}" class="w-5 h-5 object-contain">
        </div>
      `;
      carouselSection.appendChild(card);
    });
    wrapper.appendChild(carouselSection);
  }

  const last10 = finishedEvents.slice(0, 10).reverse();
  if (last10.length > 0) {
    const startDate = new Date(last10[0].date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    const endDate = new Date(last10[last10.length - 1].date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });

    const formCard = document.createElement('div');
    formCard.className = 'bg-[#102719] border border-white/10 p-3.5 rounded-3xl space-y-3';
    
    let itemsHtml = last10.map(evt => {
      const comp = evt.competitions?.[0];
      const myTeam = comp?.competitors?.find(c => String(c.team.id) === String(teamId));
      const oppTeam = comp?.competitors?.find(c => String(c.team.id) !== String(teamId));
      
      const myScore = parseInt(myTeam?.score || '0');
      const oppScore = parseInt(oppTeam?.score || '0');
      const oppLogo = getTeamLogo(oppTeam?.team) || PLAIN_SHIELD_LOGO;

      let resBadge = { icon: 'fa-minus', color: 'bg-[#2a3d30] text-slate-300' };
      if (myScore > oppScore) {
        resBadge = { icon: 'fa-check', color: 'bg-emerald-600 text-white' };
      } else if (myScore < oppScore) {
        resBadge = { icon: 'fa-xmark', color: 'bg-red-600/80 text-white' };
      }

      return `
        <div class="flex flex-col items-center gap-1 flex-1 min-w-0">
          <img src="${oppLogo}" class="w-5 h-5 object-contain" title="${oppTeam?.team?.displayName || ''}">
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

  const rawCoach = rosterData?.coach?.[0];
  const coachName = rawCoach ? (rawCoach.displayName || rawCoach.fullName) : null;

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

function renderFotmobFixtures(container, events, teamId) {
  if (!container) return;
  container.innerHTML = '';

  if (!events || events.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">Tidak ada jadwal pertandingan.</div>`;
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-2.5';

  events.forEach(evt => {
    const comp = evt.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');
    const state = evt.status?.type?.state;
    const isPost = state === 'post';

    const homeLogo = getTeamLogo(home?.team) || PLAIN_SHIELD_LOGO;
    const awayLogo = getTeamLogo(away?.team) || PLAIN_SHIELD_LOGO;
    const dateFormatted = new Date(evt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const timeFormatted = new Date(evt.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

    const card = document.createElement('div');
    card.className = 'bg-[#102719] border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs cursor-pointer hover:bg-[#163522] transition';
    card.onclick = () => openMatchDetail(evt.leagueId || 'esp.1', evt.id, evt.leagueName || 'Detail');

    card.innerHTML = `
      <div class="flex items-center gap-2 w-[38%] min-w-0">
        <img src="${homeLogo}" class="w-5 h-5 object-contain shrink-0">
        <span class="font-extrabold text-white truncate text-[11px]">${home?.team?.shortDisplayName || home?.team?.displayName || 'Home'}</span>
      </div>

      <div class="w-[24%] text-center shrink-0">
        ${isPost ? `
          <span class="font-black text-white text-xs bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">${home?.score || 0} - ${away?.score || 0}</span>
          <span class="block text-[8px] text-emerald-400 font-bold mt-0.5">FT</span>
        ` : `
          <span class="block text-[10px] font-bold text-white">${dateFormatted}</span>
          <span class="block text-[9px] text-slate-400 font-semibold">${timeFormatted}</span>
        `}
      </div>

      <div class="flex items-center justify-end gap-2 w-[38%] min-w-0 text-right">
        <span class="font-extrabold text-white truncate text-[11px]">${away?.team?.shortDisplayName || away?.team?.displayName || 'Away'}</span>
        <img src="${awayLogo}" class="w-5 h-5 object-contain shrink-0">
      </div>
    `;
    wrapper.appendChild(card);
  });

  container.appendChild(wrapper);
}

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
    }

    renderExactScreenshotSquadUI(data.coach?.[0], players, container, leagueId);
  } catch (err) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">Data skuad tidak tersedia.</div>`;
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
    country: p.citizenship || p.birthPlace?.country || 'England',
    isInjured: (p.injuries && p.injuries.length > 0) || false
  };
}

function renderExactScreenshotSquadUI(coach, players, container, leagueId) {
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
    posBlock.className = 'bg-[#102719] border border-white/10 rounded-3xl p-3.5 space-y-2 mb-3 shadow-lg';

    let rowsHtml = catPlayers.map(p => `
      <div onclick="openPlayerBioModal('${leagueId}', '${p.id}')" class="flex items-center justify-between py-2 px-1 hover:bg-[#163522] rounded-xl transition cursor-pointer">
        <div class="flex items-center gap-2.5 truncate max-w-[85%]">
          <span class="${cat.color} font-black text-xs w-7 shrink-0 text-left">${p.jersey}</span>
          <div class="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500/30 overflow-hidden shrink-0 flex items-center justify-center">
            <img src="${PLAIN_PERSON_HEADSHOT}" loading="lazy" class="w-full h-full object-cover" onload="loadMultiTierPlayerPhoto(this, '${p.id}', '${p.name.replace(/'/g, "\\'")}')" onerror="handlePlayerImgError(this, '${p.name.replace(/'/g, "\\'")}')">
          </div>
          <div class="truncate">
            <div class="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span class="truncate">${p.name}</span>
            </div>
            <div class="text-[9px] text-slate-400 truncate mt-0.5">${p.country}</div>
          </div>
        </div>
        <i class="fa-solid fa-chevron-right text-[8px] text-slate-500 mr-1 shrink-0"></i>
      </div>
    `).join('');

    posBlock.innerHTML = `
      <h3 class="text-xs font-black uppercase tracking-wider ${cat.color} pb-1 border-b border-white/10">${cat.name}</h3>
      <div class="divide-y divide-white/5">${rowsHtml}</div>
    `;
    container.appendChild(posBlock);
  });
}
