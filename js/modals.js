// MODALS & DIALOG CONTROLLER MODULE (REDESIGNED HIGH-CONTRAST MODERN)

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
    btn.className = 'px-2.5 py-1 bg-slate-100 text-emerald-700 rounded-lg text-[10px] font-bold cursor-default';
    btn.disabled = true;
  } else if (Notification.permission === 'denied') {
    statusLabel.innerText = 'Izin ditolak di pengaturan browser/HP';
    btn.innerText = 'Ditolak';
    btn.className = 'px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold cursor-default';
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
    <button onclick="selectLeagueFromModal('all')" class="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border ${selectedLeague === 'all' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'} rounded-xl flex items-center gap-2.5 transition text-left mb-2 shadow-sm">
      <i class="fa-solid fa-globe text-emerald-600 text-base"></i>
      <div>
        <div class="text-xs font-bold text-slate-900">Semua Liga</div>
        <div class="text-[9px] text-slate-500">Tampilkan seluruh pertandingan global</div>
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
        <div class="text-center py-12 text-slate-500 space-y-2">
          <i class="fa-solid fa-circle-exclamation text-2xl text-amber-500"></i>
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
    <div class="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
      <i class="fa-solid fa-circle-notch fa-spin text-xl text-emerald-600"></i>
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
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="text-xs font-bold text-slate-900 mb-1">${teamName}</div>
        <p class="text-[10px] text-slate-500">Tidak ada riwayat pertandingan terbaru.</p>
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

    let resBadge = { label: 'S', color: 'bg-amber-100 text-amber-700 border-amber-300' };
    if (myScore > oppScore) {
      resBadge = { label: 'M', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
    } else if (myScore < oppScore) {
      resBadge = { label: 'K', color: 'bg-red-100 text-red-700 border-red-300' };
    }

    formBadges += `<span class="w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold border ${resBadge.color}">${resBadge.label}</span>`;

    const oppLogo = getTeamLogo(oppTeam?.team);
    const isHome = myTeam?.homeAway === 'home';
    const formattedDate = new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    return `
      <div class="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs hover:bg-slate-100 transition">
        <div class="flex items-center gap-2 truncate max-w-[62%]">
          <span class="text-[9px] font-bold font-mono ${isHome ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-blue-700 bg-blue-50 border-blue-200'} px-1.5 py-0.5 rounded border">${isHome ? 'HOME' : 'AWAY'}</span>
          <img src="${oppLogo}" loading="lazy" class="w-4 h-4 object-contain shrink-0" alt="">
          <span class="truncate font-semibold text-slate-800">${oppTeam?.team?.shortDisplayName || oppTeam?.team?.displayName || 'Lawan'}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[10px] text-slate-500">${formattedDate}</span>
          <span class="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px] shadow-sm">${myScore} - ${oppScore}</span>
          <span class="w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold border ${resBadge.color}">${resBadge.label}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
      <div class="flex items-center justify-between pb-2 border-b border-slate-100">
        <span class="text-xs font-bold text-slate-900 truncate max-w-[170px]">${teamName}</span>
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

// Render Complete Match Detail Data (Light Modern UI)
function renderModalCompleteData(data, leagueId) {
  const header = data.header?.competitions?.[0];
  if (!header) return;

  const home = header.competitors?.find(c => c.homeAway === 'home') || header.competitors?.[0];
  const away = header.competitors?.find(c => c.homeAway === 'away') || header.competitors?.[1];
  
  if (!home || !away || !home.team || !away.team) return;

  const homeLogo = getTeamLogo(home.team);
  const awayLogo = getTeamLogo(away.team);

  const state = header.status?.type?.state;
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

  // MODERN LIGHT INFO BADGE GRID
  const matchInfoBadgeHtml = `
    <div class="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2.5">
      <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
        <div class="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center mb-1.5 text-emerald-600">
          <i class="fa-solid fa-location-dot text-xs"></i>
        </div>
        <span class="font-extrabold text-slate-800 text-[11px] block truncate w-full" title="${stadium}">${stadium}</span>
        <span class="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Stadion</span>
      </div>

      <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
        <div class="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center mb-1.5 text-sky-600">
          <i class="fa-solid fa-user-ninja text-xs"></i>
        </div>
        <span class="font-extrabold text-slate-800 text-[11px] block truncate w-full" title="${referee}">${referee}</span>
        <span class="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Wasit</span>
      </div>

      <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
        <div class="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center mb-1.5 text-amber-600">
          <i class="fa-solid fa-cloud-sun text-xs"></i>
        </div>
        <span class="font-extrabold text-slate-800 text-[11px] block truncate w-full" title="${weather}">${weather}</span>
        <span class="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Cuaca</span>
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
        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
          <div class="text-right flex items-center justify-end gap-1.5 truncate">
            ${hG ? `<span class="truncate font-bold">${hG.scorer} ${hG.clock}</span> <i class="fa-solid fa-futbol text-[10px] text-emerald-600 shrink-0"></i>` : ''}
          </div>
          <div class="text-left flex items-center justify-start gap-1.5 truncate">
            ${aG ? `<i class="fa-solid fa-futbol text-[10px] text-emerald-600 shrink-0"></i> <span class="truncate font-bold">${aG.clock} ${aG.scorer}</span>` : ''}
          </div>
        </div>
      `;
    }
    goalsHtml = `<div class="mt-4 pt-3.5 border-t border-slate-700/50 space-y-1.5">${rows}</div>`;
  }

  const liveOrStatusText = state === 'pre' 
    ? formattedTime 
    : (state === 'in' ? `<span class="text-red-400 font-bold animate-pulse">${header.status?.type?.shortDetail || 'LIVE'}</span>` : header.status?.type?.description);

  // MODERN HERO CARD HEADER WITH DEEP SLATE ACCENT
  document.getElementById('modal-score-header').innerHTML = `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-5 shadow-xl text-white">
      <div class="flex items-center justify-between relative z-10">
        <!-- Home Team -->
        <div onclick="openTeamDetail('${leagueId}', '${home.team.id}', '${home.team.displayName.replace(/'/g, "\\'")}')" class="flex flex-col items-center gap-2 w-[38%] text-center cursor-pointer group">
          <div class="w-16 h-16 sm:w-20 sm:h-20 p-2.5 rounded-2xl bg-white border border-slate-700/60 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all duration-300">
            <img src="${homeLogo}" loading="lazy" class="w-full h-full object-contain" alt="">
          </div>
          <span class="font-extrabold text-xs sm:text-sm text-white leading-tight group-hover:text-emerald-400 transition flex items-center justify-center gap-1">
            <span class="truncate">${home.team.displayName}</span>
            ${isTeamFavorite(home.team.id) ? '<i class="fa-solid fa-star text-amber-400 text-[9px]"></i>' : ''}
          </span>
        </div>

        <!-- VS / Score Center Badge -->
        <div class="text-center w-[24%] flex flex-col items-center justify-center">
          <div class="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm sm:text-lg px-4 py-1 rounded-full shadow-md tracking-wider">
            ${state === 'pre' ? 'VS' : (home.score || '0') + ' - ' + (away.score || '0')}
          </div>
          <div class="text-[10px] text-slate-200 font-bold mt-2.5 bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700 inline-flex items-center gap-1">
            ${liveOrStatusText}
          </div>
        </div>

        <!-- Away Team -->
        <div onclick="openTeamDetail('${leagueId}', '${away.team.id}', '${away.team.displayName.replace(/'/g, "\\'")}')" class="flex flex-col items-center gap-2 w-[38%] text-center cursor-pointer group">
          <div class="w-16 h-16 sm:w-20 sm:h-20 p-2.5 rounded-2xl bg-white border border-slate-700/60 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all duration-300">
            <img src="${awayLogo}" loading="lazy" class="w-full h-full object-contain" alt="">
          </div>
          <span class="font-extrabold text-xs sm:text-sm text-white leading-tight group-hover:text-emerald-400 transition flex items-center justify-center gap-1">
            <span class="truncate">${away.team.displayName}</span>
            ${isTeamFavorite(away.team.id) ? '<i class="fa-solid fa-star text-amber-400 text-[9px]"></i>' : ''}
          </span>
        </div>
      </div>

      ${goalsHtml}
    </div>
  `;

  let statsBlockHtml = '';
  if (state === 'pre') {
    statsBlockHtml = `
      <div class="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
        <i class="fa-solid fa-chart-line text-3xl text-slate-300 mb-2 block"></i>
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Statistik Belum Tersedia</h4>
        <p class="text-[10px] text-slate-500 mt-1">Statistik live akan muncul secara otomatis ketika pertandingan telah dimulai.</p>
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

    const homePoss = getStatVal(homeBox, ['possessionPct', 'possession']) || 50;
    const awayPoss = getStatVal(awayBox, ['possessionPct', 'possession']) || 50;
    const homeShotsOn = getStatVal(homeBox, ['shotsOnTarget', 'shotsontarget']) || 0;
    const awayShotsOn = getStatVal(awayBox, ['shotsOnTarget', 'shotsontarget']) || 0;
    const homeTotalShots = getStatVal(homeBox, ['totalShots', 'shots']) || 0;
    const awayTotalShots = getStatVal(awayBox, ['totalShots', 'shots']) || 0;
    const homeShotsOff = Math.max(0, homeTotalShots - homeShotsOn) || getStatVal(homeBox, ['shotsOffTarget']) || 0;
    const awayShotsOff = Math.max(0, awayTotalShots - awayShotsOn) || getStatVal(awayBox, ['shotsOffTarget']) || 0;
    const homeCorners = getStatVal(homeBox, ['wonCorners', 'cornerKicks', 'corners']) || 0;
    const awayCorners = getStatVal(awayBox, ['wonCorners', 'cornerKicks', 'corners']) || 0;
    const homeYellows = getStatVal(homeBox, ['yellowCards', 'yellowcards']) || 0;
    const awayYellows = getStatVal(awayBox, ['yellowCards', 'yellowcards']) || 0;
    const homeReds = getStatVal(homeBox, ['redCards', 'redcards']) || 0;
    const awayReds = getStatVal(awayBox, ['redCards', 'redcards']) || 0;
    const homeFouls = getStatVal(homeBox, ['foulsCommitted', 'fouls']) || 0;
    const awayFouls = getStatVal(awayBox, ['foulsCommitted', 'fouls']) || 0;

    const renderStatRow = (label, homeVal, awayVal, isPercentage = false) => {
      const hValNum = parseFloat(homeVal) || 0;
      const aValNum = parseFloat(awayVal) || 0;
      const total = (hValNum + aValNum) || 1;
      const hPct = Math.min(100, Math.max(0, Math.round((hValNum / total) * 100)));
      const aPct = 100 - hPct;

      const isHomeDominant = hValNum > aValNum;
      const isAwayDominant = aValNum > hValNum;

      return `
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 transition">
          <div class="flex items-center justify-between text-xs">
            <span class="font-extrabold ${isHomeDominant ? 'text-blue-600 text-sm' : 'text-slate-700'}">${homeVal}${isPercentage ? '%' : ''}</span>
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">${label}</span>
            <span class="font-extrabold ${isAwayDominant ? 'text-emerald-600 text-sm' : 'text-slate-700'}">${awayVal}${isPercentage ? '%' : ''}</span>
          </div>
          <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex p-0.5">
            <div class="bg-gradient-to-r from-blue-600 to-blue-500 h-full rounded-l-full transition-all duration-500" style="width: ${hPct}%"></div>
            <div class="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-r-full transition-all duration-500" style="width: ${aPct}%"></div>
          </div>
        </div>
      `;
    };

    statsBlockHtml = `
      <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
        <div class="flex items-center justify-between text-xs font-black pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2 text-blue-600 truncate max-w-[45%]">
            <span class="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0"></span>
            <span class="truncate">${home.team.shortDisplayName || home.team.displayName}</span>
          </div>
          <span class="text-[10px] text-slate-400 uppercase font-mono tracking-wider">STATISTIK</span>
          <div class="flex items-center gap-2 text-emerald-600 truncate max-w-[45%] justify-end text-right">
            <span class="truncate">${away.team.shortDisplayName || away.team.displayName}</span>
            <span class="w-2.5 h-2.5 bg-emerald-600 rounded-full shrink-0"></span>
          </div>
        </div>

        <div class="space-y-2 pt-1">
          ${renderStatRow('Penguasaan Bola', homePoss, awayPoss, true)}
          ${renderStatRow('Tembakan On Target', homeShotsOn, awayShotsOn)}
          ${renderStatRow('Tembakan Off Target', homeShotsOff, awayShotsOff)}
          ${renderStatRow('Tendangan Sudut', homeCorners, awayCorners)}
          ${renderStatRow('Pelanggaran', homeFouls, awayFouls)}
          ${renderStatRow('Kartu Kuning', homeYellows, awayYellows)}
          ${renderStatRow('Kartu Merah', homeReds, awayReds)}
        </div>
      </div>
    `;
  }
  document.getElementById('mcontent-stats').innerHTML = statsBlockHtml;

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

    let htInserted = false;
    const ftScoreStr = `${home.score || 0} - ${away.score || 0}`;

    let timelineItems = `
      <div class="relative flex items-center justify-center pt-2 pb-1">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
        <div class="relative bg-slate-100 px-3 text-slate-500 text-sm rounded-full border border-slate-200">
          <i class="fa-solid fa-stopwatch"></i>
        </div>
      </div>
      <div class="relative flex items-center justify-center mb-3">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
        <span class="relative bg-slate-900 px-3 py-0.5 rounded-full text-xs font-black tracking-wider text-white uppercase">FT ${ftScoreStr}</span>
      </div>
    `;

    timelineItems += sortedEvents.map(item => {
      const clock = item.clock?.displayValue || item.time || '0\'';
      const baseMin = getBaseMinute(clock);

      let dividerHtml = '';
      if (!htInserted && baseMin <= 45) {
        htInserted = true;
        dividerHtml = `
          <div class="relative flex items-center justify-center my-3">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
            <span class="relative bg-slate-200 px-3 py-0.5 rounded-full text-xs font-black tracking-wider text-slate-700 uppercase">HT</span>
          </div>
        `;
      }

      const isHomeEvent = item.team?.id ? String(item.team.id) === String(home.team.id) : true;
      const typeText = (item.type?.text || item.text || '').toLowerCase();
      const rawText = (item.text || '').toLowerCase();
      let mainContent = '';

      const getPlayerName = (idx = 0) => {
        if (item.participants && item.participants[idx] && item.participants[idx].athlete) {
          return item.participants[idx].athlete.fullName || item.participants[idx].athlete.displayName || item.participants[idx].athlete.shortName || '';
        }
        let raw = item.text || '';
        if (raw.includes('(')) raw = raw.split('(')[0];
        return raw.trim() || 'Pemain';
      };

      if (typeText.includes('var') || typeText.includes('disallowed') || typeText.includes('cancelled') || rawText.includes('var') || rawText.includes('disallowed')) {
        const scorer = getPlayerName(0);
        const varBadge = `
          <span class="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
            <i class="fa-solid fa-tv"></i> VAR: Gol Dibatalkan
          </span>
        `;

        mainContent = `
          <div class="flex items-center gap-1.5 min-w-0 ${isHomeEvent ? '' : 'justify-end'}">
            ${isHomeEvent ? varBadge : ''}
            <span class="text-xs font-bold text-slate-800 truncate flex-1 min-w-0">${scorer}</span>
            ${!isHomeEvent ? varBadge : ''}
          </div>
        `;

      } else if (typeText.includes('missed penalty') || typeText.includes('penalty miss') || (typeText.includes('penalty') && typeText.includes('miss'))) {
        const scorer = getPlayerName(0);
        const missedPenIcon = `
          <div class="relative inline-flex items-center justify-center shrink-0">
            <i class="fa-solid fa-futbol text-emerald-600 text-sm"></i>
            <i class="fa-solid fa-xmark text-red-600 text-[11px] font-black absolute inset-0 flex items-center justify-center"></i>
          </div>
        `;

        mainContent = `
          <div class="flex items-center gap-1.5 min-w-0 ${isHomeEvent ? '' : 'justify-end'}">
            ${isHomeEvent ? missedPenIcon : ''}
            <div class="flex flex-col ${isHomeEvent ? 'text-left' : 'text-right'} min-w-0 flex-1">
              <span class="text-xs font-bold text-slate-800 truncate">${scorer}</span>
              <span class="text-[9px] font-bold text-red-600 uppercase tracking-tight flex items-center gap-1 ${isHomeEvent ? '' : 'justify-end'}"><i class="fa-solid fa-ban text-[8px]"></i> Penalti Gagal</span>
            </div>
            ${!isHomeEvent ? missedPenIcon : ''}
          </div>
        `;

      } else if (typeText.includes('goal') || typeText.includes('gol')) {
        const scorer = getPlayerName(0);
        const assist = item.participants?.[1]?.athlete?.displayName || '';
        const isOG = typeText.includes('own goal') || typeText.includes('og');
        const isPen = typeText.includes('penalty') || typeText.includes('penalti');
        const runningScore = item.scoreValue || 'GOL';

        let goalIcon = `<i class="fa-solid fa-futbol text-slate-900 text-sm shrink-0"></i>`;
        let goalLabel = '';

        if (isPen) {
          goalLabel = 'Gol Penalti';
          goalIcon = `<i class="fa-solid fa-futbol text-emerald-600 text-sm shrink-0"></i>`;
        } else if (isOG) {
          goalLabel = 'Gol Bunuh Diri';
          goalIcon = `<i class="fa-solid fa-futbol text-red-600 text-sm shrink-0"></i>`;
        }

        if (isHomeEvent) {
          mainContent = `
            <div class="flex items-start gap-2 min-w-0">
              <div class="flex flex-col items-center shrink-0">
                ${goalIcon}
                ${runningScore ? `<span class="bg-emerald-600 text-white font-black text-[8px] px-1.5 py-0.2 rounded mt-0.5">${runningScore}</span>` : ''}
              </div>
              <div class="flex flex-col text-left min-w-0 flex-1">
                <span class="text-xs font-black text-slate-900 leading-tight break-words">${scorer}</span>
                ${goalLabel ? `<span class="text-[9px] text-emerald-700 font-bold truncate mt-0.5">${goalLabel}</span>` : (assist ? `<span class="text-[9px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1"><i class="fa-solid fa-shoe-prints text-[8px] text-emerald-600"></i>${assist}</span>` : '')}
              </div>
            </div>
          `;
        } else {
          mainContent = `
            <div class="flex items-start justify-end gap-2 min-w-0 text-right">
              <div class="flex flex-col text-right min-w-0 flex-1">
                <span class="text-xs font-black text-slate-900 leading-tight break-words">${scorer}</span>
                ${goalLabel ? `<span class="text-[9px] text-emerald-700 font-bold truncate mt-0.5">${goalLabel}</span>` : (assist ? `<span class="text-[9px] text-slate-500 font-medium truncate mt-0.5 flex items-center justify-end gap-1"><i class="fa-solid fa-shoe-prints text-[8px] text-emerald-600"></i>${assist}</span>` : '')}
              </div>
              <div class="flex flex-col items-center shrink-0">
                ${goalIcon}
                ${runningScore ? `<span class="bg-emerald-600 text-white font-black text-[8px] px-1.5 py-0.2 rounded mt-0.5">${runningScore}</span>` : ''}
              </div>
            </div>
          `;
        }

      } else if (typeText.includes('sub') || typeText.includes('substitution')) {
        const playerIn = getPlayerName(0) || 'Pemain Masuk';
        const playerOut = getPlayerName(1) || 'Pemain Keluar';

        if (isHomeEvent) {
          mainContent = `
            <div class="flex flex-col text-left min-w-0 flex-1">
              <div class="flex items-center gap-1 text-xs font-bold text-emerald-700 min-w-0">
                <i class="fa-solid fa-circle-arrow-right text-emerald-600 text-xs shrink-0"></i>
                <span class="truncate">${playerIn}</span>
              </div>
              <div class="flex items-center gap-1 text-xs font-bold text-red-600 mt-0.5 min-w-0">
                <i class="fa-solid fa-circle-arrow-left text-red-500 text-xs shrink-0"></i>
                <span class="truncate">${playerOut}</span>
              </div>
            </div>
          `;
        } else {
          mainContent = `
            <div class="flex flex-col text-right min-w-0 flex-1">
              <div class="flex items-center justify-end gap-1 text-xs font-bold text-emerald-700 min-w-0">
                <span class="truncate">${playerIn}</span>
                <i class="fa-solid fa-circle-arrow-right text-emerald-600 text-xs shrink-0"></i>
              </div>
              <div class="flex items-center justify-end gap-1 text-xs font-bold text-red-600 mt-0.5 min-w-0">
                <span class="truncate">${playerOut}</span>
                <i class="fa-solid fa-circle-arrow-left text-red-500 text-xs shrink-0"></i>
              </div>
            </div>
          `;
        }

      } else if (typeText.includes('card') || typeText.includes('kartu')) {
        const isRed = typeText.includes('red') || typeText.includes('merah');
        const playerName = getPlayerName(0);
        const cardLabel = isRed ? 'Kartu Merah' : 'Kartu Kuning';
        const cardBox = `<div class="w-2.5 h-3.5 ${isRed ? 'bg-red-500' : 'bg-amber-400'} rounded-sm shrink-0 shadow-sm border border-slate-300"></div>`;

        mainContent = `
          <div class="flex items-center gap-1.5 min-w-0 ${isHomeEvent ? '' : 'justify-end'}">
            ${isHomeEvent ? cardBox : ''}
            <div class="flex flex-col min-w-0 flex-1 ${isHomeEvent ? 'text-left' : 'text-right'}">
              <span class="text-xs font-bold text-slate-800 truncate">${playerName}</span>
              <span class="text-[9px] text-slate-500 truncate">${cardLabel}</span>
            </div>
            ${!isHomeEvent ? cardBox : ''}
          </div>
        `;
      }

      return `
        ${dividerHtml}
        <div class="grid grid-cols-12 items-center py-2 min-h-[44px] border-b border-slate-100 gap-1">
          <div class="col-span-6 flex items-center pr-1 min-w-0">
            ${isHomeEvent ? `
              <span class="text-[10px] font-mono font-bold text-slate-500 w-8 text-left shrink-0">${clock}</span>
              <div class="flex-1 min-w-0">${mainContent}</div>
            ` : ''}
          </div>

          <div class="col-span-6 flex items-center justify-end pl-1 min-w-0">
            ${!isHomeEvent ? `
              <div class="flex-1 min-w-0">${mainContent}</div>
              <span class="text-[10px] font-mono font-bold text-slate-500 w-8 text-right shrink-0">${clock}</span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    eventsTimelineHtml = `
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <div class="flex items-center justify-between text-xs font-extrabold text-slate-900 pb-2 mb-2 border-b border-slate-100">
          <span>Kejadian Pertandingan</span>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-slate-500 font-normal">Gol</span>
            <div class="w-2.5 h-2.5 bg-slate-800 rounded-full"></div>
          </div>
        </div>
        ${timelineItems}
        ${matchInfoBadgeHtml}
      </div>
    `;
  } else {
    eventsTimelineHtml = `
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div class="text-xs font-black text-slate-900 pb-2 border-b border-slate-100 uppercase tracking-wider flex items-center justify-between">
          <span>Kejadian Pertandingan</span>
          <i class="fa-regular fa-calendar-xmark text-slate-400 text-sm"></i>
        </div>
        <div class="py-8 text-center text-slate-500 text-xs font-medium space-y-1">
          <p class="text-slate-800 font-bold">Belum ada catatan kejadian penting.</p>
          <p class="text-[10px] text-slate-400">Gol, kartu, dan pergantian pemain akan tampil otomatis di sini.</p>
        </div>
        ${matchInfoBadgeHtml}
      </div>
    `;
  }

  document.getElementById('mcontent-summary').innerHTML = eventsTimelineHtml;

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
      if (ev.goals) badges += `<span title="Gol" class="bg-emerald-600 text-white text-[8px] font-black px-1 rounded-full flex items-center gap-0.5 border border-emerald-300 shadow"><i class="fa-solid fa-futbol text-[7px]"></i>${ev.goals > 1 ? ev.goals : ''}</span>`;
      if (ev.penGoals) badges += `<span title="Gol Penalti" class="bg-emerald-600 text-amber-300 text-[8px] font-black px-1 rounded-full flex items-center gap-0.5 border border-amber-300 shadow"><i class="fa-solid fa-circle-dot text-[7px]"></i>${ev.penGoals > 1 ? ev.penGoals : ''}</span>`;
      if (ev.penMiss) badges += `<span title="Penalti Gagal" class="bg-red-600 text-white text-[8px] font-black px-1 rounded-full flex items-center gap-0.5 border border-red-300 shadow"><i class="fa-solid fa-circle-xmark text-[7px]"></i></span>`;
      if (ev.assists) badges += `<span title="Assist" class="bg-blue-600 text-white text-[8px] font-black px-1 rounded-full flex items-center gap-0.5 border border-blue-300 shadow"><i class="fa-solid fa-shoe-prints text-[7px]"></i>${ev.assists > 1 ? ev.assists : ''}</span>`;
      if (ev.yellows) badges += `<div title="Kartu Kuning" class="w-2.5 h-3.5 bg-amber-400 rounded-sm shadow border border-amber-200"></div>`;
      if (ev.reds) badges += `<div title="Kartu Merah" class="w-2.5 h-3.5 bg-red-500 rounded-sm shadow border border-red-200"></div>`;

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
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${borderColor} bg-white overflow-hidden shadow-md flex items-center justify-center">
                    <img src="${PLAIN_PERSON_HEADSHOT}" loading="lazy" class="w-full h-full object-cover" onload="loadMultiTierPlayerPhoto(this, '${pId}', '${pFullName.replace(/'/g, "\\'")}')" onerror="handlePlayerImgError(this, '${pFullName.replace(/'/g, "\\'")}')">
                  </div>
                  <span class="absolute -top-1 -right-1 bg-slate-900 text-white font-black text-[8px] sm:text-[9px] px-1 py-0.2 rounded-full shadow z-10">#${jersey}</span>
                  ${badgeHtml}
                </div>
                <span class="text-[8.5px] sm:text-[9.5px] font-bold text-slate-900 bg-white/95 px-1.5 py-0.5 rounded shadow-sm w-full text-center mt-1 border border-slate-200 leading-tight break-words" title="${pFullName}">${pMultiLine}</span>
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
              <div class="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-300 flex items-center justify-center">
                <img src="${PLAIN_PERSON_HEADSHOT}" loading="lazy" class="w-full h-full object-cover" onload="loadMultiTierPlayerPhoto(this, '${pId}', '${pFullName.replace(/'/g, "\\'")}')" onerror="handlePlayerImgError(this, '${pFullName.replace(/'/g, "\\'")}')">
              </div>
              ${badgeHtml}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start gap-1 leading-tight">
                <span class="text-blue-600 font-black text-xs shrink-0">#${jersey}</span>
                <span class="text-xs font-bold text-slate-800 leading-snug break-words">${pMultiLine}</span>
              </div>
            </div>
          </div>
        `;
      };

      for (let i = 0; i < maxSubs; i++) {
        const hP = homeSubs[i];
        const aP = awaySubs[i];
        subRowsHtml += `
          <div class="flex items-center border-b border-slate-100 last:border-b-0">
            <div class="w-1/2 pr-1.5 border-r border-slate-200">${renderSubItem(hP)}</div>
            <div class="w-1/2 pl-1.5">${renderSubItem(aP)}</div>
          </div>
        `;
      }

      return `
        <div class="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-2 mt-3">
          <div class="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Substitutes</span>
            <span class="text-[10px] text-slate-500 font-normal">Cadangan</span>
          </div>
          <div class="space-y-0.5">
            ${subRowsHtml}
          </div>
        </div>
      `;
    };

    lineupHtml = `
      <div class="space-y-3 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2 text-[10px]">
          <div class="flex items-center gap-1.5 text-blue-700 font-bold">
            <img src="${homeLogo}" loading="lazy" class="w-4 h-4 object-contain">
            <span>${home.team.displayName} (${homeRoster.formation || 'Formasi'})</span>
          </div>
          <div class="flex items-center gap-1.5 text-emerald-700 font-bold">
            <span>(${awayRoster.formation || 'Formasi'}) ${away.team.displayName}</span>
            <img src="${awayLogo}" loading="lazy" class="w-4 h-4 object-contain">
          </div>
        </div>

        <div class="soccer-full-pitch rounded-xl p-1 py-3 flex flex-col justify-between relative">
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
    lineupHtml = `<div class="text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-200"><i class="fa-solid fa-user-slash text-2xl mb-2 block"></i>Susunan pemain resmi belum dirilis oleh official.</div>`;
  }
  document.getElementById('mcontent-lineup').innerHTML = lineupHtml;
}

function switchModalTab(tabName) {
  const tabs = ['summary', 'stats', 'lineup', 'standings', 'h2h'];

  tabs.forEach(t => {
    const btn = document.getElementById(`mtab-${t}`);
    const content = document.getElementById(`mcontent-${t}`);

    if (btn && content) {
      if (t === tabName) {
        btn.className = "flex-1 py-2 px-3 text-[11px] font-extrabold text-white bg-emerald-600 rounded-xl shadow-md transition-all duration-200 whitespace-nowrap";
        content.classList.remove('hidden');
      } else {
        btn.className = "flex-1 py-2 px-3 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-300/50 rounded-xl transition-all duration-200 whitespace-nowrap";
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
