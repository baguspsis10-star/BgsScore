// STANDINGS & LEAGUE TABLES MODULE (100% FULL-SCREEN NO HORIZONTAL SCROLL + LARGE LOGOS)

// Helper Resolusi Logo Liga (Prioritas Logo Asli -> Fallback Badge SVG)
function resolveLeagueLogoUrl(league) {
  if (!league) return generateUnlicensedLeagueBadge('generic', 'Liga', '');
  const fallback = generateUnlicensedLeagueBadge(league.id || 'generic', league.name || 'Liga', league.country || '');
  if (typeof dataSaverMode !== 'undefined' && dataSaverMode) return fallback;
  return league.logo || fallback;
}

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
      <details class="mb-2.5 bg-[#180d30] border border-white/10 rounded-2xl overflow-hidden group shadow-md">
        <summary class="p-3 font-extrabold text-xs text-emerald-400 uppercase tracking-wider flex items-center justify-between cursor-pointer select-none bg-[#180d30] hover:bg-[#231344] transition">
          <span class="flex items-center gap-2">
            <i class="fa-solid fa-layer-group text-[11px]"></i> ${cat} <span class="text-[10px] text-slate-400 font-semibold">(${catLeagues.length})</span>
          </span>
          <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 group-open:rotate-180 transition-transform"></i>
        </summary>
        <div class="p-2.5 flex flex-col gap-2 bg-[#0f0720]/70 border-t border-white/10">
          ${catLeagues.map(l => {
            const fallbackBadge = generateUnlicensedLeagueBadge(l.id, l.name, l.country);
            const logoSrc = resolveLeagueLogoUrl(l);
            return `
              <button onclick="${onSelectFunctionName}('${l.id}')" class="p-2.5 bg-[#180d30] hover:bg-[#231344] border border-white/10 hover:border-emerald-500/50 rounded-xl flex items-center gap-3 text-left transition group/btn shadow-sm w-full">
                <div class="w-9 h-9 rounded-xl bg-white/5 border border-white/10 p-1.5 flex items-center justify-center shrink-0">
                  <img src="${logoSrc}" loading="lazy" class="w-full h-full object-contain group-hover/btn:scale-110 transition-transform" alt="" onerror="this.onerror=null; this.src='${fallbackBadge}';">
                </div>
                <div class="flex-1 min-w-0 pr-1">
                  <div class="text-xs font-extrabold text-white leading-snug whitespace-normal break-words">${l.flag ? l.flag + ' ' : ''}${l.name}</div>
                  <div class="text-[10px] text-slate-400 leading-tight mt-0.5">${l.country}</div>
                </div>
                <i class="fa-solid fa-chevron-right text-[10px] text-slate-500 group-hover/btn:text-emerald-400 transition shrink-0"></i>
              </button>
            `;
          }).join('')}
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
        <div class="p-3.5 bg-[#180d30] border border-white/10 rounded-2xl text-center shadow-md">
          <h3 class="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-2">
            <i class="fa-solid fa-trophy"></i> Pilih Liga / Kompetisi
          </h3>
        </div>
        ${renderCategorizedLeagueGrid('selectStandingsLeague')}
      </div>
    `;
    container.classList.remove('hidden');
    return;
  }

  const targetLeague = LEAGUES.find(l => l.id === selectedStandingsLeague) || LEAGUES[0];
  const fallbackBadge = generateUnlicensedLeagueBadge(targetLeague.id, targetLeague.name, targetLeague.country);
  const leagueLogoSrc = resolveLeagueLogoUrl(targetLeague);

  const backHeader = document.createElement('div');
  backHeader.className = 'space-y-3';
  backHeader.innerHTML = `
    <div class="flex items-center justify-between gap-2 bg-[#180d30] p-2.5 rounded-2xl border border-white/10 shadow-md">
      <button onclick="selectStandingsLeague(null)" class="text-xs font-bold text-emerald-400 bg-[#0f0720] hover:bg-[#231344] border border-white/10 px-3 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0">
        <i class="fa-solid fa-arrow-left text-[10px]"></i> Daftar Liga
      </button>
      <div class="flex items-center gap-2.5 min-w-0 justify-end">
        <div class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0">
          <img src="${leagueLogoSrc}" class="w-full h-full object-contain" alt="" onerror="this.onerror=null; this.src='${fallbackBadge}';">
        </div>
        <div class="min-w-0 text-right">
          <div class="text-xs font-extrabold text-white truncate">${targetLeague.flag ? targetLeague.flag + ' ' : ''}${targetLeague.name}</div>
          <div class="text-[10px] text-slate-400 truncate">${targetLeague.country || ''}</div>
        </div>
      </div>
    </div>

    <!-- SUB TAB BAR -->
    <div class="flex bg-[#180d30] p-1.5 rounded-2xl border border-white/10 gap-1 overflow-x-auto no-scrollbar shadow-inner">
      <button onclick="switchStandingsSubTab('table')" id="stab-table" class="flex-1 py-2 px-2.5 text-[11px] rounded-xl transition whitespace-nowrap ${selectedStandingsTab === 'table' ? 'tab-pill-active' : 'tab-pill-inactive'}">
        <i class="fa-solid fa-list-ol mr-1"></i> Klasemen
      </button>
      <button onclick="switchStandingsSubTab('bracket')" id="stab-bracket" class="flex-1 py-2 px-2.5 text-[11px] rounded-xl transition whitespace-nowrap ${selectedStandingsTab === 'bracket' ? 'tab-pill-active' : 'tab-pill-inactive'}">
        <i class="fa-solid fa-sitemap mr-1"></i> Bagan
      </button>
      <button onclick="switchStandingsSubTab('stats')" id="stab-stats" class="flex-1 py-2 px-2.5 text-[11px] rounded-xl transition whitespace-nowrap ${selectedStandingsTab === 'stats' ? 'tab-pill-active' : 'tab-pill-inactive'}">
        <i class="fa-solid fa-chart-simple mr-1"></i> Top Stats
      </button>
      <button onclick="switchStandingsSubTab('matches')" id="stab-matches" class="flex-1 py-2 px-2.5 text-[11px] rounded-xl transition whitespace-nowrap ${selectedStandingsTab === 'matches' ? 'tab-pill-active' : 'tab-pill-inactive'}">
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
  } else if (selectedStandingsTab === 'bracket') {
    await renderLeagueBracket(targetLeague, subContainer);
  } else if (selectedStandingsTab === 'stats') {
    await renderLeagueLeaders(targetLeague, subContainer);
  } else {
    await renderLeagueMatchesList(targetLeague, subContainer);
  }

  container.classList.remove('hidden');
}

// Switch Standings Sub-Tab
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

// Helper Render Mini Form Pills (M / S / K) di Bawah Nama Klub
function renderMiniFormDots(formVal) {
  if (!formVal) return '';
  const items = Array.isArray(formVal)
    ? formVal
    : String(formVal).toUpperCase().replace(/[^WDLMSK]/g, '').split('');

  if (items.length === 0) return '';

  return `
    <div class="inline-flex items-center gap-0.5">
      ${items.slice(-5).map(ch => {
        const c = String(ch).toUpperCase();
        if (c === 'W' || c === 'M') {
          return `<span class="w-3 h-3 rounded-[3px] bg-emerald-500/25 text-emerald-400 text-[7px] font-black flex items-center justify-center">M</span>`;
        }
        if (c === 'D' || c === 'S') {
          return `<span class="w-3 h-3 rounded-[3px] bg-amber-500/25 text-amber-400 text-[7px] font-black flex items-center justify-center">S</span>`;
        }
        if (c === 'L' || c === 'K') {
          return `<span class="w-3 h-3 rounded-[3px] bg-red-500/25 text-red-400 text-[7px] font-black flex items-center justify-center">K</span>`;
        }
        return '';
      }).join('')}
    </div>
  `;
}

// Render Standings Table Component (100% Full-Fit Tanpa Scroll Samping + Logo Besar)
async function renderLeagueStandingsTable(targetLeague, container, highlightTeamId = null) {
  const highlightIds = Array.isArray(highlightTeamId) 
    ? highlightTeamId.map(id => String(id)) 
    : (highlightTeamId ? [String(highlightTeamId)] : []);

  try {
    let groups = [];
    let data = {};

    const isLiga1 = ['idn.1', 'indonesia.1', 'liga1'].includes(targetLeague.id);
    const isLiga2 = isLiga2LeagueId(targetLeague.id);

    if (isLiga1) {
      const liga1Rows = await fetchLiga1Standings();

      groups = [{
        name: 'BRI Liga 1 Indonesia',
        entries: liga1Rows.map(row => ({
          position: row.position,
          team: {
            id: `liga1-${normalizeLiga1TeamName(row.team).replace(/\s+/g, '-')}`,
            displayName: row.team,
            shortDisplayName: row.team,
            logo: getLiga1TeamLogo(row.team, row.teamLogo)
          },
          stats: [
            { name: 'gamesPlayed', value: row.played },
            { name: 'wins', value: row.won },
            { name: 'ties', value: row.drawn },
            { name: 'losses', value: row.lost },
            { name: 'goalsFor', value: row.goalsFor },
            { name: 'goalsAgainst', value: row.goalsAgainst },
            { name: 'goalDifference', value: row.goalDifference },
            { name: 'points', value: row.points }
          ],
          form: row.form
        }))
      }];
    } else if (isLiga2) {
      groups = await fetchLiga2Standings();
    } else {
      const res = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${targetLeague.id}/standings`);
      if (!res.ok) throw new Error(`Standings HTTP ${res.status}`);
      data = await res.json();

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
    }

    if (groups.length === 0 || groups.every(g => g.entries.length === 0)) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-400 border border-white/10 rounded-2xl bg-[#180d30] text-xs shadow-md">
          Tabel Klasemen untuk ${targetLeague.flag ? targetLeague.flag + ' ' : ''}${targetLeague.name} tidak tersedia saat ini.
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    const fallbackLeagueBadge = generateUnlicensedLeagueBadge(targetLeague.id, targetLeague.name, targetLeague.country);
    const headerLeagueLogo = resolveLeagueLogoUrl(targetLeague);

    // Grid proporsional 100% lebar layar:
    // [# (22px)] [Klub + Logo (1fr)] [MP] [M] [S] [K] [GM:GK] [SG] [PTS]
    const gridColsClass = 'grid-cols-[22px_minmax(0,1fr)_20px_18px_18px_18px_34px_24px_30px] sm:grid-cols-[28px_minmax(0,1fr)_28px_24px_24px_24px_46px_32px_38px]';

    groups.forEach(group => {
      const entries = [...group.entries];
      entries.sort((a, b) => {
        if (a.position && b.position) {
          return Number(a.position) - Number(b.position);
        }
        return getPointsFromEntry(b) - getPointsFromEntry(a);
      });

      const totalTeams = entries.length;

      const card = document.createElement('div');
      card.className = 'bg-[#180d30] border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-4 w-full';

      const rowsHtml = entries.map((entry, idx) => {
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

        const rawLogo = entry.team?.logos?.[0]?.href || getTeamLogo(entry.team) || PLAIN_SHIELD_LOGO;
        const teamLogo = dataSaverMode ? PLAIN_SHIELD_LOGO : rawLogo;
        const teamId = String(entry.team?.id);
        const displayPosition = Number(entry.position) || idx + 1;
        
        const isHome = highlightIds[0] && String(highlightIds[0]) === teamId;
        const isAway = highlightIds[1] && String(highlightIds[1]) === teamId;
        const isHighlighted = isHome || isAway;
        const isFav = isTeamFavorite(teamId);

        const isTop1 = displayPosition === 1;
        const isTop4 = displayPosition >= 2 && displayPosition <= 4;
        const isRelegation = totalTeams >= 8 && displayPosition > totalTeams - 3;

        let rankBadgeClass = 'bg-white/5 text-slate-300 border border-white/10';
        let rowAccentBorder = 'border-l-2 border-l-transparent';

        if (isTop1) {
          rankBadgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-400/50';
          rowAccentBorder = 'border-l-[3px] border-l-amber-400';
        } else if (isTop4) {
          rankBadgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40';
          rowAccentBorder = 'border-l-[3px] border-l-emerald-400';
        } else if (isRelegation) {
          rankBadgeClass = 'bg-red-500/20 text-red-300 border border-red-400/40';
          rowAccentBorder = 'border-l-[3px] border-l-red-500';
        }

        const gdNum = parseInt(gd) || 0;
        const gdFormatted = gdNum > 0 ? `+${gdNum}` : `${gdNum}`;
        const gdColor = gdNum > 0 ? 'text-emerald-400' : (gdNum < 0 ? 'text-red-400' : 'text-slate-400');
        const miniForm = renderMiniFormDots(entry.form);

        return `
          <div onclick="openTeamDetail('${targetLeague.id}', '${teamId}', '${(entry.team?.displayName||'').replace(/'/g, "\\'")}')" class="grid ${gridColsClass} items-center gap-0.5 px-2 py-2 border-b border-white/5 last:border-b-0 hover:bg-[#231344] active:bg-[#2a1752] transition cursor-pointer ${isHighlighted ? 'bg-emerald-950/80' : ''} ${rowAccentBorder}">
            
            <!-- Peringkat -->
            <div class="flex items-center justify-center">
              <span class="w-5 h-5 sm:w-6 sm:h-6 rounded-md text-[10px] sm:text-[11px] font-black flex items-center justify-center ${rankBadgeClass}">
                ${displayPosition}
              </span>
            </div>

            <!-- Logo Besar & Nama Klub -->
            <div class="flex items-center gap-2 min-w-0 pr-1 pl-0.5">
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 border border-white/15 p-1 flex items-center justify-center shrink-0 shadow-sm">
                <img src="${teamLogo}" loading="lazy" class="w-full h-full object-contain" alt="" onerror="this.onerror=null; this.src='${PLAIN_SHIELD_LOGO}';">
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1">
                  <span class="truncate text-white text-[11px] sm:text-xs font-extrabold leading-tight">${entry.team?.shortDisplayName || entry.team?.displayName || 'Klub'}</span>
                  ${isFav ? '<i class="fa-solid fa-star text-amber-400 text-[8px] shrink-0"></i>' : ''}
                </div>
                ${miniForm ? `<div class="mt-0.5 leading-none">${miniForm}</div>` : ''}
              </div>
            </div>

            <!-- MP -->
            <div class="text-center text-[10px] sm:text-[11px] text-slate-300 font-semibold">${m}</div>

            <!-- M (Menang) -->
            <div class="text-center text-[10px] sm:text-[11px] text-emerald-400 font-bold">${w}</div>

            <!-- S (Seri) -->
            <div class="text-center text-[10px] sm:text-[11px] text-amber-400 font-bold">${d}</div>

            <!-- K (Kalah) -->
            <div class="text-center text-[10px] sm:text-[11px] text-red-400 font-bold">${l}</div>

            <!-- GM:GK -->
            <div class="text-center text-[9.5px] sm:text-[10.5px] text-slate-300 font-mono tracking-tighter">${gf}:${ga}</div>

            <!-- SG -->
            <div class="text-center text-[10px] sm:text-[11px] font-bold ${gdColor}">${gdFormatted}</div>

            <!-- PTS -->
            <div class="flex items-center justify-center">
              <span class="w-full py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-center font-black text-emerald-300 text-[10.5px] sm:text-xs">
                ${pts}
              </span>
            </div>
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <!-- Header Card Klasemen -->
        <div class="p-3 border-b border-white/10 bg-gradient-to-r from-[#261245] to-[#180d30] flex items-center justify-between gap-2.5">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-white/10 border border-white/15 p-1.5 flex items-center justify-center shrink-0 shadow-md">
              <img src="${headerLeagueLogo}" loading="lazy" class="w-full h-full object-contain" alt="" onerror="this.onerror=null; this.src='${fallbackLeagueBadge}';">
            </div>
            <div class="min-w-0">
              <h3 class="font-black text-xs sm:text-sm tracking-wide uppercase truncate text-white">${group.name}</h3>
              <span class="text-[10px] text-slate-400 font-medium block truncate">${totalTeams} Klub • Ketuk klub untuk skuad</span>
            </div>
          </div>
          <span class="text-[10px] bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full font-bold shrink-0">
            ${targetLeague.flag || '🏆'} Tabel
          </span>
        </div>

        <!-- Column Headers (100% Fit) -->
        <div class="grid ${gridColsClass} items-center gap-0.5 px-2 py-2 bg-[#0f0720] border-b border-white/10 text-[9px] sm:text-[10px] text-slate-400 uppercase font-extrabold">
          <div class="text-center">#</div>
          <div class="pl-1">Klub</div>
          <div class="text-center" title="Main">MP</div>
          <div class="text-center text-emerald-400" title="Menang">M</div>
          <div class="text-center text-amber-400" title="Seri">S</div>
          <div class="text-center text-red-400" title="Kalah">K</div>
          <div class="text-center" title="Gol Masuk:Kemasukan">GM:GK</div>
          <div class="text-center" title="Selisih Gol">SG</div>
          <div class="text-center text-emerald-400" title="Poin">PTS</div>
        </div>

        <!-- Rows -->
        <div class="divide-y divide-white/5">
          ${rowsHtml}
        </div>

        <!-- Legend Zona -->
        <div class="px-3 py-2 bg-[#0f0720]/90 border-t border-white/10 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[9.5px] text-slate-400">
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-amber-400"></span> Puncak</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-emerald-400"></span> Papan Atas</span>
          ${totalTeams >= 8 ? '<span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-red-500"></span> Zona Bawah</span>' : ''}
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<p class="text-center text-slate-400 text-xs py-8">Tabel Klasemen tidak tersedia untuk kategori ini.</p>`;
  }
}

// Render Tournament Knockout Bracket (Bagan Babak Gugur)
async function renderLeagueBracket(targetLeague, container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-400"></i>
      <p class="text-xs font-semibold">Memuat bagan babak gugur...</p>
    </div>
  `;

  try {
    const pureLeagueIds = ['eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'ned.1', 'por.1', 'idn.1', 'ksa.1'];
    if (pureLeagueIds.includes(targetLeague.id)) {
      container.innerHTML = `
        <div class="bg-[#180d30] border border-white/10 rounded-2xl p-6 text-center space-y-2 shadow-xl">
          <i class="fa-solid fa-trophy text-3xl text-amber-400 mb-1 block"></i>
          <h4 class="text-xs font-bold text-white uppercase tracking-wider">Format Liga Poin Penuh</h4>
          <p class="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            ${targetLeague.name} menggunakan sistem kompetisi penuh berdasarkan akumulasi poin, bukan sistem gugur (bracket). Silakan cek tab <strong class="text-emerald-400">Klasemen</strong> untuk klasemen resmi.
          </p>
        </div>
      `;
      return;
    }

    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${targetLeague.id}/scoreboard?limit=100`);
    const data = await res.json();
    const events = data.events || [];

    if (events.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 text-slate-400 bg-[#180d30] border border-white/10 rounded-2xl text-xs">
          Data babak gugur tidak ditemukan untuk turnamen ini.
        </div>
      `;
      return;
    }

    const roundGroups = {};
    const defaultRoundOrder = ['16 Besar', 'Perempat Final', 'Semifinal', 'Final'];

    events.forEach(evt => {
      const comp = evt.competitions?.[0];
      let roundName = 'Babak Gugur';

      const noteText = comp?.notes?.[0]?.headline || evt.status?.type?.description || '';
      const typeText = comp?.type?.text || '';

      if (noteText.toLowerCase().includes('final') && !noteText.toLowerCase().includes('semi')) roundName = 'Final';
      else if (noteText.toLowerCase().includes('semi')) roundName = 'Semifinal';
      else if (noteText.toLowerCase().includes('quarter') || noteText.toLowerCase().includes('perempat')) roundName = 'Perempat Final';
      else if (noteText.toLowerCase().includes('16') || noteText.toLowerCase().includes('round of 16')) roundName = '16 Besar';
      else if (typeText.includes('Final')) roundName = 'Final';
      else if (noteText) roundName = noteText;

      if (!roundGroups[roundName]) roundGroups[roundName] = [];
      roundGroups[roundName].push(evt);
    });

    const roundKeys = Object.keys(roundGroups);
    roundKeys.sort((a, b) => {
      const idxA = defaultRoundOrder.indexOf(a);
      const idxB = defaultRoundOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    let bracketHtml = `
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1 text-[10px] text-slate-400">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-sitemap text-emerald-400"></i> Bagan Babak Gugur</span>
          <span class="text-slate-500">Geser ke kanan <i class="fa-solid fa-arrow-right text-[9px]"></i></span>
        </div>
        <div class="bracket-wrapper no-scrollbar bg-[#180d30] border border-white/10 rounded-2xl">
    `;

    roundKeys.forEach(rKey => {
      const matches = roundGroups[rKey];

      bracketHtml += `
        <div class="bracket-round">
          <div class="bracket-round-title">${rKey}</div>
          <div class="space-y-3 flex-1 flex flex-col justify-around">
      `;

      matches.forEach(evt => {
        const comp = evt.competitions?.[0];
        const home = comp?.competitors?.find(c => c.homeAway === 'home');
        const away = comp?.competitors?.find(c => c.homeAway === 'away');
        const isPre = evt.status?.type?.state === 'pre';

        const homeScore = parseInt(home?.score || '0');
        const awayScore = parseInt(away?.score || '0');

        const homeWinner = home?.winner || (!isPre && homeScore > awayScore);
        const awayWinner = away?.winner || (!isPre && awayScore > homeScore);

        bracketHtml += `
          <div class="bracket-match" onclick="openMatchDetail('${targetLeague.id}', '${evt.id}', '${(targetLeague.name||'').replace(/'/g, "\\'")}')">
            <div class="text-[9px] text-slate-400 mb-1 flex items-center justify-between border-b border-white/5 pb-1">
              <span>${formatLocalDate(evt.date).split('•')[0]}</span>
              <span class="${evt.status?.type?.state === 'in' ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400'}">${evt.status?.type?.shortDetail || 'SCHEDULED'}</span>
            </div>
            
            <div class="bracket-team ${homeWinner ? 'winner text-emerald-400' : 'text-slate-300'}">
              <div class="flex items-center gap-1.5 truncate max-w-[80%]">
                <img src="${getTeamLogo(home?.team) || PLAIN_SHIELD_LOGO}" class="w-4 h-4 object-contain shrink-0" onerror="this.src='${PLAIN_SHIELD_LOGO}'">
                <span class="truncate">${home?.team?.shortDisplayName || home?.team?.displayName || 'TBD'}</span>
              </div>
              <span class="font-black">${isPre ? '-' : homeScore}</span>
            </div>

            <div class="bracket-team ${awayWinner ? 'winner text-emerald-400' : 'text-slate-300'} mt-0.5">
              <div class="flex items-center gap-1.5 truncate max-w-[80%]">
                <img src="${getTeamLogo(away?.team) || PLAIN_SHIELD_LOGO}" class="w-4 h-4 object-contain shrink-0" onerror="this.src='${PLAIN_SHIELD_LOGO}'">
                <span class="truncate">${away?.team?.shortDisplayName || away?.team?.displayName || 'TBD'}</span>
              </div>
              <span class="font-black">${isPre ? '-' : awayScore}</span>
            </div>
          </div>
        `;
      });

      bracketHtml += `
          </div>
        </div>
      `;
    });

    bracketHtml += `
        </div>
      </div>
    `;

    container.innerHTML = bracketHtml;

  } catch (err) {
    container.innerHTML = `<div class="text-center py-10 text-slate-400 text-xs">Gagal memuat bagan babak gugur.</div>`;
  }
}

// Render Top Scorers & Top Assists (League Leaders)
async function renderLeagueLeaders(targetLeague, container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-500"></i>
      <p class="text-xs font-semibold">Memuat statistik Top Skorer & Assist...</p>
    </div>
  `;

  try {
    if (isLiga2LeagueId(targetLeague.id)) {
      renderLiga2TopScorers(container, await fetchLiga2TopScorers());
      return;
    }

    if (isLiga1LeagueId(targetLeague.id)) {
      renderLiga1TopScorers(container, await fetchLiga1TopScorers());
      return;
    }

    let data = null;
    const endpoints = [
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${targetLeague.id}/leaders`,
      `https://site.api.espn.com/apis/v2/sports/soccer/${targetLeague.id}/leaders`
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json && (json.leaders || json.categories || json.sports?.[0]?.leagues?.[0]?.leaders)) {
            data = json;
            break;
          }
        }
      } catch (e) {}
    }

    if (!data) {
      throw new Error("API leaders tidak merespon");
    }

    let categories = data.leaders || data.categories || data.sports?.[0]?.leagues?.[0]?.leaders || [];

    if (!Array.isArray(categories) && typeof categories === 'object') {
      categories = Object.values(categories);
    }

    if (!categories || categories.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 text-slate-400 bg-[#180d30] border border-white/10 rounded-2xl text-xs space-y-1">
          <i class="fa-solid fa-chart-bar text-2xl text-slate-500 block mb-2"></i>
          <p class="font-bold text-slate-200">Statistik Belum Tersedia</p>
          <p class="text-[10px] text-slate-400">Data statistik pemain belum dirilis untuk liga ini.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    categories.forEach(cat => {
      const catName = cat.displayName || cat.name || cat.header || 'Statistik';
      const leaders = cat.leaders || cat.athletes || cat.entries || [];
      if (!leaders || leaders.length === 0) return;

      const card = document.createElement('div');
      card.className = 'bg-[#180d30] border border-white/10 rounded-2xl p-3.5 mb-3.5 shadow-xl space-y-2';

      let rowsHtml = leaders.slice(0, 10).map((item, idx) => {
        const athlete = item.athlete || item.player || item;
        const team = item.team || athlete.team || {};
        const pName = athlete.displayName || athlete.fullName || athlete.shortName || 'Pemain';
        const pId = athlete.id || '';
        const value = item.displayValue || item.value || item.statValue || '0';
        const teamLogo = team.logo || (team.id ? `https://a.espncdn.com/i/teamlogos/soccer/500/${team.id}.png` : PLAIN_SHIELD_LOGO);

        return `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition text-xs border-b border-white/5 last:border-b-0">
            <div class="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <span class="font-black text-xs w-4 text-center ${idx === 0 ? 'text-amber-400' : (idx === 1 ? 'text-slate-300' : (idx === 2 ? 'text-amber-600' : 'text-slate-500'))}">${idx + 1}</span>
              <div class="w-9 h-9 rounded-full bg-[#0f0720] overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                <img src="${PLAIN_PERSON_HEADSHOT}" loading="lazy" class="w-full h-full object-cover" onload="loadMultiTierPlayerPhoto(this, '${pId}', '${pName.replace(/'/g, "\\'")}')" onerror="handlePlayerImgError(this, '${pName.replace(/'/g, "\\'")}')">
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-white truncate leading-tight">${pName}</div>
                <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                  <img src="${teamLogo}" class="w-3.5 h-3.5 object-contain shrink-0" onerror="this.src='${PLAIN_SHIELD_LOGO}'">
                  <span class="truncate">${team.displayName || team.shortDisplayName || team.name || 'Klub'}</span>
                </div>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-black text-xs">${value}</span>
            </div>
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 class="font-black text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <i class="fa-solid ${catName.toLowerCase().includes('goal') || catName.toLowerCase().includes('skorer') || catName.toLowerCase().includes('point') ? 'fa-futbol' : 'fa-shoe-prints'}"></i>
            ${catName}
          </h3>
        </div>
        <div class="space-y-0.5">${rowsHtml}</div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-10 text-slate-400 bg-[#180d30] border border-white/10 rounded-2xl text-xs space-y-1">
        <i class="fa-solid fa-circle-exclamation text-2xl text-amber-500 block mb-2"></i>
        <p class="font-bold text-slate-200">Data Stats Tidak Tersedia</p>
        <p class="text-[10px] text-slate-400">Statistik individu belum didukung oleh server API untuk liga ini.</p>
      </div>
    `;
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
    const isLiga1 = [
      'idn.1',
      'indonesia.1',
      'liga1'
    ].includes(targetLeague.id);
    const isLiga2 = isLiga2LeagueId(targetLeague.id);

    let events = [];

    if (isLiga1) {
      const liga1Events = await fetchLigaIndonesiaData();

      events = liga1Events
        .filter(evt => evt.status?.type?.state === 'pre')
        .map(evt => ({
          ...evt,
          leagueName: 'BRI Liga 1 Indonesia',
          leagueId: 'idn.1',
          leagueLogo: targetLeague.logo,
          leagueFlag: '🇮🇩'
        }));
    } else if (isLiga2) {
      events = await fetchLiga2EventsForDate();
    } else {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${targetLeague.id}/scoreboard`
      );

      if (!res.ok) {
        throw new Error(`Match list HTTP ${res.status}`);
      }

      const data = await res.json();

      events = (data.events || []).map(evt => ({
        ...evt,
        leagueName: targetLeague.name,
        leagueId: targetLeague.id,
        leagueLogo: targetLeague.logo,
        leagueFlag: targetLeague.flag
      }));
    }

    if (events.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-400 border border-white/10 rounded-2xl bg-[#180d30] text-xs">
          Tidak ada pertandingan mendatang untuk ${targetLeague.flag ? targetLeague.flag + ' ' : ''}${targetLeague.name}.
        </div>
      `;
      return;
    }

    cachedEvents = events;
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
