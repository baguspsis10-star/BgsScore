// TEAMS & CLUB DETAILS MODULE

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
  loadData(true);
}

// Open Team Detail Modal
async function openTeamDetail(leagueId, teamId, teamName, event) {
  if (event) event.stopPropagation();
  currentOpenTeam = { leagueId, teamId, teamName };

  const modal = document.getElementById('team-detail-modal');
  document.getElementById('team-modal-title').innerText = teamName;
  modal.classList.remove('hidden');

  switchTeamModalTab('player');

  const isFavTeam = isTeamFavorite(teamId);
  const banner = document.getElementById('team-modal-banner');
  const teamLogo = dataSaverMode ? PLAIN_SHIELD_LOGO : `https://a.espncdn.com/i/teamlogos/soccer/500/${teamId}.png`;

  banner.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 bg-slate-950 rounded-xl p-1.5 border border-slate-800 flex items-center justify-center shrink-0">
        <img src="${teamLogo}" loading="lazy" class="w-full h-full object-contain" onError="this.src='${PLAIN_SHIELD_LOGO}'">
      </div>
      <div>
        <h2 class="text-sm font-black text-white leading-tight flex items-center gap-1.5">
          <span>${teamName}</span>
          ${isFavTeam ? '<i class="fa-solid fa-star text-amber-400 text-xs"></i>' : ''}
        </h2>
        <p class="text-[10px] text-emerald-400 font-semibold mt-0.5">${LEAGUES.find(l=>l.id===leagueId)?.name || 'Klub Sepak Bola'}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="toggleTeamFavorite('${teamId}', event); openTeamDetail('${leagueId}', '${teamId}', '${teamName.replace(/'/g, "\\'")}');" class="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-400 transition" title="Jadikan Tim Favorit">
        <i class="${isFavTeam ? 'fa-solid fa-star text-amber-400' : 'fa-regular fa-star text-slate-400'} text-base"></i>
      </button>
    </div>
  `;

  await Promise.all([
    loadTeamMatchesSummary(leagueId, teamId),
    loadStyledSquadRosterUI(leagueId, teamId),
    loadTeamStandingsHighlight(leagueId, teamId)
  ]);
}

// Close Team Detail Modal
function closeTeamModal() {
  currentOpenTeam = null;
  document.getElementById('team-detail-modal').classList.add('hidden');
}

// Switch Team Modal Tabs (Summary / Player / Standings)
function switchTeamModalTab(tabName) {
  const tabs = ['summary', 'player', 'standings'];
  tabs.forEach(t => {
    const btn = document.getElementById(`ttab-${t}`);
    const content = document.getElementById(`tcontent-${t}`);

    if (btn && content) {
      if (t === tabName) {
        btn.className = "flex-1 py-2 text-xs font-bold text-emerald-400 border-b-2 border-emerald-500 transition";
        content.classList.remove('hidden');
      } else {
        btn.className = "flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition";
        content.classList.add('hidden');
      }
    }
  });
}

// Load Team Matches Summary in Team Modal
async function loadTeamMatchesSummary(leagueId, teamId) {
  const container = document.getElementById('tcontent-summary');
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-500"></i>
      <p class="text-xs">Memuat pertandingan klub...</p>
    </div>
  `;

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/teams/${teamId}/schedule`);
    const data = await res.json();
    const events = data.events || [];

    const upcoming = events.filter(e => e.status?.type?.state === 'pre').slice(0, 5);
    const finished = events.filter(e => e.status?.type?.state === 'post').reverse().slice(0, 5);

    container.innerHTML = '';

    if (upcoming.length > 0) {
      const upSec = document.createElement('div');
      upSec.className = 'space-y-2';
      upSec.innerHTML = `
        <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
          <i class="fa-regular fa-calendar-days"></i> Pertandingan Selanjutnya
        </h4>
        <div id="team-upcoming-grid" class="space-y-2"></div>
      `;
      container.appendChild(upSec);
      renderMatchesCards('team-upcoming-grid', upcoming, true);
    } else {
      container.innerHTML += `<div class="p-3 bg-slate-900 rounded-xl text-xs text-slate-500 border border-slate-800">Tidak ada jadwal pertandingan selanjutnya.</div>`;
    }

    if (finished.length > 0) {
      const finSec = document.createElement('div');
      finSec.className = 'space-y-2 pt-2';
      finSec.innerHTML = `
        <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <i class="fa-solid fa-circle-check"></i> Pertandingan Selesai
        </h4>
        <div id="team-finished-grid" class="space-y-2"></div>
      `;
      container.appendChild(finSec);
      renderMatchesCards('team-finished-grid', finished, true);
    }
  } catch (err) {
    container.innerHTML = `<p class="text-center text-slate-500 text-xs py-6">Gagal memuat pertandingan klub.</p>`;
  }
}

// Load Squad Roster UI
async function loadStyledSquadRosterUI(leagueId, teamId) {
  const container = document.getElementById('tcontent-player');
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-500"></i>
      <p class="text-xs">Memuat skuad pemain...</p>
    </div>
  `;

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/teams/${teamId}/roster`);
    const data = await res.json();
    
    const rawCoach = data.coach?.[0];
    const coach = rawCoach ? {
      displayName: rawCoach.displayName || rawCoach.fullName || '-',
      nationality: rawCoach.citizenship || rawCoach.nationality || '',
      flag: getCountryFlag(rawCoach.citizenship || rawCoach.nationality)
    } : null;

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

    renderExactScreenshotSquadUI(coach, players, container);
  } catch (err) {
    renderExactScreenshotSquadUI(null, generateFallbackSquadData(), container);
  }
}

// Format Individual Player Data Object
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

  const country = p.citizenship || p.birthPlace?.country || 'England';
  const isInjured = (p.injuries && p.injuries.length > 0) || false;
  const pName = p.fullName || p.displayName || 'Pemain';

  return {
    id: p.id || Math.floor(Math.random()*90000),
    name: pName,
    jersey: p.jersey ? `#${p.jersey}` : `#${Math.floor(Math.random()*40)+1}`,
    category,
    country,
    isInjured
  };
}

// Generate Fallback Squad Data if API Fails
function generateFallbackSquadData() {
  return [
    { id: 101, name: 'Senne Lammens', jersey: '#1', category: 'Goalkeeper', country: 'Belgium', isInjured: false },
    { id: 102, name: 'Karl Darlow', jersey: '#12', category: 'Goalkeeper', country: 'Wales', isInjured: false },
    { id: 201, name: 'Leny Yoro', jersey: '#15', category: 'Defender', country: 'France', isInjured: false },
    { id: 202, name: 'Lisandro Martínez', jersey: '#6', category: 'Defender', country: 'Argentina', isInjured: false },
    { id: 301, name: 'Kobbie Mainoo', jersey: '#37', category: 'Midfielder', country: 'England', isInjured: false },
    { id: 302, name: 'Bruno Fernandes', jersey: '#8', category: 'Midfielder', country: 'Portugal', isInjured: false },
    { id: 401, name: 'Matheus Cunha', jersey: '#10', category: 'Forward', country: 'Brazil', isInjured: false }
  ];
}

// Render Squad UI Grouped by Position Categories
function renderExactScreenshotSquadUI(coach, players, container) {
  container.innerHTML = '';

  const coachName = coach ? coach.displayName : '-';
  const coachNation = coach && coach.nationality ? `${coach.flag || ''} ${coach.nationality}` : '-';

  const coachCard = document.createElement('div');
  coachCard.className = 'bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3 shadow-md mb-3';
  coachCard.innerHTML = `
    <div class="w-10 h-10 rounded-full bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center text-slate-400">
      <i class="fa-solid fa-user-tie text-base"></i>
    </div>
    <div class="truncate">
      <div class="text-xs font-bold text-white truncate">${coachName}</div>
      <div class="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
        <span>Coach</span> • <span>${coachNation}</span>
      </div>
    </div>
  `;
  container.appendChild(coachCard);

  const posCategories = [
    { name: 'Goalkeeper', color: 'text-amber-500' },
    { name: 'Defender', color: 'text-blue-500' },
    { name: 'Midfielder', color: 'text-emerald-500' },
    { name: 'Forward', color: 'text-red-500' }
  ];

  posCategories.forEach(cat => {
    const catPlayers = players.filter(p => p.category === cat.name);
    if (catPlayers.length === 0) return;

    const posBlock = document.createElement('div');
    posBlock.className = 'bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3 mb-4 shadow-xl';

    let rowsHtml = catPlayers.map(p => `
      <div class="flex items-center justify-between py-2 px-1 hover:bg-slate-800/40 rounded-xl transition">
        <div class="flex items-center gap-2.5 truncate max-w-[85%]">
          <span class="${cat.color} font-black text-xs w-7 shrink-0 text-left">${p.jersey}</span>
          <div class="w-8 h-8 rounded-full bg-slate-950 overflow-hidden shrink-0 border border-slate-800/80 flex items-center justify-center">
            <img src="${PLAIN_PERSON_HEADSHOT}" loading="lazy" class="w-full h-full object-cover" onload="loadMultiTierPlayerPhoto(this, '${p.id}', '${p.name.replace(/'/g, "\\'")}')" onerror="handlePlayerImgError(this, '${p.name.replace(/'/g, "\\'")}')">
          </div>
          <div class="truncate">
            <div class="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span class="truncate">${p.name}</span>
              ${p.isInjured ? '<i class="fa-solid fa-plus text-red-500 text-[10px]" title="Cedera"></i>' : ''}
            </div>
            <div class="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <span>${getCountryFlag(p.country)}</span>
              <span>${p.country}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    posBlock.innerHTML = `
      <h3 class="text-sm font-black ${cat.color} mb-1">${cat.name}</h3>
      <div class="divide-y divide-slate-800/40">${rowsHtml}</div>
    `;
    container.appendChild(posBlock);
  });
}

// Load Standings View Highlighted for Team
async function loadTeamStandingsHighlight(leagueId, teamId) {
  const container = document.getElementById('tcontent-standings');
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-500"></i>
      <p class="text-xs">Memuat posisi klasemen...</p>
    </div>
  `;

  try {
    const targetLeague = LEAGUES.find(l => l.id === leagueId) || LEAGUES[0];
    container.innerHTML = '';
    await renderLeagueStandingsTable(targetLeague, container, teamId);
  } catch (err) {
    container.innerHTML = `<p class="text-center text-slate-500 text-xs py-6">Klasemen tidak tersedia.</p>`;
  }
}
