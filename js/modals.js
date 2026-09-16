// MODALS & DIALOG CONTROLLER MODULE (ENHANCED DARK PURPLE NEON THEME)

let globalModalZIndex = 50;

function getNextZIndex() {
  globalModalZIndex += 2;
  return globalModalZIndex;
}

function checkResetZIndex() {
  const detailHidden = document.getElementById('detail-modal')?.classList.contains('hidden');
  const teamHidden = document.getElementById('team-detail-modal')?.classList.contains('hidden');
  const leagueHidden = document.getElementById('league-modal')?.classList.contains('hidden');
  const settingsHidden = document.getElementById('settings-modal')?.classList.contains('hidden');
  if (detailHidden && teamHidden && leagueHidden && settingsHidden) {
    globalModalZIndex = 50;
  }
}

let globalAudioCtx = null;

function getAudioContext() {
  if (!globalAudioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) globalAudioCtx = new AudioCtxClass();
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
}

function openSettingsModal() {
  document.getElementById('snd-master').checked = soundSettings.master;
  document.getElementById('snd-goal').checked = soundSettings.goal;
  document.getElementById('snd-lineup').checked = soundSettings.lineup ?? true;
  document.getElementById('snd-kickoff1').checked = soundSettings.kickoff1;
  document.getElementById('snd-halftime').checked = soundSettings.halftime;
  document.getElementById('snd-kickoff2').checked = soundSettings.kickoff2;
  document.getElementById('snd-fulltime').checked = soundSettings.fulltime;
  document.getElementById('snd-corner').checked = soundSettings.corner;
  document.getElementById('snd-yellow').checked = soundSettings.yellow;
  document.getElementById('snd-red').checked = soundSettings.red;

  updateNotifPermissionUI();
  const modal = document.getElementById('settings-modal');
  modal.style.zIndex = getNextZIndex();
  modal.classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
  checkResetZIndex();
}

function updateSoundSetting(key, val) {
  soundSettings[key] = val;
  localStorage.setItem('bgs_sound_settings', JSON.stringify(soundSettings));
}

function updateNotifPermissionUI() {
  const statusLabel = document.getElementById('notif-permission-status');
  const btn = document.getElementById('btn-request-notif');

  if (!('Notification' in window)) {
    statusLabel.innerText = 'Browser tidak mendukung push notification.';
    btn.classList.add('hidden');
    return;
  }

  if (Notification.permission === 'granted') {
    statusLabel.innerText = 'Izin Notifikasi Aktif';
    btn.innerText = 'Aktif';
    btn.className = 'px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold cursor-default';
    btn.disabled = true;
  } else if (Notification.permission === 'denied') {
    statusLabel.innerText = 'Izin ditolak di pengaturan browser/HP';
    btn.innerText = 'Ditolak';
    btn.className = 'px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold cursor-default';
    btn.disabled = true;
  } else {
    statusLabel.innerText = 'Izin belum diberikan';
    btn.innerText = 'Aktifkan';
    btn.className = 'px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition';
    btn.disabled = false;
  }
}

function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(() => {
      updateNotifPermissionUI();
    });
  }
}

function sendPushNotification(title, body) {
  if (!soundSettings.master) return;
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        icon: 'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png'
      });
    } catch (e) {
      console.error("Gagal mengirim push notification:", e);
    }
  }
}

function playWhistlePattern(pattern) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    let startTime = ctx.currentTime;

    pattern.forEach((dur) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine'; osc2.type = 'sine';
      osc1.frequency.setValueAtTime(2600, startTime);
      osc2.frequency.setValueAtTime(2625, startTime);

      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
      gain.gain.setValueAtTime(0.25, startTime + dur - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc1.connect(gain); osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(startTime); osc2.start(startTime);
      osc1.stop(startTime + dur); osc2.stop(startTime + dur);

      startTime += dur + 0.15;
    });
  } catch(e) { console.error(e); }
}

function playEventSound(type) {
  if (!soundSettings.master || !soundSettings[type]) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'goal') {
      const bufferSize = ctx.sampleRate * 3.0; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);

      noise.connect(filter); filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(); noise.stop(ctx.currentTime + 3.0);

    } else if (type === 'kickoff1' || type === 'kickoff2') {
      playWhistlePattern([0.4]);
    } else if (type === 'halftime') {
      playWhistlePattern([0.3, 0.8]);
    } else if (type === 'fulltime') {
      playWhistlePattern([0.3, 0.3, 1.0]);
    } else if (type === 'corner') {
      playWhistlePattern([0.25]);
    } else if (type === 'yellow') {
      playWhistlePattern([0.2]);
    } else if (type === 'red') {
      playWhistlePattern([0.2, 0.4]);
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function openLeagueModal() {
  renderLeagueModalGrid();
  const modal = document.getElementById('league-modal');
  modal.style.zIndex = getNextZIndex();
  modal.classList.remove('hidden');
}

function closeLeagueModal() {
  document.getElementById('league-modal').classList.add('hidden');
  checkResetZIndex();
}

function renderLeagueModalGrid() {
  const grid = document.getElementById('league-selector-grid');
  grid.innerHTML = `
    <button onclick="selectLeagueFromModal('all')" class="w-full p-2.5 bg-[#180d30] hover:bg-[#231344] border ${selectedLeague === 'all' ? 'border-emerald-500 bg-emerald-950/40' : 'border-white/10'} rounded-xl flex items-center gap-2.5 transition text-left mb-2 shadow-sm">
      <i class="fa-solid fa-globe text-emerald-400 text-base"></i>
      <div>
        <div class="text-xs font-bold text-white">Semua Liga</div>
        <div class="text-[9px] text-slate-400">Tampilkan seluruh pertandingan global</div>
      </div>
    </button>
    ${renderCategorizedLeagueGrid('selectLeagueFromModal')}
  `;
}

function selectLeagueFromModal(leagueId) {
  closeLeagueModal();
  changeLeague(leagueId);
}

async function openMatchDetail(leagueId, eventId, leagueName, isSilent = false) {
  currentOpenModal = { leagueId, eventId, leagueName };
  const modal = document.getElementById('detail-modal');
  const loading = document.getElementById('modal-loading');
  const container = document.getElementById('modal-data-container');
  const flag = typeof getLeagueFlag === 'function' ? getLeagueFlag(leagueId) : '⚽';
  
  if (!isSilent && typeof closeTeamModal === 'function') {
    closeTeamModal();
  }

  modal.style.zIndex = getNextZIndex();
  document.getElementById('modal-league-name').innerText = `${flag ? flag + ' ' : ''}${leagueName}`;

  modal.classList.remove('hidden');

  if (!isSilent) {
    loading.classList.remove('hidden');
    container.classList.add('hidden');
    switchModalTab('summary');
  }

  try {
    const cachedEvt = (typeof cachedEvents !== 'undefined' && Array.isArray(cachedEvents)) 
      ? cachedEvents.find(e => String(e.id) === String(eventId)) 
      : null;

    const candidateLeagues = Array.from(new Set([
      leagueId,
      cachedEvt?.leagueId,
      cachedEvt?.league?.slug,
      cachedEvt?.season?.slug,
      'esp.1', 'eng.1', 'ita.1', 'ger.1', 'fra.1', 'usa.1', 'idn.1', 'fifa.friendly', 'club.friendly'
    ].filter(l => l && l !== 'all')));

    let data = null;

    for (const slug of candidateLeagues) {
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary?event=${eventId}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.header && json.header.competitions) {
            data = json;
            break;
          }
        }
      } catch (e) {}
    }

    if (!data || !data.header || !data.header.competitions) {
      throw new Error("Detail pertandingan tidak ditemukan pada API ESPN.");
    }

    const realLeagueSlug = data.header?.league?.slug || 
                           data.leagues?.[0]?.slug || 
                           data.header?.competitions?.[0]?.league?.slug || 
                           cachedEvt?.leagueId || 
                           leagueId;

    const realLeagueName = data.header?.league?.name || 
                           data.leagues?.[0]?.name || 
                           data.header?.competitions?.[0]?.league?.name || 
                           leagueName;

    document.getElementById('modal-league-name').innerText = `${realLeagueName}`;

    const header = data.header?.competitions?.[0];
    const home = header?.competitors?.find(c => c.homeAway === 'home');
    const away = header?.competitors?.find(c => c.homeAway === 'away');

    renderModalCompleteData(data, realLeagueSlug);

    if (!isSilent) {
      if (realLeagueSlug && home?.team?.id && away?.team?.id) {
        fetchModalStandings(realLeagueSlug, home.team.id, away.team.id);
        fetchFormAndH2H(realLeagueSlug, home.team.id, away.team.id, home.team.displayName, away.team.displayName, data.headToHead || data.h2h || []);
      } else {
        document.getElementById('mcontent-standings').innerHTML = `<p class="text-center text-slate-400 text-xs py-6">Klasemen tidak tersedia.</p>`;
        document.getElementById('mcontent-h2h').innerHTML = `<p class="text-center text-slate-400 text-xs py-6">Data riwayat tidak tersedia.</p>`;
      }
    }

    loading.classList.add('hidden');
    container.classList.remove('hidden');
  } catch (err) {
    console.error("Detail Fetch Error:", err);
    if (!isSilent) {
      document.getElementById('modal-data-container').innerHTML = `
        <div class="text-center py-12 text-slate-400 space-y-2">
          <i class="fa-solid fa-circle-exclamation text-2xl text-amber-400"></i>
          <p class="text-xs">Rincian pertandingan belum tersedia di server ESPN.</p>
        </div>
      `;
      loading.classList.add('hidden');
      container.classList.remove('hidden');
    }
  }
}

async function fetchModalStandings(leagueId, homeTeamId, awayTeamId) {
  const container = document.getElementById('mcontent-standings');
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-400"></i>
      <p class="text-xs font-semibold">Memuat klasemen liga...</p>
    </div>
  `;

  try {
    const targetLeague = LEAGUES.find(l => l.id === leagueId) || { id: leagueId, name: 'Klasemen' };
    container.innerHTML = '';
    await renderLeagueStandingsTable(targetLeague, container, [homeTeamId, awayTeamId]);
  } catch (err) {
    container.innerHTML = `<p class="text-center text-slate-400 text-xs py-6">Klasemen tidak tersedia.</p>`;
  }
}

function renderFormBlock(teamName, matches, teamId) {
  if (!matches || matches.length === 0) {
    return `
      <div class="bg-[#180d30] p-3.5 rounded-2xl border border-white/10 shadow-sm">
        <div class="text-xs font-bold text-white mb-1">${teamName}</div>
        <p class="text-[10px] text-slate-400">Tidak ada riwayat pertandingan terbaru.</p>
      </div>
    `;
  }

  let formBadges = '';
  let matchRows = matches.map(m => {
    const comp = m.competitions?.[0];
    const myTeam = comp?.competitors?.find(c => String(c.team.id) === String(teamId));
    const oppTeam = comp?.competitors?.find(c => String(c.team.id) !== String(teamId));
    
    const myScore = parseInt(myTeam?.score || '0');
    const oppScore = parseInt(oppTeam?.score || '0');

    let resBadge = { label: 'S', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (myScore > oppScore) {
      resBadge = { label: 'M', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    } else if (myScore < oppScore) {
      resBadge = { label: 'K', color: 'bg-red-500/20 text-red-400 border-red-500/40' };
    }

    formBadges += `<span class="w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold border ${resBadge.color}">${resBadge.label}</span>`;

    const oppLogo = getTeamLogo(oppTeam?.team);
    const isHome = myTeam?.homeAway === 'home';
    const formattedDate = new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    return `
      <div class="flex items-center justify-between bg-[#0f0720] p-2.5 rounded-xl border border-white/5 text-xs hover:bg-slate-800/40 transition">
        <div class="flex items-center gap-2 truncate max-w-[62%]">
          <span class="text-[9px] font-bold font-mono ${isHome ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' : 'text-blue-400 bg-blue-950/60 border-blue-500/30'} px-1.5 py-0.5 rounded border">${isHome ? 'HOME' : 'AWAY'}</span>
          <img src="${oppLogo}" loading="lazy" class="w-4 h-4 object-contain shrink-0" alt="">
          <span class="truncate font-semibold text-slate-200">${oppTeam?.team?.shortDisplayName || oppTeam?.team?.displayName || 'Lawan'}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[10px] text-slate-400">${formattedDate}</span>
          <span class="font-extrabold text-white bg-white/10 px-2 py-0.5 rounded-md border border-white/10 text-[11px] shadow-sm">${myScore} - ${oppScore}</span>
          <span class="w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold border ${resBadge.color}">${resBadge.label}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="bg-[#180d30] p-3.5 rounded-2xl border border-white/10 space-y-3 shadow-sm">
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <span class="text-xs font-bold text-white truncate max-w-[170px]">${teamName}</span>
        <div class="flex items-center gap-1.5">${formBadges}</div>
      </div>
      <div class="space-y-2">${matchRows}</div>
    </div>
  `;
}

function parseClockMinute(clockStr) {
  if (!clockStr) return 0;
  const str = String(clockStr).replace(/['\s]/g, '');
  if (str.includes('+')) {
    const parts = str.split('+');
    return (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0);
  }
  return parseInt(str) || 0;
}

function getBaseMinute(clockStr) {
  if (!clockStr) return 0;
  const str = String(clockStr).replace(/['\s]/g, '');
  if (str.includes('+')) {
    return parseInt(str.split('+')[0]) || 0;
  }
  return parseInt(str) || 0;
}

// Render Complete Match Detail Data (DARK PURPLE NEON LOOK)
function renderModalCompleteData(data, leagueId) {
  const header = data.header?.competitions?.[0];
  if (!header) return;

  const home = header.competitors?.find(c => c.homeAway === 'home') || header.competitors?.[0];
  const away = header.competitors?.find(c => c.homeAway === 'away') || header.competitors?.[1];
  
  if (!home || !away || !home.team || !away.team) return;

  const homeLogo = getTeamLogo(home.team);
  const awayLogo = getTeamLogo(away.team);

  const state = header.status?.type?.state;
  const statusDetail = header.status?.type?.shortDetail || (state === 'post' ? 'FT' : 'PRE');
  const formattedTime = formatLocalDate(header.date);

  const gameInfo = data.gameInfo || {};
  const venue = gameInfo.venue || {};
  const stadium = venue.fullName ? `${venue.fullName}${venue.address?.city ? ', ' + venue.address.city : ''}` : 'Belum ditentukan';

  const officials = gameInfo.officials || [];
  const refereeObj = officials.find(o => (o.position?.name || '').toLowerCase().includes('referee')) || officials[0];
  const referee = refereeObj?.displayName || 'Belum dirilis';

  const weatherObj = gameInfo.weather || {};
  let weather = 'Tidak ada data';
  if (weatherObj.displayValue) {
    weather = weatherObj.displayValue;
  } else if (weatherObj.temperature !== undefined) {
    weather = `${weatherObj.temperature}°C`;
    if (weatherObj.condition) weather += `, ${weatherObj.condition}`;
  }

  // MODERN PURPLE STADIUM INFO BADGES
  const matchInfoBadgeHtml = `
    <div class="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2.5">
      <div class="bg-white/5 p-3 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
        <div class="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-1.5 text-emerald-400">
          <i class="fa-solid fa-location-dot text-xs"></i>
        </div>
        <span class="font-extrabold text-slate-200 text-[11px] block truncate w-full" title="${stadium}">${stadium}</span>
        <span class="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Stadion</span>
      </div>

      <div class="bg-white/5 p-3 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
        <div class="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center mb-1.5 text-sky-400">
          <i class="fa-solid fa-user-ninja text-xs"></i>
        </div>
        <span class="font-extrabold text-slate-200 text-[11px] block truncate w-full" title="${referee}">${referee}</span>
        <span class="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Wasit</span>
      </div>

      <div class="bg-white/5 p-3 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center">
        <div class="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center mb-1.5 text-amber-400">
          <i class="fa-solid fa-cloud-sun text-xs"></i>
        </div>
        <span class="font-extrabold text-slate-200 text-[11px] block truncate w-full" title="${weather}">${weather}</span>
        <span class="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Cuaca</span>
      </div>
    </div>
  `;

  const rawEvents = data.details || data.keyEvents || header.details || [];
  const homeGoals = [];
  const awayGoals = [];

  const playerEventsMap = {};
  const registerPlayerEvent = (athleteId, type) => {
    if (!athleteId) return;
    const key = String(athleteId);
    if (!playerEventsMap[key]) {
      playerEventsMap[key] = { goals: 0, penGoals: 0, penMiss: 0, assists: 0, yellows: 0, reds: 0 };
    }
    playerEventsMap[key][type] = (playerEventsMap[key][type] || 0) + 1;
  };

  if (rawEvents && rawEvents.length > 0) {
    rawEvents.forEach(item => {
      const typeText = (item.type?.text || item.text || '').toLowerCase();
      const rawText = (item.text || '').toLowerCase();
      const p1 = item.participants?.[0]?.athlete?.id;
      const p2 = item.participants?.[1]?.athlete?.id;

      const isDisallowed = typeText.includes('disallowed') || typeText.includes('cancelled') || rawText.includes('disallowed') || rawText.includes('cancelled');

      if (typeText.includes('missed penalty') || typeText.includes('penalty miss') || (typeText.includes('penalty') && typeText.includes('miss'))) {
        registerPlayerEvent(p1, 'penMiss');
      } else if ((typeText.includes('goal') || typeText.includes('gol')) && !isDisallowed) {
        const clock = item.clock?.displayValue || item.time || '0';
        const scorer = item.participants?.[0]?.athlete?.displayName || item.text || 'Goal';
        const isHome = item.team?.id ? String(item.team.id) === String(home.team.id) : true;
        const isOG = typeText.includes('own goal') || typeText.includes('og');
        const isPen = typeText.includes('penalty') || typeText.includes('penalti');
        
        const goalObj = { scorer: `${scorer}${isOG ? '(OG)' : ''}`, clock: `${clock}'` };

        if (isHome) homeGoals.push(goalObj);
        else awayGoals.push(goalObj);

        if (isPen) registerPlayerEvent(p1, 'penGoals');
        else registerPlayerEvent(p1, 'goals');

        if (p2) registerPlayerEvent(p2, 'assists');
      } else if (typeText.includes('card') || typeText.includes('kartu')) {
        const isRed = typeText.includes('red') || typeText.includes('merah');
        if (isRed) registerPlayerEvent(p1, 'reds');
        else registerPlayerEvent(p1, 'yellows');
      }
    });
  }

  let goalsHtml = '';
  const maxLen = Math.max(homeGoals.length, awayGoals.length);
  if (maxLen > 0) {
    let rows = '';
    for (let i = 0; i < maxLen; i++) {
      const hG = homeGoals[i];
      const aG = awayGoals[i];
      rows += `
        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div class="text-right flex items-center justify-end gap-1.5 truncate">
            ${hG ? `<span class="truncate font-bold">${hG.scorer} ${hG.clock}</span> <i class="fa-solid fa-futbol text-[10px] text-emerald-400 shrink-0"></i>` : ''}
          </div>
          <div class="text-left flex items-center justify-start gap-1.5 truncate">
            ${aG ? `<i class="fa-solid fa-futbol text-[10px] text-emerald-400 shrink-0"></i> <span class="truncate font-bold">${aG.clock} ${aG.scorer}</span>` : ''}
          </div>
        </div>
      `;
    }
    goalsHtml = `<div class="mt-4 pt-3.5 border-t border-white/10 space-y-1.5">${rows}</div>`;
  }

  const liveOrStatusText = state === 'pre' 
    ? formattedTime 
    : (state === 'in' ? `<span class="text-red-400 font-bold animate-pulse">${header.status?.type?.shortDetail || 'LIVE'}</span>` : statusDetail);

  // SCORE HEADER CARD (DARK PURPLE GRADIENT)
  document.getElementById('modal-score-header').innerHTML = `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#2e134b] via-[#1d0d36] to-[#150a28] p-5 shadow-2xl text-white border border-purple-900/40">
      <div class="flex items-center justify-between relative z-10">
        <!-- Home Team -->
        <div onclick="openTeamDetail('${leagueId}', '${home.team.id}', '${home.team.displayName.replace(/'/g, "\\'")}')" class="flex flex-col items-center gap-2 w-[38%] text-center cursor-pointer group">
          <div class="w-16 h-16 sm:w-20 sm:h-20 p-2 rounded-2xl bg-white/5 border border-white/10 shadow-lg flex items-center justify-center group-hover:scale-105 transition">
            <img src="${homeLogo}" loading="lazy" class="w-full h-full object-contain" alt="">
          </div>
          <span class="font-extrabold text-xs sm:text-sm text-white leading-tight transition flex items-center justify-center gap-1">
            <span class="truncate">${home.team.displayName}</span>
            ${isTeamFavorite(home.team.id) ? '<i class="fa-solid fa-star text-amber-400 text-[9px]"></i>' : ''}
          </span>
        </div>

        <!-- Score Center Badge -->
        <div class="text-center w-[24%] flex flex-col items-center justify-center">
          <div class="text-2xl sm:text-3xl font-black tracking-widest text-white flex items-center justify-center gap-2">
            <span>${state === 'pre' ? 'VS' : (home.score || '0')}</span>
            ${state !== 'pre' ? '<span class="text-slate-400 text-lg">-</span><span>' + (away.score || '0') + '</span>' : ''}
          </div>
          <div class="text-[10px] text-slate-300 font-bold mt-2 bg-white/10 px-3 py-0.5 rounded-full border border-white/10 inline-flex items-center gap-1">
            ${liveOrStatusText}
          </div>
        </div>

        <!-- Away Team -->
        <div onclick="openTeamDetail('${leagueId}', '${away.team.id}', '${away.team.displayName.replace(/'/g, "\\'")}')" class="flex flex-col items-center gap-2 w-[38%] text-center cursor-pointer group">
          <div class="w-16 h-16 sm:w-20 sm:h-20 p-2 rounded-2xl bg-white/5 border border-white/10 shadow-lg flex items-center justify-center group-hover:scale-105 transition">
            <img src="${awayLogo}" loading="lazy" class="w-full h-full object-contain" alt="">
          </div>
          <span class="font-extrabold text-xs sm:text-sm text-white leading-tight transition flex items-center justify-center gap-1">
            <span class="truncate">${away.team.displayName}</span>
            ${isTeamFavorite(away.team.id) ? '<i class="fa-solid fa-star text-amber-400 text-[9px]"></i>' : ''}
          </span>
        </div>
      </div>

      ${goalsHtml}
    </div>
  `;

  // STATS BLOCK (RED & BLUE NEON ACCENT)
  let statsBlockHtml = '';
  if (state === 'pre') {
    statsBlockHtml = `
      <div class="bg-[#180d30] border border-white/10 rounded-3xl p-6 text-center shadow-sm">
        <i class="fa-solid fa-chart-line text-3xl text-slate-500 mb-2 block"></i>
        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Statistik Belum Tersedia</h4>
        <p class="text-[10px] text-slate-400 mt-1">Statistik live akan muncul secara otomatis ketika pertandingan telah dimulai.</p>
      </div>
    `;
  } else {
    const boxscoreTeams = data.boxscore?.teams || [];
    const homeBox = boxscoreTeams.find(t => String(t.team?.id) === String(home.team?.id));
    const awayBox = boxscoreTeams.find(t => String(t.team?.id) === String(away.team?.id));

    const getStatVal = (teamBox, keys) => {
      if (!teamBox || !teamBox.statistics) return 0;
      for (let key of keys) {
        const st = teamBox.statistics.find(s => s.name?.toLowerCase() === key.toLowerCase() || s.label?.toLowerCase() === key.toLowerCase());
        if (st) {
          const val = parseFloat(st.displayValue);
          return isNaN(val) ? st.displayValue : val;
        }
      }
      return 0;
    };

    const renderStatRow = (label, homeVal, awayVal, isPercentage = false) => {
      const hValNum = parseFloat(homeVal) || 0;
      const aValNum = parseFloat(awayVal) || 0;
      const total = (hValNum + aValNum) || 1;
      const hPct = Math.min(100, Math.max(0, Math.round((hValNum / total) * 100)));
      const aPct = 100 - hPct;

      return `
        <div class="space-y-1.5 py-1">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="px-2.5 py-0.5 rounded-full bg-[#ff4d6d] text-white text-[11px] font-black">${homeVal}${isPercentage ? '%' : ''}</span>
            <span class="text-slate-300 text-[11px] font-medium">${label}</span>
            <span class="px-2.5 py-0.5 rounded-full bg-[#38bdf8] text-slate-950 text-[11px] font-black">${awayVal}${isPercentage ? '%' : ''}</span>
          </div>
          <div class="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden flex">
            <div class="bg-[#ff4d6d] h-full transition-all duration-500" style="width: ${hPct}%"></div>
            <div class="bg-[#38bdf8] h-full transition-all duration-500" style="width: ${aPct}%"></div>
          </div>
        </div>
      `;
    };

    statsBlockHtml = `
      <div class="bg-[#180d30] border border-white/10 rounded-3xl p-4 space-y-3 shadow-xl">
        <h3 class="text-center text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-white/10">Overview</h3>
        <div class="space-y-3 pt-1">
          ${renderStatRow('Possession', getStatVal(homeBox, ['possessionPct', 'possession']) || 50, getStatVal(awayBox, ['possessionPct', 'possession']) || 50, true)}
          ${renderStatRow('Shots on Target', getStatVal(homeBox, ['shotsOnTarget', 'shotsontarget']) || 0, getStatVal(awayBox, ['shotsOnTarget', 'shotsontarget']) || 0)}
          ${renderStatRow('Shots off Target', getStatVal(homeBox, ['shotsOffTarget']) || 0, getStatVal(awayBox, ['shotsOffTarget']) || 0)}
          ${renderStatRow('Corners', getStatVal(homeBox, ['wonCorners', 'cornerKicks', 'corners']) || 0, getStatVal(awayBox, ['wonCorners', 'cornerKicks', 'corners']) || 0)}
          ${renderStatRow('Fouls', getStatVal(homeBox, ['foulsCommitted', 'fouls']) || 0, getStatVal(awayBox, ['foulsCommitted', 'fouls']) || 0)}
          ${renderStatRow('Yellow Cards', getStatVal(homeBox, ['yellowCards', 'yellowcards']) || 0, getStatVal(awayBox, ['yellowCards', 'yellowcards']) || 0)}
          ${renderStatRow('Red Cards', getStatVal(homeBox, ['redCards', 'redcards']) || 0, getStatVal(awayBox, ['redCards', 'redcards']) || 0)}
        </div>
      </div>
    `;
  }
  document.getElementById('mcontent-stats').innerHTML = statsBlockHtml;

  // TIMELINE BLOCK (CAPSULE SIDE LAYOUT & HOME/AWAY GOAL POSITION FIX)
  let eventsTimelineHtml = '';
  if (rawEvents && rawEvents.length > 0) {
    const validEvents = rawEvents.filter(item => {
      const typeText = (item.type?.text || item.text || '').toLowerCase();
      const rawText = (item.text || '').toLowerCase();

      if (typeText.includes('delay') || rawText.includes('delay') ||
          typeText.includes('begins') || rawText.includes('begins') ||
          typeText.includes('end ') || rawText.includes('end ') ||
          typeText.includes('half') || rawText.includes('half')) {
        return false;
      }

      const isGoal = typeText.includes('goal') || typeText.includes('gol') || rawText.includes('goal');
      const isCard = typeText.includes('card') || typeText.includes('kartu') || rawText.includes('card');
      const isSub = typeText.includes('sub') || typeText.includes('substitution') || rawText.includes('substitution');
      const isPenMiss = typeText.includes('penalty') || typeText.includes('penalti') || rawText.includes('penalty');
      const isVar = typeText.includes('var') || typeText.includes('disallowed') || rawText.includes('var') || rawText.includes('disallowed');

      return isGoal || isCard || isSub || isPenMiss || isVar;
    });

    const sortedEvents = validEvents.sort((a, b) => {
      const timeA = parseClockMinute(a.clock?.displayValue || a.time);
      const timeB = parseClockMinute(b.clock?.displayValue || b.time);
      return timeB - timeA;
    });

    let timelineItems = sortedEvents.map(item => {
      const clock = item.clock?.displayValue || item.time || '0\'';
      const isHomeEvent = item.team?.id ? String(item.team.id) === String(home.team.id) : true;
      const typeText = (item.type?.text || item.text || '').toLowerCase();

      const getPlayerName = (idx = 0) => {
        if (item.participants && item.participants[idx] && item.participants[idx].athlete) {
          return item.participants[idx].athlete.displayName || item.participants[idx].athlete.fullName || 'Pemain';
        }
        let raw = item.text || '';
        if (raw.includes('(')) raw = raw.split('(')[0];
        return raw.trim() || 'Pemain';
      };

      if (typeText.includes('goal') || typeText.includes('gol')) {
        const scorer = getPlayerName(0);

        const capsuleContent = `
          <div class="px-3.5 py-1.5 text-xs font-black flex items-center gap-2 shadow-lg rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-300">
            <i class="fa-solid fa-futbol text-xs"></i>
            <span>GOAL! ${scorer}</span>
          </div>
        `;

        return `
          <div class="flex items-center gap-3 my-2.5 ${isHomeEvent ? 'justify-start' : 'justify-end'}">
            ${isHomeEvent ? `
              ${capsuleContent}
              <span class="text-xs font-bold text-slate-400 font-mono">${clock}</span>
            ` : `
              <span class="text-xs font-bold text-slate-400 font-mono">${clock}</span>
              ${capsuleContent}
            `}
          </div>
        `;
      }

      if (typeText.includes('sub') || typeText.includes('substitution')) {
        const pIn = getPlayerName(0);
        const pOut = getPlayerName(1);

        const capsuleContent = `
          <div class="px-3 py-1.5 text-xs">
            <div class="flex items-center gap-1.5 text-emerald-400 font-bold">
              <i class="fa-solid fa-arrow-right text-[10px]"></i> ${pIn}
            </div>
            <div class="flex items-center gap-1.5 text-red-400 font-bold mt-0.5">
              <i class="fa-solid fa-arrow-left text-[10px]"></i> ${pOut}
            </div>
          </div>
        `;

        return `
          <div class="flex items-center gap-3 my-2.5 ${isHomeEvent ? 'justify-start' : 'justify-end'}">
            ${isHomeEvent ? `
              <div class="timeline-capsule-home max-w-[75%]">${capsuleContent}</div>
              <span class="text-xs font-bold text-slate-400 font-mono">${clock}</span>
            ` : `
              <span class="text-xs font-bold text-slate-400 font-mono">${clock}</span>
              <div class="timeline-capsule-away max-w-[75%]">${capsuleContent}</div>
            `}
          </div>
        `;
      }

      if (typeText.includes('card') || typeText.includes('kartu')) {
        const isRed = typeText.includes('red') || typeText.includes('merah');
        const player = getPlayerName(0);

        const cardBox = `<div class="w-2.5 h-3.5 ${isRed ? 'bg-red-500' : 'bg-amber-400'} rounded-sm shrink-0"></div>`;
        const capsuleContent = `
          <div class="px-3 py-1.5 text-xs font-bold text-white flex items-center gap-2">
            ${isHomeEvent ? cardBox : ''}
            <span>${player}</span>
            ${!isHomeEvent ? cardBox : ''}
          </div>
        `;

        return `
          <div class="flex items-center gap-3 my-2.5 ${isHomeEvent ? 'justify-start' : 'justify-end'}">
            ${isHomeEvent ? `
              <div class="timeline-capsule-home">${capsuleContent}</div>
              <span class="text-xs font-bold text-slate-400 font-mono">${clock}</span>
            ` : `
              <span class="text-xs font-bold text-slate-400 font-mono">${clock}</span>
              <div class="timeline-capsule-away">${capsuleContent}</div>
            `}
          </div>
        `;
      }

      return '';
    }).join('');

    eventsTimelineHtml = `
      <div class="bg-[#180d30] p-4 rounded-3xl border border-white/10 shadow-xl space-y-1">
        ${timelineItems}
        ${matchInfoBadgeHtml}
      </div>
    `;
  } else {
    eventsTimelineHtml = `
      <div class="bg-[#180d30] p-4 rounded-3xl border border-white/10 shadow-xl space-y-3">
        <div class="py-8 text-center text-slate-400 text-xs font-medium space-y-1">
          <p class="text-slate-200 font-bold">Belum ada catatan kejadian penting.</p>
        </div>
        ${matchInfoBadgeHtml}
      </div>
    `;
  }

  document.getElementById('mcontent-summary').innerHTML = eventsTimelineHtml;

  // ROSTERS / LINEUP PITCH
  const rosters = data.rosters || [];
  let lineupHtml = '';

  if (rosters && rosters.length >= 2) {
    const homeRoster = rosters.find(r => String(r.team?.id) === String(home.team?.id)) || rosters[0];
    const awayRoster = rosters.find(r => String(r.team?.id) === String(away.team?.id)) || rosters[1];

    const parsePositionRows = (rosterList) => {
      const starters = rosterList.filter(p => p.starter);
      const gk = [], def = [], mid = [], fwd = [];

      starters.forEach(p => {
        const pos = (p.position?.abbreviation || p.position?.name || '').toUpperCase();
        if (pos.includes('GK') || pos.includes('G')) gk.push(p);
        else if (pos.includes('CB') || pos.includes('LB') || pos.includes('RB') || pos.includes('WB') || pos.includes('DF') || pos.includes('D')) def.push(p);
        else if (pos.includes('CM') || pos.includes('DM') || pos.includes('AM') || pos.includes('LM') || pos.includes('RM') || pos.includes('MF') || pos.includes('M')) mid.push(p);
        else fwd.push(p);
      });
      if (gk.length === 0 && starters.length > 0) gk.push(starters[0]);

      return { gk, def, mid, fwd, subs: rosterList.filter(p => !p.starter) };
    };

    const homeData = parsePositionRows(homeRoster.roster || []);
    const awayData = parsePositionRows(awayRoster.roster || []);

    const getPlayerBadgeHtml = (athleteId) => {
      if (!athleteId) return '';
      const ev = playerEventsMap[String(athleteId)];
      if (!ev) return '';

      let badges = '';
      if (ev.goals) badges += `<span title="Gol" class="bg-emerald-600 text-white text-[8px] font-black px-1 rounded-full flex items-center gap-0.5 shadow"><i class="fa-solid fa-futbol text-[7px]"></i>${ev.goals > 1 ? ev.goals : ''}</span>`;
      if (ev.penGoals) badges += `<span title="Gol Penalti" class="bg-emerald-600 text-amber-300 text-[8px] font-black px-1 rounded-full flex items-center gap-0.5 shadow"><i class="fa-solid fa-circle-dot text-[7px]"></i>${ev.penGoals > 1 ? ev.penGoals : ''}</span>`;
      if (ev.penMiss) badges += `<span title="Penalti Gagal" class="bg-red-600 text-white text-[8px] font-black px-1 rounded-full flex items-center gap-0.5 shadow"><i class="fa-solid fa-circle-xmark text-[7px]"></i></span>`;
      if (ev.assists) badges += `<span title="Assist" class="bg-blue-600 text-white text-[8px] font-black px-1 rounded-full flex items-center gap-0.5 shadow"><i class="fa-solid fa-shoe-prints text-[7px]"></i>${ev.assists > 1 ? ev.assists : ''}</span>`;
      if (ev.yellows) badges += `<div title="Kartu Kuning" class="w-2.5 h-3.5 bg-amber-400 rounded-sm shadow"></div>`;
      if (ev.reds) badges += `<div title="Kartu Merah" class="w-2.5 h-3.5 bg-red-500 rounded-sm shadow"></div>`;

      return badges ? `<div class="absolute -bottom-1 -left-1 flex items-center gap-0.5 z-20">${badges}</div>` : '';
    };

    const renderPlayerRow = (players, borderColor = 'border-emerald-400') => {
      if (!players || players.length === 0) return '';
      return `
        <div class="flex items-center justify-around w-full px-0.5 z-10 my-1 gap-0.5">
          ${players.map(p => {
            const pId = p.athlete?.id;
            const pFullName = p.athlete?.fullName || p.athlete?.displayName || p.athlete?.shortName || 'Pemain';
            const pMultiLine = formatMultiLineName(pFullName);
            const jersey = p.jersey || '?';
            const badgeHtml = getPlayerBadgeHtml(pId);

            return `
              <div class="flex flex-col items-center group relative cursor-pointer flex-1 min-w-0 max-w-[70px] sm:max-w-[85px]">
                <div class="relative shrink-0">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${borderColor} bg-[#0f0720] overflow-hidden shadow-md flex items-center justify-center">
                    <img src="${PLAIN_PERSON_HEADSHOT}" loading="lazy" class="w-full h-full object-cover" onload="loadMultiTierPlayerPhoto(this, '${pId}', '${pFullName.replace(/'/g, "\\'")}')" onerror="handlePlayerImgError(this, '${pFullName.replace(/'/g, "\\'")}')">
                  </div>
                  <span class="absolute -top-1 -right-1 bg-[#0d061a] text-white font-black text-[8px] sm:text-[9px] px-1 py-0.2 rounded-full shadow z-10">#${jersey}</span>
                  ${badgeHtml}
                </div>
                <span class="text-[8.5px] sm:text-[9.5px] font-bold text-white bg-[#0f0720]/95 px-1.5 py-0.5 rounded shadow-sm w-full text-center mt-1 border border-white/10 leading-tight break-words" title="${pFullName}">${pMultiLine}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    };

    const renderSubstitutesImage2Style = (homeSubs, awaySubs) => {
      const maxSubs = Math.max(homeSubs.length, awaySubs.length);
      let subRowsHtml = '';

      const renderSubItem = (p) => {
        if (!p) return `<div class="flex-1"></div>`;
        const pId = p.athlete?.id;
        const pFullName = p.athlete?.fullName || p.athlete?.displayName || 'Pemain';
        const pMultiLine = formatMultiLineName(pFullName);
        const jersey = p.jersey || '?';
        const badgeHtml = getPlayerBadgeHtml(pId);

        return `
          <div class="flex items-center gap-2 py-1.5 px-0.5 min-w-0 flex-1">
            <div class="relative shrink-0">
              <div class="w-8 h-8 rounded-full bg-[#0f0720] overflow-hidden border border-white/10 flex items-center justify-center">
                <img src="${PLAIN_PERSON_HEADSHOT}" loading="lazy" class="w-full h-full object-cover" onload="loadMultiTierPlayerPhoto(this, '${pId}', '${pFullName.replace(/'/g, "\\'")}')" onerror="handlePlayerImgError(this, '${pFullName.replace(/'/g, "\\'")}')">
              </div>
              ${badgeHtml}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start gap-1 leading-tight">
                <span class="text-blue-400 font-black text-xs shrink-0">#${jersey}</span>
                <span class="text-xs font-bold text-slate-200 leading-snug break-words">${pMultiLine}</span>
              </div>
            </div>
          </div>
        `;
      };

      for (let i = 0; i < maxSubs; i++) {
        const hP = homeSubs[i];
        const aP = awaySubs[i];
        subRowsHtml += `
          <div class="flex items-center border-b border-white/5 last:border-b-0">
            <div class="w-1/2 pr-1.5 border-r border-white/10">${renderSubItem(hP)}</div>
            <div class="w-1/2 pl-1.5">${renderSubItem(aP)}</div>
          </div>
        `;
      }

      return `
        <div class="bg-[#180d30] border border-white/10 rounded-3xl p-3 shadow-sm space-y-2 mt-3">
          <div class="text-sm font-extrabold text-white pb-2 border-b border-white/10 flex items-center justify-between">
            <span>Substitutes</span>
            <span class="text-[10px] text-slate-400 font-normal">Cadangan</span>
          </div>
          <div class="space-y-0.5">
            ${subRowsHtml}
          </div>
        </div>
      `;
    };

    lineupHtml = `
      <div class="space-y-3 bg-[#180d30] border border-white/10 p-2.5 rounded-3xl shadow-sm">
        <div class="flex items-center justify-between border-b border-white/10 pb-2 text-[10px]">
          <div class="flex items-center gap-1.5 text-blue-400 font-bold">
            <img src="${homeLogo}" loading="lazy" class="w-4 h-4 object-contain">
            <span>${home.team.displayName} (${homeRoster.formation || 'Formasi'})</span>
          </div>
          <div class="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span>(${awayRoster.formation || 'Formasi'}) ${away.team.displayName}</span>
            <img src="${awayLogo}" loading="lazy" class="w-4 h-4 object-contain">
          </div>
        </div>

        <div class="soccer-full-pitch rounded-2xl p-1 py-3 flex flex-col justify-between relative">
          <div class="pitch-center-line-full"></div>
          <div class="pitch-center-circle"></div>
          <div class="pitch-center-dot"></div>
          <div class="pitch-penalty-box-top"></div>
          <div class="pitch-penalty-box-bottom"></div>

          <div class="space-y-1 z-10">
            ${renderPlayerRow(homeData.gk, 'border-blue-500')}
            ${renderPlayerRow(homeData.def, 'border-blue-400')}
            ${renderPlayerRow(homeData.mid, 'border-blue-400')}
            ${renderPlayerRow(homeData.fwd, 'border-blue-400')}
          </div>

          <div class="space-y-1 z-10">
            ${renderPlayerRow(awayData.fwd, 'border-emerald-400')}
            ${renderPlayerRow(awayData.mid, 'border-emerald-400')}
            ${renderPlayerRow(awayData.def, 'border-emerald-400')}
            ${renderPlayerRow(awayData.gk, 'border-emerald-500')}
          </div>
        </div>

        ${renderSubstitutesImage2Style(homeData.subs, awayData.subs)}
      </div>
    `;
  } else {
    lineupHtml = `<div class="text-center py-8 text-slate-400 bg-[#180d30] rounded-3xl border border-white/10"><i class="fa-solid fa-user-slash text-2xl mb-2 block"></i>Susunan pemain resmi belum dirilis oleh official.</div>`;
  }
  document.getElementById('mcontent-lineup').innerHTML = lineupHtml;
}

// SWITCH MODAL PILL TABS
function switchModalTab(tabName) {
  const tabs = ['summary', 'stats', 'lineup', 'standings', 'h2h'];

  tabs.forEach(t => {
    const btn = document.getElementById(`mtab-${t}`);
    const content = document.getElementById(`mcontent-${t}`);

    if (btn && content) {
      if (t === tabName) {
        btn.className = "flex-1 py-1.5 px-3 text-[11px] tab-pill-active rounded-full transition-all duration-200 whitespace-nowrap text-center";
        content.classList.remove('hidden');
      } else {
        btn.className = "flex-1 py-1.5 px-3 text-[11px] tab-pill-inactive rounded-full transition-all duration-200 whitespace-nowrap text-center";
        content.classList.add('hidden');
      }
    }
  });
}

function closeModal() {
  currentOpenModal = null;
  document.getElementById('detail-modal').classList.add('hidden');
  checkResetZIndex();
}
