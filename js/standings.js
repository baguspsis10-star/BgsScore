// STANDINGS & LEAGUE TABLES MODULE

// Render Collapsible Categorized League Accordion Grid
function renderCategorizedLeagueGrid(onSelectFunctionName) {
  const categories = [
    'Eropa',
    'Asia',
    'Amerika',
    'Piala/kompetisi',
    'Internasional'
  ];

  return categories.map(cat => {
    const catLeagues = LEAGUES.filter(l => l.category === cat);
    if (catLeagues.length === 0) return '';

    return `
      <details class="mb-2.5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group">
        <summary class="p-2.5 font-bold text-xs text-emerald-400 uppercase tracking-wider flex items-center justify-between cursor-pointer select-none bg-slate-900/90 hover:bg-slate-800 transition">
          <span class="flex items-center gap-2">
            <i class="fa-solid fa-layer-group text-[10px]"></i> ${cat} <span class="text-[10px] text-slate-400 font-normal">(${catLeagues.length})</span>
          </span>
          <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 group-open:rotate-180 transition-transform"></i>
        </summary>
        <div class="p-2 flex flex-col gap-1.5 bg-slate-950/50 border-t border-slate-800/80">
          ${catLeagues.map(l => `
            <button onclick="${onSelectFunctionName}('${l.id}')" class="p-2 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl flex items-center gap-2.5 text-left transition group/btn shadow-sm w-full">
              <img src="${generateUnlicensedLeagueBadge(l.id, l.name, l.country)}" loading="lazy" class="w-5 h-5 object-contain shrink-0 group-hover/btn:scale-105 transition-transform" alt="">
              <div class="flex-1 min-w-0 pr-1">
                <div class="text-xs font-bold text-white leading-snug whitespace-normal break-words">${l.flag ? l.flag + ' ' : ''}${l.name}</div>
                <div class="text-[9px] text-slate-400 leading-tight mt-0.5">${l.country}</div>
              </div>
              <i class="fa-solid fa-chevron-right text-[9px] text-slate-600 group-hover/btn:text-emerald-400 transition shrink-0"></i>
            </button>
          `).join('')}
        </div>
      </details>
    `;
  }).join('');
}

// Extract Points Value from Entry Object
function getPointsFromEntry(entry) {
  const stats = entry.stats || [];
  const ptStat = stats.find(s => s.name === 'points' || s.name === 'pts');
  return parseFloat(ptStat?.value ?? ptStat?.displayValue ?? 0);
}

// Fetch Standings Main Handler for Navigation
async function fetchStandingsForSelectedLeague() {
  const container = document.getElementById('standings-container');
  container.innerHTML = '';

  if (!selectedStandingsLeague) {
    container.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
          <h3 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-2">
            <i class="fa-solid fa-trophy"></i> Pilih Liga / League
          </h3>
        </div>
        ${renderCategorizedLeagueGrid('selectStandingsLeague')}
      </div>
    `;
    container.classList.remove('hidden');
    return;
  }

  const targetLeague = LEAGUES.find(l => l.id === selectedStandingsLeague) || LEAGUES[0];

  const backHeader = document.createElement('div');
  backHeader.className = 'space-y-3';
  backHeader.innerHTML = `
    <div class="flex items-center justify-between pb-2 border-b border-slate-800">
      <button onclick="selectStandingsLeague(null)" class="text-xs font-bold text-emerald-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition">
        <i class="fa-solid fa-arrow-left text-[10px]"></i> Pilih Liga Lain
      </button>
      <span class="text-xs font-bold text-white flex items-center gap-1.5">
        <img src="${generateUnlicensedLeagueBadge(targetLeague.id, targetLeague.name, targetLeague.country)}" class="w-4 h-4 object-contain"> ${targetLeague.flag ? targetLeague.flag + ' ' : ''}${targetLeague.name}
      </span>
    </div>

    <div class="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
      <button onclick="switchStandingsSubTab('table')" id="stab-table" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition ${selectedStandingsTab === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}">
        <i class="fa-solid fa-list-ol mr-1"></i> League
      </button>
      <button onclick="switchStandingsSubTab('matches')" id="stab-matches" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition ${selectedStandingsTab === 'matches' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}">
        <i class="fa-solid fa-calendar-days mr-1"></i> Match
      </button>
    </div>
  `;
  container.appendChild(backHeader);

  const subContainer = document.createElement('div');
  subContainer.id = 'standings-sub-content';
  container.appendChild(subContainer);

  if (selectedStandingsTab === 'table') {
    await renderLeagueStandingsTable(targetLeague, subContainer);
  } else {
    await renderLeagueMatchesList(targetLeague, subContainer);
  }

  container.classList.remove('hidden');
}

// Switch Standings Sub-Tab (Table / Matches)
function switchStandingsSubTab(tab) {
  selectedStandingsTab = tab;
  fetchStandingsForSelectedLeague();
}

// Select Specific Standings League
function selectStandingsLeague(leagueId) {
  selectedStandingsLeague = leagueId;
  selectedStandingsTab = 'table';
  loadData(false);
}

// Render Standings Table Component
async function renderLeagueStandingsTable(targetLeague, container, highlightTeamId = null) {
  const highlightIds = Array.isArray(highlightTeamId) 
    ? highlightTeamId.map(id => String(id)) 
    : (highlightTeamId ? [String(highlightTeamId)] : []);

  try {
    const res = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${targetLeague.id}/standings`);
    const data = await res.json();
    
    let groups = [];
    if (data?.children && data.children.length > 0) {
      groups = data.children.map(child => ({
        name: child.name || child.displayName || 'Grup',
        entries: child.standings?.entries || []
      }));
    } else if (data?.standings?.entries) {
      groups = [{
        name: targetLeague.name,
        entries: data.standings.entries
      }];
    }

    if (groups.length === 0 || groups.every(g => g.entries.length === 0)) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-500 border border-slate-800/50 rounded-2xl bg-slate-900/40">
          Tabel Klasemen untuk ${targetLeague.flag ? targetLeague.flag + ' ' : ''}${targetLeague.name} tidak tersedia saat ini.
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    groups.forEach(group => {
      const entries = [...group.entries];
      entries.sort((a, b) => getPointsFromEntry(b) - getPointsFromEntry(a));

      const card = document.createElement('div');
      card.className = 'bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-4';

      let tableRows = entries.map((entry, idx) => {
        const stats = entry.stats || [];
        const getStat = (names) => {
          for (let name of names) {
            const s = stats.find(st => st.name === name || st.abbreviation?.toLowerCase() === name.toLowerCase());
            if (s) return s.displayValue ?? s.value ?? '0';
          }
          return '0';
        };

        const m = getStat(['gamesPlayed', 'gp', 'm']);
        const w = getStat(['wins', 'w']);
        const d = getStat(['ties', 'draws', 'd']);
        const l = getStat(['losses', 'l']);
        const gf = getStat(['pointsFor', 'goalsFor', 'gf', 'f']);
        const ga = getStat(['pointsAgainst', 'goalsAgainst', 'ga', 'a']);
        const gd = getStat(['pointDifferential', 'goalDifference', 'gd', 'diff']);
        const pts = getStat(['points', 'pts']);

        const rawLogo = entry.team?.logos?.[0]?.href || getTeamLogo(entry.team);
        const teamLogo = dataSaverMode ? PLAIN_SHIELD_LOGO : rawLogo;
        const teamId = String(entry.team?.id);
        
        const isHome = highlightIds[0] && String(highlightIds[0]) === teamId;
        const isAway = highlightIds[1] && String(highlightIds[1]) === teamId;
        const isHighlighted = isHome || isAway;
        const isFav = isTeamFavorite(teamId);

        return `
          <tr class="border-b border-slate-800/50 hover:bg-slate-800/40 transition text-xs ${isHighlighted ? 'bg-emerald-950/80 font-bold border-l-4 border-emerald-500 text-emerald-300' : ''}">
            <td class="p-2 text-center font-bold ${idx < 2 ? 'text-emerald-400' : 'text-slate-400'}">${idx + 1}</td>
            <td class="p-2 flex items-center gap-2 font-semibold cursor-pointer min-w-[130px]" onclick="openTeamDetail('${targetLeague.id}', '${teamId}', '${(entry.team?.displayName||'').replace(/'/g, "\\'")}')">
              <img src="${teamLogo}" loading="lazy" class="w-4 h-4 object-contain shrink-0" alt="">
              <span class="truncate text-slate-200 hover:text-emerald-400 transition">${entry.team?.displayName || 'Klub'}</span>
              ${isFav ? '<i class="fa-solid fa-star text-amber-400 text-[9px]"></i>' : ''}
            </td>
            <td class="p-2 text-center text-slate-300">${m}</td>
            <td class="p-2 text-center text-emerald-400 font-medium">${w}</td>
            <td class="p-2 text-center text-amber-400 font-medium">${d}</td>
            <td class="p-2 text-center text-red-400 font-medium">${l}</td>
            <td class="p-2 text-center text-slate-400 font-mono text-[11px]">${gf}:${ga}</td>
            <td class="p-2 text-center font-medium ${parseInt(gd) > 0 ? 'text-emerald-400' : (parseInt(gd) < 0 ? 'text-red-400' : 'text-slate-400')}">${parseInt(gd) > 0 ? '+' + gd : gd}</td>
            <td class="p-2 text-center font-black text-white bg-slate-950/50">${pts}</td>
          </tr>
        `;
      }).join('');

      card.innerHTML = `
        <div class="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          <img src="${generateUnlicensedLeagueBadge(targetLeague.id, targetLeague.name, targetLeague.country)}" loading="lazy" class="w-4 h-4 object-contain" alt="">
          <h3 class="font-bold text-xs tracking-wide uppercase">${group.name}</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-[10px] text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <th class="p-2 text-center w-7">#</th>
                <th class="p-2">Klub</th>
                <th class="p-2 text-center" title="Main">M</th>
                <th class="p-2 text-center text-emerald-400" title="Menang">M</th>
                <th class="p-2 text-center text-amber-400" title="Seri">S</th>
                <th class="p-2 text-center text-red-400" title="Kalah">K</th>
                <th class="p-2 text-center" title="Gol Masuk:Kemasukan">GM:GK</th>
                <th class="p-2 text-center" title="Selisih Gol">SG</th>
                <th class="p-2 text-center font-bold text-emerald-400" title="Poin">PTS</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<p class="text-center text-slate-400 text-xs py-8">Tabel Klasemen tidak tersedia untuk kategori ini.</p>`;
  }
}

// Render Matches List in Standings View
async function renderLeagueMatchesList(targetLeague, container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-500"></i>
      <p class="text-xs">Memuat pertandingan ${targetLeague.name}...</p>
    </div>
  `;

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${targetLeague.id}/scoreboard`);
    const data = await res.json();
    const events = (data.events || []).map(evt => ({ 
      ...evt, 
      leagueName: targetLeague.name, 
      leagueId: targetLeague.id, 
      leagueLogo: targetLeague.logo,
      leagueFlag: targetLeague.flag 
    }));

    if (events.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-500 border border-slate-800/50 rounded-2xl bg-slate-900/40 text-xs">
          Tidak ada jadwal pertandingan untuk ${targetLeague.flag ? targetLeague.flag + ' ' : ''}${targetLeague.name}.
        </div>
      `;
      return;
    }

    const finished = sortEventsByFavoriteAndDate(events.filter(e => e.status.type.state === 'post'));
    const live = sortEventsByFavoriteAndDate(events.filter(e => e.status.type.state === 'in'));
    const upcoming = sortEventsByFavoriteAndDate(events.filter(e => e.status.type.state === 'pre'));

    container.innerHTML = '';

    if (live.length > 0) {
      const liveBox = document.createElement('div');
      liveBox.className = 'space-y-2';
      liveBox.innerHTML = `
        <div class="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Live Sekarang (${live.length})
        </div>
        <div id="league-live-grid" class="space-y-2"></div>
      `;
      container.appendChild(liveBox);
      renderMatchesCards('league-live-grid', live, false);
    }

    if (upcoming.length > 0) {
      const upcomingBox = document.createElement('div');
      upcomingBox.className = 'space-y-2';
      upcomingBox.innerHTML = `
        <div class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <i class="fa-regular fa-clock"></i> Pertandingan Mendatang (${upcoming.length})
        </div>
        <div id="league-upcoming-grid" class="space-y-2"></div>
      `;
      container.appendChild(upcomingBox);
      renderMatchesCards('league-upcoming-grid', upcoming, false);
    }

    if (finished.length > 0) {
      const finishedBox = document.createElement('div');
      finishedBox.className = 'space-y-2';
      finishedBox.innerHTML = `
        <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <i class="fa-solid fa-circle-check"></i> Pertandingan Selesai (${finished.length})
        </div>
        <div id="league-finished-grid" class="space-y-2"></div>
      `;
      container.appendChild(finishedBox);
      renderMatchesCards('league-finished-grid', finished, false);
    }

  } catch (err) {
    container.innerHTML = `<p class="text-center text-red-400 text-xs py-8">Gagal memuat pertandingan.</p>`;
  }
}
