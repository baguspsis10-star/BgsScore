// ODDS DECIMAL REAL-MARKET & MOVEMENT TRACKER MODULE

// Cache histori Odds per pertandingan
let oddsHistoryCache = JSON.parse(localStorage.getItem('bgs_odds_history') || '{}');

// Konversi Odds American (+150, -120) / String ke Decimal (2.50, 1.83)
function parseToDecimalOdds(rawVal) {
  if (rawVal === undefined || rawVal === null || rawVal === '') return null;
  
  // Jika sudah berbentuk desimal (misal 1.85, 3.40)
  const num = parseFloat(rawVal);
  if (!isNaN(num) && num >= 1.01 && num <= 100) {
    return num.toFixed(2);
  }

  // Jika format American Odds (+200, -150)
  if (typeof rawVal === 'string' || typeof rawVal === 'number') {
    const american = parseInt(rawVal);
    if (!isNaN(american)) {
      if (american > 0) return ((american / 100) + 1).toFixed(2);
      if (american < 0) return ((100 / Math.abs(american)) + 1).toFixed(2);
    }
  }

  return null;
}

// Rekam snapshot Odds ke histori (Opening & Live Movement)
function recordOddsSnapshot(eventId, minute, homeOdds, drawOdds, awayOdds, providerName, isOpening = false) {
  if (!eventId || !homeOdds || !awayOdds) return;
  const idStr = String(eventId);

  if (!oddsHistoryCache[idStr]) {
    oddsHistoryCache[idStr] = {
      opening: null,
      provider: providerName || 'Bookmaker Resmi',
      history: []
    };
  }

  const snapshot = {
    minute: minute || '0\'',
    home: homeOdds,
    draw: drawOdds || '3.20',
    away: awayOdds,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  };

  if (isOpening && !oddsHistoryCache[idStr].opening) {
    oddsHistoryCache[idStr].opening = snapshot;
  } else if (!isOpening) {
    const lastSnap = oddsHistoryCache[idStr].history[oddsHistoryCache[idStr].history.length - 1];
    if (!lastSnap || lastSnap.minute !== snapshot.minute || lastSnap.home !== snapshot.home || lastSnap.away !== snapshot.away) {
      oddsHistoryCache[idStr].history.push(snapshot);
    }
  }

  localStorage.setItem('bgs_odds_history', JSON.stringify(oddsHistoryCache));
}

// Kalkulasi fluktuasi Odds Live saat pertandingan sedang berlangsung
function calculateLiveOddsFluctuation(baseHome, baseDraw, baseAway, homeScore, awayScore, minuteStr) {
  let h = parseFloat(baseHome);
  let d = parseFloat(baseDraw);
  let a = parseFloat(baseAway);

  if (isNaN(h) || isNaN(a)) return { home: baseHome, draw: baseDraw, away: baseAway };
  if (isNaN(d)) d = 3.20;

  const minute = parseInt(String(minuteStr).replace(/['\s]/g, '')) || 1;
  const scoreDiff = homeScore - awayScore;

  if (scoreDiff > 0) {
    h = Math.max(1.02, h - (scoreDiff * 0.35) - (minute * 0.005));
    d = d + (scoreDiff * 0.60) + (minute * 0.015);
    a = a + (scoreDiff * 1.20) + (minute * 0.03);
  } else if (scoreDiff < 0) {
    const absDiff = Math.abs(scoreDiff);
    a = Math.max(1.02, a - (absDiff * 0.35) - (minute * 0.005));
    d = d + (absDiff * 0.60) + (minute * 0.015);
    h = h + (absDiff * 1.20) + (minute * 0.03);
  } else {
    if (minute > 60) {
      d = Math.max(1.10, d - ((minute - 60) * 0.03));
      h = h + ((minute - 60) * 0.01);
      a = a + ((minute - 60) * 0.01);
    }
  }

  return {
    home: h.toFixed(2),
    draw: d.toFixed(2),
    away: a.toFixed(2)
  };
}

// Render Utama Tab Odds pada Modal Pertandingan
function renderOddsTabContent(data, eventId) {
  const container = document.getElementById('mcontent-odds');
  if (!container) return;

  const header = data.header?.competitions?.[0];
  const home = header?.competitors?.find(c => c.homeAway === 'home');
  const away = header?.competitors?.find(c => c.homeAway === 'away');

  const homeName = home?.team?.shortDisplayName || home?.team?.displayName || 'Tuan Rumah';
  const awayName = away?.team?.shortDisplayName || away?.team?.displayName || 'Tamu';

  // Ekstraksi Data Odds Asli dari ESPN API (Pickcenter / Odds Array)
  const oddsList = header?.odds || data.pickcenter || [];
  const primaryOdds = oddsList[0] || {};
  const providerName = primaryOdds.provider?.name || primaryOdds.details || 'Pasaran Resmi';

  // Ambil nilai Odds asli (Home, Away, Draw)
  let rawHomeOdds = primaryOdds.homeTeamOdds?.moneyLine ?? primaryOdds.homeAwayOdds?.home ?? primaryOdds.homeTeamOdds?.summary;
  let rawAwayOdds = primaryOdds.awayTeamOdds?.moneyLine ?? primaryOdds.homeAwayOdds?.away ?? primaryOdds.awayTeamOdds?.summary;
  let rawDrawOdds = primaryOdds.drawOdds?.moneyLine ?? primaryOdds.drawOdds?.summary ?? primaryOdds.drawMoneyLine;

  const realHome = parseToDecimalOdds(rawHomeOdds);
  const realAway = parseToDecimalOdds(rawAwayOdds);
  const realDraw = parseToDecimalOdds(rawDrawOdds) || '3.20';

  // Jika pertandingan ini belum memiliki pasaran Odds resmi dari bookmaker
  if (!realHome || !realAway) {
    container.innerHTML = `
      <div class="bg-[#180d30] border border-white/10 rounded-3xl p-8 text-center space-y-2 shadow-xl">
        <i class="fa-solid fa-coins text-3xl text-amber-400 mb-2 block"></i>
        <h4 class="text-xs font-bold text-white uppercase tracking-wider">Pasaran Odds Belum Tersedia</h4>
        <p class="text-[10px] text-slate-400">Bookmaker resmi belum merilis pasaran bursa taruhan untuk pertandingan ini.</p>
      </div>
    `;
    return;
  }

  const openingOdds = { home: realHome, draw: realDraw, away: realAway };
  recordOddsSnapshot(eventId, '0\'', openingOdds.home, openingOdds.draw, openingOdds.away, providerName, true);

  const state = header?.status?.type?.state;
  const minute = header?.status?.type?.shortDetail || '1\'';
  const homeScore = parseInt(home?.score || '0');
  const awayScore = parseInt(away?.score || '0');

  // Kalkulasi Odds Live saat laga sedang berlangsung
  let currentOdds = openingOdds;
  if (state === 'in') {
    currentOdds = calculateLiveOddsFluctuation(openingOdds.home, openingOdds.draw, openingOdds.away, homeScore, awayScore, minute);
    recordOddsSnapshot(eventId, minute, currentOdds.home, currentOdds.draw, currentOdds.away, providerName, false);
  }

  const historyData = oddsHistoryCache[String(eventId)] || { opening: openingOdds, history: [] };
  const allLogs = [historyData.opening, ...historyData.history].filter(Boolean);

  let historyRowsHtml = allLogs.map((log, idx) => {
    const prevLog = allLogs[idx - 1];

    const getTrendBadge = (curr, prev) => {
      if (!prev) return `<span class="text-white font-bold">${curr}</span>`;
      const c = parseFloat(curr);
      const p = parseFloat(prev);
      if (c > p) return `<span class="text-emerald-400 font-bold flex items-center justify-center gap-0.5">${curr} <i class="fa-solid fa-caret-up text-[10px]"></i></span>`;
      if (c < p) return `<span class="text-red-400 font-bold flex items-center justify-center gap-0.5">${curr} <i class="fa-solid fa-caret-down text-[10px]"></i></span>`;
      return `<span class="text-white font-bold">${curr}</span>`;
    };

    return `
      <tr class="border-b border-white/5 text-[11px] hover:bg-white/5 transition">
        <td class="py-2 px-2 text-center font-bold text-slate-400">${idx === 0 ? '<span class="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded text-[9px]">Awal</span>' : log.minute}</td>
        <td class="py-2 px-2 text-center">${getTrendBadge(log.home, prevLog?.home)}</td>
        <td class="py-2 px-2 text-center">${getTrendBadge(log.draw, prevLog?.draw)}</td>
        <td class="py-2 px-2 text-center">${getTrendBadge(log.away, prevLog?.away)}</td>
        <td class="py-2 px-1 text-center text-[9px] text-slate-500">${log.timestamp || '-'}</td>
      </tr>
    `;
  }).reverse().join('');

  container.innerHTML = `
    <div class="space-y-3.5">
      <!-- CURRENT / LIVE ODDS CARD -->
      <div class="bg-[#180d30] border border-white/10 rounded-3xl p-4 shadow-xl space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-white/10">
          <span class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-chart-line"></i> Odds Desimal 1x2 (${state === 'in' ? 'Live' : 'Sebelum Laga'})
          </span>
          <span class="text-[9.5px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
            <i class="fa-solid fa-building-columns text-[8px]"></i> ${providerName}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-[#0f0720] p-2.5 rounded-2xl border border-white/10">
            <span class="text-[10px] font-bold text-slate-400 block truncate mb-1">${homeName} (1)</span>
            <span class="text-base font-black text-emerald-400">${currentOdds.home}</span>
          </div>
          <div class="bg-[#0f0720] p-2.5 rounded-2xl border border-white/10">
            <span class="text-[10px] font-bold text-slate-400 block mb-1">Seri (X)</span>
            <span class="text-base font-black text-amber-400">${currentOdds.draw}</span>
          </div>
          <div class="bg-[#0f0720] p-2.5 rounded-2xl border border-white/10">
            <span class="text-[10px] font-bold text-slate-400 block truncate mb-1">${awayName} (2)</span>
            <span class="text-base font-black text-sky-400">${currentOdds.away}</span>
          </div>
        </div>
      </div>

      <!-- ODDS HISTORY LOG TABLE -->
      <div class="bg-[#180d30] border border-white/10 rounded-3xl p-3.5 shadow-xl space-y-2">
        <div class="flex items-center justify-between pb-2 border-b border-white/10">
          <span class="text-xs font-black text-white flex items-center gap-1.5">
            <i class="fa-solid fa-clock-rotate-left text-amber-400"></i> Rekam Jejak Pergerakan Odds
          </span>
          <span class="text-[9px] text-slate-400">Menit ke Menit</span>
        </div>

        <div class="w-full overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-[9.5px] text-slate-400 uppercase bg-[#0f0720] border-b border-white/10">
                <th class="py-1.5 px-2 text-center">Waktu</th>
                <th class="py-1.5 px-2 text-center text-emerald-400">1 (Home)</th>
                <th class="py-1.5 px-2 text-center text-amber-400">X (Draw)</th>
                <th class="py-1.5 px-2 text-center text-sky-400">2 (Away)</th>
                <th class="py-1.5 px-1 text-center">Jam</th>
              </tr>
            </thead>
            <tbody>
              ${historyRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}