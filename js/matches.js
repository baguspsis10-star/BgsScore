// MATCHES & MATCH CARDS MODULE

// Check if Match is Favorited
function isFavorite(eventId) {
  return favoriteMatches.some(id => String(id) === String(eventId));
}

// Toggle Favorite State for a Match
function toggleFavorite(eventId, e) {
  if (e) e.stopPropagation();
  const idStr = String(eventId);
  if (isFavorite(idStr)) {
    favoriteMatches = favoriteMatches.filter(id => String(id) !== idStr);
  } else {
    favoriteMatches.push(idStr);
  }
  localStorage.setItem('bgs_favorites', JSON.stringify(favoriteMatches));
  loadData(true);
}

// Sort Events Prioritizing Favorite Teams, Favorite Matches, and Date
function sortEventsByFavoriteAndDate(events) {
  return events.sort((a, b) => {
    const compA = a.competitions?.[0];
    const compB = b.competitions?.[0];

    const aHasFavTeam = compA?.competitors?.some(c => isTeamFavorite(c.team?.id)) ? 1 : 0;
    const bHasFavTeam = compB?.competitors?.some(c => isTeamFavorite(c.team?.id)) ? 1 : 0;

    if (bHasFavTeam !== aHasFavTeam) return bHasFavTeam - aHasFavTeam;

    const aFavMatch = isFavorite(a.id) ? 1 : 0;
    const bFavMatch = isFavorite(b.id) ? 1 : 0;
    if (bFavMatch !== aFavMatch) return bFavMatch - aFavMatch;

    return new Date(a.date) - new Date(b.date);
  });
}

// Monitor Live Favorite Events to Trigger Sounds and Push Notifications
function monitorLiveFavoriteEvents(event) {
  const eventId = String(event.id);
  const comp = event.competitions?.[0];
  if (!comp) return;

  const home = comp.competitors?.find(c => c.homeAway === 'home');
  const away = comp.competitors?.find(c => c.homeAway === 'away');

  const isFavTeamMatch = isTeamFavorite(home?.team?.id) || isTeamFavorite(away?.team?.id);
  const isFavMatch = isFavorite(eventId);

  if (!isFavTeamMatch && !isFavMatch) return;

  const matchName = `${home?.team?.shortDisplayName || 'Home'} vs ${away?.team?.shortDisplayName || 'Away'}`;
  const homeScore = parseInt(home?.score || '0');
  const awayScore = parseInt(away?.score || '0');
  const totalScore = homeScore + awayScore;

  const state = event.status?.type?.state; 
  const period = event.status?.period || 0;
  const detailStr = (event.status?.type?.shortDetail || event.status?.type?.description || '').toLowerCase();

  const hasLineup = Boolean(comp.rostersAvailable || (event.rosters && event.rosters.length >= 2));

  let corners = 0, yellows = 0, reds = 0;
  [home, away].forEach(team => {
    if (team?.statistics) {
      team.statistics.forEach(s => {
        const name = (s.name || s.label || '').toLowerCase();
        if (name.includes('corner')) corners += parseInt(s.displayValue || s.value || 0);
        if (name.includes('yellowcard')) yellows += parseInt(s.displayValue || s.value || 0);
        if (name.includes('redcard')) reds += parseInt(s.displayValue || s.value || 0);
      });
    }
  });

  const prev = matchStateCache[eventId];

  if (prev) {
    if (totalScore > prev.totalScore) {
      recentGoalCache[eventId] = Date.now();
      if (soundSettings.goal) {
        playEventSound('goal');
        sendPushNotification(`⚽ GOL! (${matchName})`, `Skor saat ini: ${homeScore} - ${awayScore}`);
      }
    }

    if (!prev.hasLineup && hasLineup) {
      if (soundSettings.lineup) {
        sendPushNotification(`📋 Lineup Dirilis!`, `Susunan pemain untuk ${matchName} sudah dirilis.`);
      }
    }

    if (prev.state === 'pre' && state === 'in' && period === 1) {
      if (soundSettings.kickoff1) {
        playEventSound('kickoff1');
        sendPushNotification(`🏁 Kick-off Babak 1`, `Pertandingan ${matchName} telah dimulai!`);
      }
    }

    if (prev.period === 1 && (detailStr.includes('ht') || detailStr.includes('half')) && !prev.isHT) {
      if (soundSettings.halftime) {
        playEventSound('halftime');
        sendPushNotification(`⏸ Babak 1 Selesai (HT)`, `Skor babak pertama ${matchName}: ${homeScore} - ${awayScore}`);
      }
    }

    if (prev.isHT && state === 'in' && period === 2) {
      if (soundSettings.kickoff2) {
        playEventSound('kickoff2');
        sendPushNotification(`▶ Kick-off Babak 2`, `Babak kedua ${matchName} telah dimulai!`);
      }
    }

    if (prev.state === 'in' && state === 'post') {
      if (soundSettings.fulltime) {
        playEventSound('fulltime');
        sendPushNotification(`🔚 Pertandingan Selesai (FT)`, `Hasil akhir ${matchName}: ${homeScore} - ${awayScore}`);
      }
    }

    if (corners > prev.corners) {
      if (soundSettings.corner) {
        playEventSound('corner');
        sendPushNotification(`🚩 Tendangan Sudut (Corner)`, `Terjadi corner pada laga ${matchName}`);
      }
    }

    if (yellows > prev.yellows) {
      if (soundSettings.yellow) {
        playEventSound('yellow');
        sendPushNotification(`🟨 Kartu Kuning`, `Kartu kuning diberikan pada laga ${matchName}`);
      }
    }

    if (reds > prev.reds) {
      if (soundSettings.red) {
        playEventSound('red');
        sendPushNotification(`🟥 Kartu Merah`, `Kartu merah dikeluarkan pada laga ${matchName}`);
      }
    }
  }

  matchStateCache[eventId] = { 
    state, period, isHT: detailStr.includes('ht') || detailStr.includes('half'), homeScore, awayScore, totalScore, corners, yellows, reds, hasLineup 
  };
}

// Render Match Cards dengan Visual Dynamic Warna Spesifik
function renderMatchesCards(targetContainerId, events, showLeagueBadge = false, customVariant = null) {
  const container = document.getElementById(targetContainerId);
  if (!container) return;
  container.innerHTML = '';

  if (events.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-slate-500 border border-slate-800/40 rounded-2xl bg-slate-900/30 text-xs backdrop-blur">
        Tidak ada pertandingan.
      </div>
    `;
    return;
  }

  const sortedEvents = sortEventsByFavoriteAndDate([...events]);

  sortedEvents.forEach(event => {
    const comp = event.competitions[0];
    const home = comp.competitors.find(c => c.homeAway === 'home');
    const away = comp.competitors.find(c => c.homeAway === 'away');
    
    // Fallback Image Handler (Mencegah Gambar Pecah)
    const homeLogo = getTeamLogo(home?.team) || PLAIN_SHIELD_LOGO;
    const awayLogo = getTeamLogo(away?.team) || PLAIN_SHIELD_LOGO;

    const homeFav = isTeamFavorite(home?.team?.id);
    const awayFav = isTeamFavorite(away?.team?.id);
    const hasFavTeam = homeFav || awayFav;

    const state = event.status.type.state; 
    const isPre = state === 'pre';
    const isLive = state === 'in';
    const liveMinuteText = event.status?.type?.shortDetail || 'LIVE';
    
    const formattedTime = formatLocalDate(event.date);
    const favorited = isFavorite(event.id);

    const eventIdStr = String(event.id);
    const hasRecentGoal = recentGoalCache[eventIdStr] && ((Date.now() - recentGoalCache[eventIdStr]) < 30000);

    // KONTROL SKOR / VS: Jika BELUM MULAI (pre), Tampil Badge VS
    let scoreDisplay = isPre 
      ? `<span class="text-[11px] font-black tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 shadow-inner">VS</span>`
      : `<span class="text-xs sm:text-sm font-black tracking-tight ${hasRecentGoal ? 'goal-active-pulse px-2 py-0.5 rounded-lg' : 'text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80'} whitespace-nowrap">${home?.score ?? '0'} - ${away?.score ?? '0'}</span>`;

    // PENENTUAN KELAS CSS SESUAI WARNA SPESIFIK:
    // 1. Selesai Favorit  => card-fav-finished (Cyan/Biru)
    // 2. Mendatang Favorit => card-fav-upcoming (Emas/Kuning)
    // 3. Live             => card-live (Merah)
    // 4. Mendatang        => card-upcoming (Biru)
    // 5. Selesai          => card-finished (Hijau)
    let cardStyleClass = 'card-upcoming';

    if (customVariant === 'finished-fav') {
      cardStyleClass = 'card-fav-finished';
    } else if (customVariant === 'upcoming-fav' || ((hasFavTeam || favorited) && isPre)) {
      cardStyleClass = 'card-fav-upcoming';
    } else if (isLive) {
      cardStyleClass = 'card-live';
    } else if (isPre) {
      cardStyleClass = 'card-upcoming';
    } else {
      cardStyleClass = 'card-finished';
    }

    const card = document.createElement('div');
    card.className = `p-3.5 rounded-2xl transition-all duration-150 cursor-pointer relative shadow-sm ${cardStyleClass}`;
    
    card.onclick = (e) => {
      e.stopPropagation();
      openMatchDetail(event.leagueId || 'idn.1', event.id, event.leagueName || 'Detail');
    };

    card.innerHTML = `
      <!-- TOP BADGE BAR -->
      <div class="flex items-center justify-between text-[11px] text-slate-400 mb-2.5 gap-2">
        <div class="flex items-center gap-1.5 flex-1 min-w-0">
          ${hasFavTeam ? '<span class="text-[8.5px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-black tracking-wider shrink-0 flex items-center gap-1"><i class="fa-solid fa-star text-[7px]"></i>FAVORIT</span>' : ''}
          ${showLeagueBadge ? `<span class="text-[9.5px] bg-slate-800/80 border border-slate-700/50 text-slate-300 px-2 py-0.5 rounded-md truncate max-w-[140px] font-medium">${event.leagueFlag ? event.leagueFlag + ' ' : ''}${event.leagueName || ''}</span>` : ''}
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="toggleFavorite('${event.id}', event)" class="p-1 hover:scale-125 transition text-xs" title="Favorit">
            <i class="${favorited ? 'fa-solid fa-star text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 'fa-regular fa-star text-slate-500 hover:text-amber-400'}"></i>
          </button>
          <span class="text-[9.5px] bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/60 px-2 py-0.5 rounded-lg text-slate-300 font-bold flex items-center gap-1 transition">Detail <i class="fa-solid fa-chevron-right text-[7px] text-slate-400"></i></span>
        </div>
      </div>

      <!-- MAIN TEAMS & SCORE BLOCK -->
      <div class="flex items-center justify-between gap-1.5 pt-0.5">
        <!-- HOME TEAM -->
        <div class="flex items-center gap-2.5 w-[36%] min-w-0">
          <div class="w-7 h-7 sm:w-8 sm:h-8 p-0.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
            <img src="${homeLogo}" loading="lazy" class="w-full h-full object-contain shrink-0" alt="" onerror="this.onerror=null; this.src='${PLAIN_SHIELD_LOGO}';">
          </div>
          <span class="font-bold text-xs truncate leading-tight text-slate-100 flex items-center gap-1">
            <span class="truncate">${home?.team?.shortDisplayName || ''}</span>
            ${homeFav ? '<i class="fa-solid fa-star text-amber-400 text-[8px] shrink-0"></i>' : ''}
          </span>
        </div>

        <!-- SCORE / VS & STATUS -->
        <div class="w-[28%] shrink-0 flex flex-col items-center justify-center text-center">
          ${scoreDisplay}
          <span class="mt-2 text-[9.5px] font-semibold text-slate-400 flex items-center justify-center gap-1 whitespace-nowrap">
            <i class="fa-regular fa-clock text-[9px] text-emerald-400 shrink-0"></i>
            <span class="${isLive ? 'text-red-400 font-bold animate-pulse' : 'text-slate-300'}">${isLive ? liveMinuteText : formattedTime}</span>
          </span>
        </div>

        <!-- AWAY TEAM -->
        <div class="flex items-center justify-end gap-2.5 w-[36%] min-w-0 text-right">
          <span class="font-bold text-xs truncate leading-tight text-slate-100 flex items-center justify-end gap-1">
            ${awayFav ? '<i class="fa-solid fa-star text-amber-400 text-[8px] shrink-0"></i>' : ''}
            <span class="truncate">${away?.team?.shortDisplayName || ''}</span>
          </span>
          <div class="w-7 h-7 sm:w-8 sm:h-8 p-0.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
            <img src="${awayLogo}" loading="lazy" class="w-full h-full object-contain shrink-0" alt="" onerror="this.onerror=null; this.src='${PLAIN_SHIELD_LOGO}';">
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}
