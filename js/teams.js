// TEAMS & CLUB DETAILS MODULE - 5 LAST MATCHES WITH SCORES & EMPTY OVERVIEW

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

function isMatchFinished(evt) {
  const state = evt.status?.type?.state;
  const completed = evt.status?.type?.completed;
  const detail = (evt.status?.type?.shortDetail || evt.status?.type?.description || '').toLowerCase();
  return state === 'post' || completed === true || detail.includes('ft') || detail.includes('final');
}

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

// Open Team Detail Modal
async function openTeamDetail(leagueId, teamId, teamName, event) {
  if (event) event.stopPropagation();
  currentOpenTeam = { leagueId, teamId, teamName };

  if (typeof closeModal === 'function') closeModal();

  const modal = document.getElementById('team-detail-modal');
  modal.classList.remove('hidden');

  const isFavTeam = isTeamFavorite(teamId);
  const teamLogo = dataSaverMode ? PLAIN_SHIELD_LOGO : `https://a.espncdn.com/i/teamlogos/soccer/500/${teamId}.png`;
  const validLeagueId = (!leagueId || leagueId === 'all') ? 'esp.1' : leagueId;
  const leagueObj = LEAGUES.find(l => l.id === validLeagueId) || { country: 'SPANYOL', name: 'Liga' };
  const countryUpper = (leagueObj.country || 'SPANYOL').toUpperCase();

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
  loadTeamFullData(validLeagueId, teamId, teamName);
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

// Main Data Fetcher
async function loadTeamFullData(leagueId, teamId, teamName) {
  const overviewContainer = document.getElementById('tcontent-overview');
  const summaryContainer = document.getElementById('tcontent-summary');
  const standingsContainer = document.getElementById('tcontent-standings');

  // Overview dikosongkan
  if (overviewContainer) {
    overviewContainer.innerHTML = '';
  }

  try {
    const targetLeague = (!leagueId || leagueId === 'all') ? 'esp.1' : leagueId;

    let scheduleRes = null;
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${targetLeague}/teams/${teamId}/schedule`);
      if (res.ok) scheduleRes = await res.json();
    } catch(e){}

    let events = scheduleRes?.events || [];

    if (events.length === 0 && typeof cachedEvents !== 'undefined' && Array.isArray(cachedEvents)) {
      events = cachedEvents.filter(evt => {
        const comp = evt.competitions?.[0];
        const hId = comp?.competitors?.find(c => c.homeAway === 'home')?.team?.id;
        const aId = comp?.competitors?.find(c => c.homeAway === 'away')?.team?.id;
        return String(hId) === String(teamId) || String(aId) === String(teamId);
      });
    }

    const finishedEvents = events.filter(e => isMatchFinished(e)).sort((a,b) => new Date(b.date) - new Date(a.date));

    // Render Fixtures Tab (5 Pertandingan Terakhir Lengkap dengan SKOR)
    renderFotmobFixtures(summaryContainer, finishedEvents);

    // Render Standings
    const targetLeagueObj = LEAGUES.find(l => l.id === targetLeague) || LEAGUES[0];
    standingsContainer.innerHTML = '';
    await renderLeagueStandingsTable(targetLeagueObj, standingsContainer, teamId);

    // Render Squad
    loadStyledSquadRosterUI(targetLeague, teamId);

  } catch (err) {
    console.error(err);
  }
}

// Render Fixtures Tab (5 Laga Terakhir + Skor Akhir)
function renderFotmobFixtures(container, finishedEvents) {
  if (!container) return;
  container.innerHTML = '';

  const last5Matches = finishedEvents.slice(0, 5);
  if (last5Matches.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">Tidak ada riwayat pertandingan selesai.</div>`;
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-2.5';

  last5Matches.forEach(evt => {
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
    card.onclick = () => openMatchDetail(evt.leagueId || 'esp.1', evt.id, evt.leagueName || 'Detail');

    card.innerHTML = `
      <!-- Home Team -->
      <div class="flex items-center gap-2 w-[38%] min-w-0">
        <img src="${homeLogo}" class="w-5 h-5 object-contain shrink-0" onerror="this.src='${PLAIN_SHIELD_LOGO}'">
        <span class="font-extrabold text-white truncate text-[11px]">${home?.team?.shortDisplayName || home?.team?.displayName || 'Home'}</span>
      </div>

      <!-- Skor Akhir Pertandingan -->
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
    country: p.citizenship || p.birthPlace?.country || 'Pemain',
    isInjured: (p.injuries && p.injuries.length > 0) || false
  };
}

function generateFallbackSquadData() {
  return [
    { id: 101, name: 'Pemain 1', jersey: '#1', category: 'Goalkeeper', country: 'Pemain', isInjured: false },
    { id: 201, name: 'Pemain 2', jersey: '#4', category: 'Defender', country: 'Pemain', isInjured: false }
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
