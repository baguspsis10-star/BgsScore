// TEAMS & CLUB DETAILS MODULE (100% PURE ESPN LIVE API DATA)

// Global Safe Fallbacks
if (typeof window.favoriteTeams === 'undefined') window.favoriteTeams = JSON.parse(localStorage.getItem('bgs_favorite_teams') || '[]');
if (typeof window.PLAIN_SHIELD_LOGO === 'undefined') window.PLAIN_SHIELD_LOGO = 'https://a.espncdn.com/i/teamlogos/default-team-logo.png';
if (typeof window.PLAIN_PERSON_HEADSHOT === 'undefined') window.PLAIN_PERSON_HEADSHOT = 'https://a.espncdn.com/i/headshots/nopic-land-24x27.png';
if (typeof window.LEAGUES === 'undefined') window.LEAGUES = [];
if (typeof window.dataSaverMode === 'undefined') window.dataSaverMode = false;
if (typeof window.getCountryFlag === 'undefined') window.getCountryFlag = () => '🏳️';
if (typeof window.getFormattedDate === 'undefined') window.getFormattedDate = (d) => d.toISOString().split('T')[0];

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
  if (typeof loadData === 'function') loadData(true);
}

// Open Team Detail Modal
async function openTeamDetail(leagueId, teamId, teamName, event) {
  if (event) event.stopPropagation();
  currentOpenTeam = { leagueId, teamId, teamName };

  if (typeof closeModal === 'function') {
    closeModal();
  }

  const modal = document.getElementById('team-detail-modal');
  if (!modal) return;

  const titleElem = document.getElementById('team-modal-title');
  if (titleElem) titleElem.innerText = teamName;
  
  modal.classList.remove('hidden');

  const isFavTeam = isTeamFavorite(teamId);
  const banner = document.getElementById('team-modal-banner');
  const teamLogo = dataSaverMode ? PLAIN_SHIELD_LOGO : `https://a.espncdn.com/i/teamlogos/soccer/500/${teamId}.png`;

  if (banner) {
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
  }

  switchTeamModalTab('overview');

  await Promise.allSettled([
    loadTeamOverview(leagueId, teamId, teamName),
    loadTeamFixturesTab(leagueId, teamId),
    loadTeamStandingsHighlight(leagueId, teamId),
    loadStyledSquadRosterUI(leagueId, teamId)
  ]);
}

function closeTeamModal() {
  currentOpenTeam = null;
  const modal = document.getElementById('team-detail-modal');
  if (modal) modal.classList.add('hidden');
}

function switchTeamModalTab(tabName) {
  const tabs = ['overview', 'fixtures', 'table', 'player'];
  tabs.forEach(t => {
    const btn = document.getElementById(`ttab-${t}`);
    const content = document.getElementById(`tcontent-${t}`);

    if (btn && content) {
      if (t === tabName) {
        btn.className = "flex-1 py-2 text-xs font-bold text-emerald-400 border-b-2 border-emerald-500 transition text-center cursor-pointer";
        content.classList.remove('hidden');
      } else {
        btn.className = "flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition text-center cursor-pointer";
        content.classList.add('hidden');
      }
    }
  });
}

// --- OVERVIEW TAB (Real ESPN Schedule, Formation & Colors) ---
async function loadTeamOverview(leagueId, teamId, teamName) {
  const container = document.getElementById('tcontent-overview');
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-4 text-white">
      <!-- Last 10 Matches Widget -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-300">Last 10 Matches</h3>
          <span class="text-[10px] text-slate-500 font-semibold">Hasil Laga</span>
        </div>
        <div id="last-10-grid" class="flex items-center justify-between gap-1 overflow-x-auto pb-1">
          <i class="fa-solid fa-circle-notch fa-spin text-emerald-500 mx-auto py-4"></i>
        </div>
      </div>

      <!-- Manager & Club Colors (Live ESPN) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <h3 class="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Pelatih Utama</h3>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
              <i class="fa-solid fa-user-tie text-base"></i>
            </div>
            <div>
              <p id="overview-manager-name" class="text-xs font-bold text-white">Memuat...</p>
              <p id="overview-manager-nation" class="text-[10px] text-slate-400 mt-0.5">-</p>
            </div>
          </div>
        </div>

        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
          <h3 class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Identitas Warna Klub</h3>
          <div id="overview-club-colors" class="flex items-center gap-3 pt-1">
            <i class="fa-solid fa-circle-notch fa-spin text-emerald-500 text-xs"></i>
          </div>
        </div>
      </div>

      <!-- Formation Pitch Widget (Live ESPN Match Summary) -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-300">Formasi Laga Terakhir</h3>
          <span id="overview-formation-badge" class="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">-</span>
        </div>
        <div id="overview-formation-pitch">
          <div class="flex flex-col items-center justify-center py-10 text-slate-500 text-xs">
            <i class="fa-solid fa-circle-notch fa-spin text-emerald-500 text-lg mb-2"></i>
            <span>Memuat formasi pertandingan terakhir...</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Dynamic Data Loaders
  loadLast10MatchesData(leagueId, teamId);
  loadTeamDetailsAndColors(leagueId, teamId);
}

// Fetch Live Match Formation & Lineup from ESPN Summary
async function loadLast10MatchesData(leagueId, teamId) {
  const container = document.getElementById('last-10-grid');
  const pitchContainer = document.getElementById('overview-formation-pitch');
  const badgeElem = document.getElementById('overview-formation-badge');

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId || 'esp.1'}/teams/${teamId}/schedule`);
    const data = await res.json();
    const events = (data.events || []).filter(e => e.status?.type?.state === 'post');

    if (events.length === 0) {
      if (container) container.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-2 w-full">Belum ada riwayat pertandingan.</p>`;
      if (pitchContainer) pitchContainer.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-6 w-full">Formasi tidak tersedia.</p>`;
      return;
    }

    const last10 = events.slice(-10);
    if (container) {
      container.innerHTML = last10.map(evt => {
        const comp = evt.competitions?.[0];
        const oppCompetitor = comp?.competitors?.find(c => String(c.team?.id) !== String(teamId));
        const myCompetitor = comp?.competitors?.find(c => String(c.team?.id) === String(teamId));

        const oppLogo = oppCompetitor?.team?.logo || PLAIN_SHIELD_LOGO;
        const myScore = parseInt(myCompetitor?.score?.value || 0);
        const oppScore = parseInt(oppCompetitor?.score?.value || 0);

        let statusIcon = '<div class="w-4 h-4 rounded bg-slate-700 flex items-center justify-center text-[9px] text-slate-300 font-bold">-</div>';
        if (myScore > oppScore) {
          statusIcon = '<div class="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-[9px] text-slate-950 font-black"><i class="fa-solid fa-check"></i></div>';
        } else if (myScore < oppScore) {
          statusIcon = '<div class="w-4 h-4 rounded bg-rose-500 flex items-center justify-center text-[9px] text-white font-black"><i class="fa-solid fa-xmark"></i></div>';
        }

        return `
          <div class="flex flex-col items-center gap-1 min-w-[36px] p-1 bg-slate-950/40 rounded-xl border border-slate-800/40">
            <img src="${oppLogo}" class="w-5 h-5 object-contain" onError="this.src='${PLAIN_SHIELD_LOGO}'">
            <span class="text-[9px] font-bold text-white">${myScore}-${oppScore}</span>
            ${statusIcon}
          </div>
        `;
      }).join('');
    }

    // Load Real Lineup from Latest Match Summary
    const latestMatch = last10[last10.length - 1];
    if (latestMatch && pitchContainer) {
      fetchLatestMatchLineup(leagueId, latestMatch.id, teamId, pitchContainer, badgeElem);
    }
  } catch (err) {
    if (container) container.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-2 w-full">Gagal memuat rekam pertandingan.</p>`;
    if (pitchContainer) pitchContainer.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-6 w-full">Data formasi tidak dapat dimuat.</p>`;
  }
}

// Fetch Live Lineup from ESPN Summary Endpoint
async function fetchLatestMatchLineup(leagueId, eventId, teamId, pitchContainer, badgeElem) {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/summary?event=${eventId}`);
    const data = await res.json();
    const rosterData = data.rosters?.find(r => String(r.team?.id) === String(teamId));

    if (!rosterData || !rosterData.roster || rosterData.roster.length === 0) {
      pitchContainer.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-6 w-full">Lineup resmi tidak dipublikasikan untuk laga ini.</p>`;
      if (badgeElem) badgeElem.innerText = 'N/A';
      return;
    }

    if (badgeElem && rosterData.formation) {
      badgeElem.innerText = rosterData.formation;
    }

    const starters = rosterData.roster.filter(p => p.starter).slice(0, 11);
    if (starters.length === 0) {
      pitchContainer.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-6 w-full">Data starter tidak tersedia.</p>`;
      return;
    }

    // Dynamic Starting XI List
    let startersHtml = starters.map(p => `
      <div class="flex items-center justify-between p-2 bg-slate-950/50 rounded-lg border border-slate-800/40 text-xs">
        <div class="flex items-center gap-2 truncate">
          <span class="font-black text-emerald-400 w-5">${p.jersey ? `#${p.jersey}` : '-'}</span>
          <span class="font-bold text-white truncate">${p.athlete?.displayName || 'Pemain'}</span>
        </div>
        <span class="text-[10px] text-slate-400 font-semibold">${p.position?.abbreviation || '-'}</span>
      </div>
    `).join('');

    pitchContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
        ${startersHtml}
      </div>
    `;
  } catch (err) {
    pitchContainer.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-6 w-full">Gagal mengambil data lineup ESPN.</p>`;
  }
}

// Load Live Club Colors & Info
async function loadTeamDetailsAndColors(leagueId, teamId) {
  const colorsElem = document.getElementById('overview-club-colors');
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/teams/${teamId}`);
    const data = await res.json();
    const team = data.team;

    if (colorsElem && team) {
      const mainColor = team.color ? `#${team.color}` : '#10b981';
      const altColor = team.alternateColor ? `#${team.alternateColor}` : '#0f172a';

      colorsElem.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full border border-slate-700 shadow" style="background-color: ${mainColor}"></div>
          <span class="text-xs font-bold text-slate-300">Utama</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full border border-slate-700 shadow" style="background-color: ${altColor}"></div>
          <span class="text-xs font-bold text-slate-300">Sekunder</span>
        </div>
      `;
    }
  } catch (err) {
    if (colorsElem) colorsElem.innerHTML = `<span class="text-xs text-slate-500">-</span>`;
  }
}

// --- FIXTURES TAB ---
async function loadTeamFixturesTab(leagueId, teamId) {
  const container = document.getElementById('tcontent-fixtures');
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-500"></i>
      <p class="text-xs">Memuat jadwal pertandingan dari ESPN...</p>
    </div>
  `;

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId || 'esp.1'}/teams/${teamId}/schedule`);
    const data = await res.json();
    const events = data.events || [];

    if (events.length === 0) {
      container.innerHTML = `<p class="text-center text-slate-500 text-xs py-6">Tidak ada jadwal ditemukan.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="space-y-2">
        ${events.map(evt => {
          const comp = evt.competitions?.[0];
          const home = comp?.competitors?.find(c => c.homeAway === 'home');
          const away = comp?.competitors?.find(c => c.homeAway === 'away');
          const dateStr = new Date(evt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const isFinished = evt.status?.type?.state === 'post';

          return `
            <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-2 truncate max-w-[40%]">
                <img src="${home?.team?.logo || PLAIN_SHIELD_LOGO}" class="w-5 h-5 object-contain" onError="this.src='${PLAIN_SHIELD_LOGO}'">
                <span class="text-xs font-bold text-white truncate">${home?.team?.displayName || 'Home'}</span>
              </div>
              
              <div class="text-center px-2">
                <span class="text-[10px] font-bold text-emerald-400 block">${dateStr}</span>
                <span class="text-xs font-black text-white">${isFinished ? `${home?.score?.value || 0} - ${away?.score?.value || 0}` : 'VS'}</span>
              </div>

              <div class="flex items-center gap-2 truncate max-w-[40%] justify-end">
                <span class="text-xs font-bold text-white truncate text-right">${away?.team?.displayName || 'Away'}</span>
                <img src="${away?.team?.logo || PLAIN_SHIELD_LOGO}" class="w-5 h-5 object-contain" onError="this.src='${PLAIN_SHIELD_LOGO}'">
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="text-center text-slate-500 text-xs py-6">Gagal memuat jadwal pertandingan.</p>`;
  }
}

// --- SQUAD TAB (Live ESPN Roster & Coach) ---
async function loadStyledSquadRosterUI(leagueId, teamId) {
  const container = document.getElementById('tcontent-player');
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-500"></i>
      <p class="text-xs">Memuat skuad pemain dari ESPN...</p>
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

    // Set Manager Info in Overview Tab as well
    const mName = document.getElementById('overview-manager-name');
    const mNation = document.getElementById('overview-manager-nation');
    if (mName) mName.innerText = coach ? coach.displayName : 'Tidak tersedia';
    if (mNation) mNation.innerText = coach ? `${coach.flag} ${coach.nationality}` : '-';

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
      renderExactScreenshotSquadUI(coach, players, container);
    } else {
      container.innerHTML = `<p class="text-center text-slate-500 text-xs py-6">Data skuad tidak dipublikasikan oleh API ESPN untuk klub ini.</p>`;
    }
  } catch (err) {
    container.innerHTML = `<p class="text-center text-slate-500 text-xs py-6">Gagal memuat data skuad dari ESPN.</p>`;
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

  const country = p.citizenship || p.birthPlace?.country || '';
  const isInjured = (p.injuries && p.injuries.length > 0) || false;
  const pName = p.fullName || p.displayName || 'Pemain';

  return {
    id: p.id || Math.floor(Math.random()*90000),
    name: pName,
    jersey: p.jersey ? `#${p.jersey}` : '-',
    category,
    country,
    isInjured
  };
}

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
            <img src="${PLAIN_PERSON_HEADSHOT}" loading="lazy" class="w-full h-full object-cover" onError="this.src='${PLAIN_PERSON_HEADSHOT}'">
          </div>
          <div class="truncate">
            <div class="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span class="truncate">${p.name}</span>
              ${p.isInjured ? '<i class="fa-solid fa-plus text-red-500 text-[10px]" title="Cedera"></i>' : ''}
            </div>
            <div class="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <span>${getCountryFlag(p.country)}</span>
              <span>${p.country || '-'}</span>
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

// --- TABLE / STANDINGS TAB ---
async function loadTeamStandingsHighlight(leagueId, teamId) {
  const container = document.getElementById('tcontent-table') || document.getElementById('tcontent-standings');
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-500"></i>
      <p class="text-xs">Memuat posisi klasemen...</p>
    </div>
  `;

  try {
    const targetLeague = LEAGUES.find(l => l.id === leagueId) || LEAGUES[0] || { id: leagueId || 'esp.1' };
    container.innerHTML = '';

    const tableWrapper = document.createElement('div');
    container.appendChild(tableWrapper);

    if (typeof renderLeagueStandingsTable === 'function') {
      await renderLeagueStandingsTable(targetLeague, tableWrapper, teamId);
    } else {
      tableWrapper.innerHTML = `<p class="text-center text-slate-500 text-xs py-4">Tabel klasemen dimuat.</p>`;
    }
  } catch (err) {
    container.innerHTML = `<p class="text-center text-slate-500 text-xs py-6">Klasemen tidak tersedia.</p>`;
  }
}
