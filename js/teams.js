// ==========================================
// TEAM DETAIL MODAL MODULE (FOTMOB / FM STYLE)
// ==========================================

let currentTeamData = null;
let currentTeamTab = 'overview';

// 1. OPEN TEAM DETAIL MODAL
async function openTeamDetail(leagueId, teamId, teamName) {
  const modal = document.getElementById('team-detail-modal');
  if (!modal) return;

  modal.style.zIndex = typeof getNextZIndex === 'function' ? getNextZIndex() : 60;
  modal.classList.remove('hidden');

  const container = document.getElementById('team-modal-content');
  if (container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
        <i class="fa-solid fa-circle-notch fa-spin text-2xl text-emerald-400"></i>
        <p class="text-xs font-semibold">Memuat profil lengkap ${teamName}...</p>
      </div>
    `;
  }

  try {
    // Fetch data paralel: Info Tim, Jadwal/Hasil, Roster Pemain
    const [teamRes, scheduleRes, rosterRes] = await Promise.all([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}`),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/schedule`),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/roster`).catch(() => null)
    ]);

    const teamData = teamRes.ok ? await teamRes.json() : null;
    const scheduleData = scheduleRes.ok ? await scheduleRes.json() : null;
    const rosterData = (rosterRes && rosterRes.ok) ? await rosterRes.json() : null;

    currentTeamData = {
      id: teamId,
      leagueId: leagueId,
      info: teamData?.team || {},
      events: scheduleData?.events || [],
      roster: rosterData?.athletes || []
    };

    renderTeamModalUI();
  } catch (err) {
    console.error("Gagal memuat detail tim:", err);
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-400 space-y-2">
          <i class="fa-solid fa-triangle-exclamation text-2xl text-amber-400"></i>
          <p class="text-xs">Gagal mengambil data profil tim dari server.</p>
        </div>
      `;
    }
  }
}

// 2. CLOSE TEAM DETAIL MODAL
function closeTeamModal() {
  const modal = document.getElementById('team-detail-modal');
  if (modal) modal.classList.add('hidden');
  if (typeof checkResetZIndex === 'function') checkResetZIndex();
}

// 3. RENDER MAIN UI CONTAINER
function renderTeamModalUI() {
  const container = document.getElementById('team-modal-content');
  if (!container || !currentTeamData) return;

  const info = currentTeamData.info;
  const teamColor = info.color ? `#${info.color}` : '#0f291e';
  const logoUrl = typeof getTeamLogo === 'function' ? getTeamLogo(info) : (info.logos?.[0]?.href || '');
  const country = info.standingSummary?.split('-')[0] || 'Klub';
  const managerName = info.coaches?.[0]?.firstName ? `${info.coaches[0].firstName} ${info.coaches[0].lastName}` : 'Manager';

  const isFav = typeof isTeamFavorite === 'function' ? isTeamFavorite(currentTeamData.id) : false;

  container.innerHTML = `
    <!-- HEADER HERO BANNER -->
    <div class="relative overflow-hidden rounded-3xl p-5 text-white shadow-2xl border border-white/10" style="background: linear-gradient(135deg, ${teamColor}dd 0%, #0c1a14 100%);">
      <div class="flex items-center justify-between relative z-10 mb-4">
        <button onclick="closeTeamModal()" class="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition">
          <i class="fa-solid fa-arrow-left text-xs"></i>
        </button>
        <div class="flex items-center gap-2">
          <button onclick="toggleTeamFavorite('${currentTeamData.id}')" class="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-amber-400 transition">
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-star text-xs"></i>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-4 relative z-10">
        <div class="w-16 h-16 sm:w-20 sm:h-20 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
          <img src="${logoUrl}" class="w-full h-full object-contain" alt="">
        </div>
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">${country}</span>
          <h2 class="text-xl sm:text-2xl font-black text-white leading-tight">${info.displayName || info.name}</h2>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-[10px] bg-white/15 px-2.5 py-0.5 rounded-full font-bold border border-white/10 text-slate-200">Manager: ${managerName}</span>
          </div>
        </div>
      </div>

      <!-- NAVIGATION TABS -->
      <div class="flex items-center gap-1.5 mt-5 p-1 bg-black/40 rounded-full border border-white/10 overflow-x-auto no-scrollbar">
        <button id="ttab-overview" onclick="switchTeamTab('overview')" class="flex-1 py-1.5 px-4 text-xs font-bold rounded-full transition whitespace-nowrap text-center ${currentTeamTab === 'overview' ? 'bg-white text-slate-950 shadow' : 'text-slate-300 hover:text-white'}">Overview</button>
        <button id="ttab-fixtures" onclick="switchTeamTab('fixtures')" class="flex-1 py-1.5 px-4 text-xs font-bold rounded-full transition whitespace-nowrap text-center ${currentTeamTab === 'fixtures' ? 'bg-white text-slate-950 shadow' : 'text-slate-300 hover:text-white'}">Fixtures</button>
        <button id="ttab-table" onclick="switchTeamTab('table')" class="flex-1 py-1.5 px-4 text-xs font-bold rounded-full transition whitespace-nowrap text-center ${currentTeamTab === 'table' ? 'bg-white text-slate-950 shadow' : 'text-slate-300 hover:text-white'}">Table</button>
        <button id="ttab-squad" onclick="switchTeamTab('squad')" class="flex-1 py-1.5 px-4 text-xs font-bold rounded-full transition whitespace-nowrap text-center ${currentTeamTab === 'squad' ? 'bg-white text-slate-950 shadow' : 'text-slate-300 hover:text-white'}">Squad</button>
      </div>
    </div>

    <!-- TAB CONTENTS CONTAINER -->
    <div id="team-tab-body" class="mt-4 space-y-4">
      ${getTeamTabHTML(currentTeamTab)}
    </div>
  `;
}

// 4. SWITCH TAB LOGIC
function switchTeamTab(tabName) {
  currentTeamTab = tabName;
  const tabs = ['overview', 'fixtures', 'table', 'squad'];
  tabs.forEach(t => {
    const btn = document.getElementById(`ttab-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.className = "flex-1 py-1.5 px-4 text-xs font-bold rounded-full transition whitespace-nowrap text-center bg-white text-slate-950 shadow";
      } else {
        btn.className = "flex-1 py-1.5 px-4 text-xs font-bold rounded-full transition whitespace-nowrap text-center text-slate-300 hover:text-white";
      }
    }
  });

  const body = document.getElementById('team-tab-body');
  if (body) body.innerHTML = getTeamTabHTML(tabName);
}

// 5. GENERATE TAB CONTENT HTML
function getTeamTabHTML(tabName) {
  if (tabName === 'overview') return renderOverviewTab();
  if (tabName === 'fixtures') return renderFixturesTab();
  if (tabName === 'table') return renderTableTab();
  if (tabName === 'squad') return renderSquadTab();
  return '';
}

// --- OVERVIEW TAB (FOTMOB IMAGE EXACT MATCH) ---
function renderOverviewTab() {
  const events = currentTeamData.events || [];
  const teamId = String(currentTeamData.id);

  // Filter 10 Laga Terakhir (Post State)
  const finishedEvents = events
    .filter(e => e.status?.type?.state === 'post')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
    .reverse();

  // Carousel Match Cards (Near Upcoming & Recent)
  const nextMatch = events.find(e => e.status?.type?.state === 'pre');
  const lastMatch = events.filter(e => e.status?.type?.state === 'post').sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  let carouselHtml = '';
  if (lastMatch || nextMatch) {
    carouselHtml = `
      <div class="grid grid-cols-2 gap-2.5">
        ${lastMatch ? renderMiniMatchCard(lastMatch, 'Terakhir') : ''}
        ${nextMatch ? renderMiniMatchCard(nextMatch, 'Mendatang') : ''}
      </div>
    `;
  }

  // Last 10 Matches Tracker Strip
  let last10Html = '';
  if (finishedEvents.length > 0) {
    const trackerItems = finishedEvents.map(m => {
      const comp = m.competitions?.[0];
      const myTeam = comp?.competitors?.find(c => String(c.team.id) === teamId);
      const oppTeam = comp?.competitors?.find(c => String(c.team.id) !== teamId);
      
      const myScore = parseInt(myTeam?.score || '0');
      const oppScore = parseInt(oppTeam?.score || '0');
      const oppLogo = typeof getTeamLogo === 'function' ? getTeamLogo(oppTeam?.team) : '';

      let badge = { icon: 'fa-check', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      if (myScore < oppScore) {
        badge = { icon: 'fa-xmark', bg: 'bg-red-500/20 text-red-400 border-red-500/40' };
      } else if (myScore === oppScore) {
        badge = { icon: 'fa-minus', bg: 'bg-slate-500/20 text-slate-400 border-slate-500/40' };
      }

      return `
        <div class="flex flex-col items-center gap-1.5 shrink-0 min-w-[36px]">
          <div class="w-7 h-7 p-1 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <img src="${oppLogo}" class="w-full h-full object-contain" alt="">
          </div>
          <span class="text-[10px] font-black text-slate-200">${myScore}-${oppScore}</span>
          <span class="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold border ${badge.bg}">
            <i class="fa-solid ${badge.icon}"></i>
          </span>
        </div>
      `;
    }).join('');

    const firstDate = new Date(finishedEvents[0].date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    const lastDate = new Date(finishedEvents[finishedEvents.length - 1].date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });

    last10Html = `
      <div class="bg-[#180d30] border border-white/10 rounded-3xl p-4 space-y-3 shadow-xl">
        <div class="flex items-center justify-between text-xs font-black text-slate-300">
          <span>Last 10 Matches</span>
          <span class="text-[10px] text-slate-400 font-normal">${firstDate} - ${lastDate}</span>
        </div>
        <div class="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
          ${trackerItems}
        </div>
      </div>
    `;
  }

  return `
    ${carouselHtml}
    ${last10Html}
    
    <!-- MANAGER & CLUB INFO CARD -->
    <div class="bg-[#180d30] border border-white/10 rounded-3xl p-4 space-y-3 shadow-xl">
      <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-white/10">Informasi Tim</h3>
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="bg-white/5 p-3 rounded-2xl border border-white/5">
          <span class="text-[9px] text-slate-400 block font-bold uppercase">Stadion Markas</span>
          <span class="font-bold text-slate-200 truncate block mt-0.5">${currentTeamData.info.venue?.fullName || 'Stadion Utama'}</span>
        </div>
        <div class="bg-white/5 p-3 rounded-2xl border border-white/5">
          <span class="text-[9px] text-slate-400 block font-bold uppercase">Julukan</span>
          <span class="font-bold text-slate-200 truncate block mt-0.5">${currentTeamData.info.nickname || 'Klub'}</span>
        </div>
      </div>
    </div>
  `;
}

// MINI MATCH CARD HELPER
function renderMiniMatchCard(evt, label) {
  const comp = evt.competitions?.[0];
  const home = comp?.competitors?.find(c => c.homeAway === 'home');
  const away = comp?.competitors?.find(c => c.homeAway === 'away');

  const hLogo = typeof getTeamLogo === 'function' ? getTeamLogo(home?.team) : '';
  const aLogo = typeof getTeamLogo === 'function' ? getTeamLogo(away?.team) : '';

  const isPost = evt.status?.type?.state === 'post';
  const scoreText = isPost ? `${home?.score || 0} - ${away?.score || 0}` : new Date(evt.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return `
    <div onclick="openMatchDetail('${currentTeamData.leagueId}', '${evt.id}', '${evt.leagueName || 'Detail'}')" class="bg-[#180d30] border border-white/10 p-3 rounded-2xl space-y-2 cursor-pointer hover:border-emerald-500/50 transition">
      <div class="flex items-center justify-between text-[9px] font-bold text-slate-400">
        <span class="text-emerald-400">${label}</span>
        <span>${isPost ? 'FT' : 'VS'}</span>
      </div>
      <div class="flex items-center justify-between gap-1">
        <img src="${hLogo}" class="w-6 h-6 object-contain" alt="">
        <span class="font-extrabold text-xs text-white">${scoreText}</span>
        <img src="${aLogo}" class="w-6 h-6 object-contain" alt="">
      </div>
    </div>
  `;
}

// --- FIXTURES TAB ---
function renderFixturesTab() {
  const events = currentTeamData.events || [];
  if (events.length === 0) {
    return `<div class="text-center py-8 text-xs text-slate-400 bg-[#180d30] rounded-3xl border border-white/10">Belum ada jadwal pertandingan.</div>`;
  }

  const rowsHtml = events.map(evt => {
    const comp = evt.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');

    const hLogo = typeof getTeamLogo === 'function' ? getTeamLogo(home?.team) : '';
    const aLogo = typeof getTeamLogo === 'function' ? getTeamLogo(away?.team) : '';

    const isPost = evt.status?.type?.state === 'post';
    const dateStr = new Date(evt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    return `
      <div onclick="openMatchDetail('${currentTeamData.leagueId}', '${evt.id}', '${evt.leagueName || 'Match'}')" class="flex items-center justify-between bg-[#180d30] p-3 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition cursor-pointer text-xs">
        <div class="flex items-center gap-2 w-5/12 truncate">
          <img src="${hLogo}" class="w-4 h-4 object-contain shrink-0" alt="">
          <span class="truncate font-semibold text-slate-200">${home?.team?.shortDisplayName || home?.team?.displayName}</span>
        </div>
        
        <div class="text-center w-2/12 shrink-0">
          <span class="font-extrabold px-2 py-0.5 rounded-md bg-white/10 text-white text-[11px] border border-white/10">
            ${isPost ? `${home?.score || 0} - ${away?.score || 0}` : dateStr}
          </span>
        </div>

        <div class="flex items-center justify-end gap-2 w-5/12 truncate text-right">
          <span class="truncate font-semibold text-slate-200">${away?.team?.shortDisplayName || away?.team?.displayName}</span>
          <img src="${aLogo}" class="w-4 h-4 object-contain shrink-0" alt="">
        </div>
      </div>
    `;
  }).join('');

  return `<div class="space-y-2">${rowsHtml}</div>`;
}

// --- TABLE TAB ---
function renderTableTab() {
  return `
    <div id="team-modal-table-container" class="bg-[#180d30] border border-white/10 rounded-3xl p-4 shadow-xl">
      <div class="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
        <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-400"></i>
        <p class="text-xs font-semibold">Memuat klasemen liga tim...</p>
      </div>
    </div>
  `;
}

// --- SQUAD TAB ---
function renderSquadTab() {
  const roster = currentTeamData.roster || [];
  if (roster.length === 0) {
    return `<div class="text-center py-8 text-xs text-slate-400 bg-[#180d30] rounded-3xl border border-white/10">Data skuad pemain belum dirilis.</div>`;
  }

  const playerRows = roster.map(p => {
    const pName = p.displayName || p.fullName || 'Pemain';
    const jersey = p.jersey || '-';
    const pos = p.position?.abbreviation || 'DF';
    const photoUrl = `https://a.espncdn.com/i/headshots/soccer/players/full/${p.id}.png`;

    return `
      <div class="flex items-center justify-between bg-[#180d30] p-2.5 rounded-2xl border border-white/10 text-xs">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-full bg-slate-900 overflow-hidden border border-white/10 shrink-0">
            <img src="${photoUrl}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=22c55e&color=ffffff&bold=true&rounded=true'">
          </div>
          <div class="min-w-0">
            <div class="font-bold text-slate-200 truncate">${pName}</div>
            <div class="text-[9px] text-slate-400 font-semibold uppercase">${pos}</div>
          </div>
        </div>
        <span class="text-xs font-black text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">#${jersey}</span>
      </div>
    `;
  }).join('');

  return `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${playerRows}</div>`;
}
