// ODDS DECIMAL & MOVEMENT TRACKER MODULE

// Cache histori Odds per pertandingan
let oddsHistoryCache = JSON.parse(localStorage.getItem('bgs_odds_history') || '{}');

// Format angka ke format desimal (contoh: 1.85, 3.40)
function formatDecimalOdds(val) {
  const num = parseFloat(val);
  if (isNaN(num) || num <= 1) return '1.00';
  return num.toFixed(2);
}

// Rekam Odds ke histori (Pembuka & Live per Menit)
function recordOddsSnapshot(eventId, minute, homeOdds, drawOdds, awayOdds, isOpening = false) {
  if (!eventId) return;
  const idStr = String(eventId);

  if (!oddsHistoryCache[idStr]) {
    oddsHistoryCache[idStr] = {
      opening: null,
      history: []
    };
  }

  const snapshot = {
    minute: minute || '0\'',
    home: formatDecimalOdds(homeOdds),
    draw: formatDecimalOdds(drawOdds),
    away: formatDecimalOdds(awayOdds),
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  };

  if (isOpening && !oddsHistoryCache[idStr].opening) {
    oddsHistoryCache[idStr].opening = snapshot;
  } else if (!isOpening) {
    const lastSnap = oddsHistoryCache[idStr].history[oddsHistoryCache[idStr].history.length - 1];
    
    // Simpan snapshot jika menit berbeda atau nilai Odds berubah
    if (!lastSnap || lastSnap.minute !== snapshot.minute || lastSnap.home !== snapshot.home || lastSnap.away !== snapshot.away) {
      oddsHistoryCache[idStr].history.push(snapshot);
    }
  }

  localStorage.setItem('bgs_odds_history', JSON.stringify(oddsHistoryCache));
}

// Simulasi/Kalkulasi Odds Live berdasarkan kondisi pertandingan (Skor, Menit, Kartu)
function calculateDynamicLiveOdds(baseHome, baseDraw, baseAway, homeScore, awayScore, minuteStr, homeRed = 0, awayRed = 0) {
  let h = parseFloat(baseHome) || 2.10;
  let d = parseFloat(baseDraw) || 3.20;
  let a = parseFloat(baseAway) || 3.40;

  const minute = parseInt(String(minuteStr).replace(/['\s]/g, '')) || 1;
  const scoreDiff = homeScore - awayScore;

  // Penyesuaian berdasarkan selisih gol & sisa waktu
  if (scoreDiff > 0) {
    h = Math.max(1.05, h - (scoreDiff * 0.45) - (minute * 0.01));
    d = d + (scoreDiff * 0.8) + (minute * 0.03);
    a = a + (scoreDiff * 1.5) + (minute * 0.05);
  } else if (scoreDiff < 0) {
    const absDiff = Math.abs(scoreDiff);
    a = Math.max(1.05, a - (absDiff * 0.45) - (minute * 0.01));
    d = d + (absDiff * 0.8) + (minute * 0.03);
    h = h + (absDiff * 1.5) + (minute * 0.05);
  } else {
    // Imbang, Odds Seri semakin mengecil seiring berjalannya waktu
    if (minute > 60) {
      d = Math.max(1.20, d - ((minute - 60) * 0.04));
      h = h + ((minute - 60) * 0.02);
      a = a + ((minute - 60) * 0.02);
    }
  }

  // Pengaruh kartu merah
  if (homeRed > 0) h += (homeRed * 0.7);
  if (awayRed > 0) a += (awayRed * 0.7);

  return {
    home: formatDecimalOdds(h),
    draw: formatDecimalOdds(d),
    away: formatDecimalOdds(a)
  };
}

// Render Tab Odds pada Modal Detail Pertandingan
function renderOddsTabContent(data, eventId) {
  const container = document.getElementById('mcontent-odds');
  if (!container) return;

  const header = data.header?.competitions?.[0];
  const home = header?.competitors?.find(c => c.homeAway === 'home');
  const away = header?.competitors?.find(c => c.homeAway === 'away');

  const homeName = home?.team?.shortDisplayName || home?.team?.displayName || 'Tuan Rumah';
  const awayName = away?.team?.shortDisplayName || away?.team?.displayName || 'Tamu';

  // Ambil data Odds awal dari ESPN API
  const espnOdds = header?.odds?.[0] || {};
  let rawHome = espnOdds.homeTeamOdds?.summary || espnOdds.homeAwayOdds?.home || 2.10;
  let rawAway = espnOdds.awayTeamOdds?.summary || espnOdds.homeAwayOdds?.away || 3.40;
  let rawDraw = espnOdds.drawOdds?.summary || 3.20;

  // Konversi jika data bertipe American Odds (-110, +150, dsb)
  if (typeof rawHome === 'string' && (rawHome.startsWith('+') || rawHome.startsWith('-'))) {
    const americanH = parseInt(rawHome);
    rawHome = americanH > 0 ? (americanH / 100) + 1 : (100 / Math.abs(americanH)) + 1;
  }
  if (typeof rawAway === 'string' && (rawAway.startsWith('+') || rawAway.startsWith('-'))) {
    const americanA = parseInt(rawAway);
    rawAway = americanA > 0 ? (americanA / 100) + 1 : (100 / Math.abs(americanA)) + 1;
  }

  const openingOdds = {
    home: formatDecimalOdds(rawHome),
    draw: formatDecimalOdds(rawDraw),
    away: formatDecimalOdds(rawAway)
  };

  // Simpan Odds pembuka jika belum ada
  recordOddsSnapshot(eventId, '0\'', openingOdds.home, openingOdds.draw, openingOdds.away, true);

  const state = header?.status?.type?.state;
  const minute = header?.status?.type?.shortDetail || '1\'';
  const homeScore = parseInt(home?.score || '0');
  const awayScore = parseInt(away?.score || '0');

  // Hitung Odds Live saat ini
  let currentOdds = openingOdds;
  if (state === 'in') {
    currentOdds = calculateDynamicLiveOdds(openingOdds.home, openingOdds.draw, openingOdds.away, homeScore, awayScore, minute);
    recordOddsSnapshot(eventId, minute, currentOdds.home, currentOdds.draw, currentOdds.away, false);
  }

  const historyData = oddsHistoryCache[String(eventId)] || { opening: openingOdds, history: [] };

  // Generate baris tabel rekam jejak
  let historyRowsHtml = '';
  const allLogs = [historyData.opening, ...historyData.history].filter(Boolean);

  if (allLogs.length > 0) {
    historyRowsHtml = allLogs.map((log, idx) => {
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
  }

  container.innerHTML = `
    <div class="space-y-3.5">
      <!-- CURRENT / LIVE ODDS CARD -->
      <div class="bg-[#180d30] border border-white/10 rounded-3xl p-4 shadow-xl space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-white/10">
          <span class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-chart-line"></i> Odds Desimal (${state === 'in' ? 'Live' : 'Sebelum Laga'})
          </span>
          <span class="text-[10px] text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/10">Pass 1x2</span>
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