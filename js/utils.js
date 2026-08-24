// UTILITY & HELPER FUNCTIONS MODULE

// Unlicensed League Badge SVG Generator
function generateUnlicensedLeagueBadge(leagueId, leagueName = '', country = '') {
  const leagueThemes = {
    'eng.1': { p: '#38003c', s: '#00ff87', text: 'EPL' },
    'esp.1': { p: '#ee1c25', s: '#ffcc00', text: 'LAL' },
    'ita.1': { p: '#002f6c', s: '#00a8b5', text: 'SEA' },
    'ger.1': { p: '#d3010c', s: '#111111', text: 'BUN' },
    'fra.1': { p: '#091c3e', s: '#dae025', text: 'L1' },
    'ned.1': { p: '#ea580c', s: '#ffffff', text: 'ERE' },
    'por.1': { p: '#15803d', s: '#b91c1c', text: 'PRI' },
    'bel.1': { p: '#18181b', s: '#eab308', text: 'PRO' },
    'tur.1': { p: '#dc2626', s: '#ffffff', text: 'TSL' },
    'aut.1': { p: '#c2410c', s: '#ffffff', text: 'OEB' },
    'gre.1': { p: '#1d4ed8', s: '#ffffff', text: 'GSL' },
    'den.1': { p: '#b91c1c', s: '#ffffff', text: 'SUP' },
    'nor.1': { p: '#0284c7', s: '#ef4444', text: 'ELI' },
    'swe.1': { p: '#0284c7', s: '#eab308', text: 'ALL' },
    'cyp.1': { p: '#d97706', s: '#15803d', text: 'CYP' },
    'irl.1': { p: '#15803d', s: '#ea580c', text: 'LOI' },
    'rus.1': { p: '#b91c1c', s: '#1d4ed8', text: 'RPL' },
    'sco.1': { p: '#1e3a8a', s: '#ffffff', text: 'SPFL' },
    'idn.1': { p: '#991b1b', s: '#ffffff', text: 'L1' },
    'ksa.1': { p: '#047857', s: '#f59e0b', text: 'SPL' },
    'jpn.1': { p: '#be123c', s: '#ffffff', text: 'J1' },
    'chn.1': { p: '#b91c1c', s: '#f59e0b', text: 'CSL' },
    'ind.1': { p: '#c2410c', s: '#15803d', text: 'ISL' },
    'tha.1': { p: '#1e3a8a', s: '#b91c1c', text: 'T1' },
    'mys.1': { p: '#1d4ed8', s: '#f59e0b', text: 'MSL' },
    'sgp.1': { p: '#b91c1c', s: '#ffffff', text: 'SPL' },
    'aus.1': { p: '#0284c7', s: '#f59e0b', text: 'ALE' },
    'usa.1': { p: '#1d4ed8', s: '#b91c1c', text: 'MLS' },
    'mex.1': { p: '#15803d', s: '#b91c1c', text: 'LMX' },
    'arg.1': { p: '#0284c7', s: '#ffffff', text: 'ARG' },
    'bra.1': { p: '#15803d', s: '#f59e0b', text: 'BRA' },
    'uefa.champions': { p: '#0f172a', s: '#38bdf8', text: 'UCL' },
    'uefa.europa':    { p: '#c2410c', s: '#f59e0b', text: 'UEL' },
    'fifa.world':     { p: '#1e3a8a', s: '#f59e0b', text: 'WCU' }
  };

  const initials = (leagueName.replace(/[^a-zA-Z0-9\s]/g, '').match(/\b(\w)/g) || ['F','B']).join('').slice(0, 3).toUpperCase();
  const theme = leagueThemes[leagueId] || { p: '#1e293b', s: '#3b82f6', text: initials };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">
    <defs>
      <linearGradient id="grad_${leagueId.replace(/[^a-zA-Z0-9]/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.p}" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <path d="M50 5 L90 20 L90 70 C90 95 50 115 50 115 C50 115 10 95 10 70 L10 20 Z" fill="url(#grad_${leagueId.replace(/[^a-zA-Z0-9]/g, '')})" stroke="${theme.s}" stroke-width="4" />
    <path d="M50 12 L83 24 L83 67 C83 88 50 105 50 105 C50 105 17 88 17 67 L17 24 Z" fill="none" stroke="${theme.s}" stroke-opacity="0.35" stroke-width="1.5" />
    <text x="50" y="58" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">${theme.text}</text>
    <path d="M30 82 L70 82" stroke="${theme.s}" stroke-width="3" stroke-linecap="round" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Format Name for Pitch Cards Line Break
function formatMultiLineName(fullName) {
  if (!fullName) return 'Pemain';
  return fullName.trim().split(' ').filter(Boolean).join('<br>');
}

// Toggle Data Saver Mode
function toggleDataSaver() {
  dataSaverMode = !dataSaverMode;
  localStorage.setItem('bgs_data_saver', JSON.stringify(dataSaverMode));
  updateDataSaverUI();
  loadData(true);
}

// Update Data Saver Button UI
function updateDataSaverUI() {
  const btn = document.getElementById('data-saver-btn');
  const label = document.getElementById('data-saver-label');
  if (!btn || !label) return;
  
  if (dataSaverMode) {
    btn.className = "px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-xl text-emerald-400 transition flex items-center gap-1.5 text-xs font-bold";
    label.innerText = "Hemat Data: ON";
  } else {
    btn.className = "px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 transition flex items-center gap-1.5 text-xs font-bold";
    label.innerText = "Normal";
  }
}

// Resolve Team Logo URL
function getTeamLogo(team) {
  if (dataSaverMode) return PLAIN_SHIELD_LOGO;
  if (!team) return '';
  if (typeof team.logo === 'string' && team.logo !== '') return team.logo;
  if (Array.isArray(team.logos) && team.logos.length > 0) {
    return team.logos[0].href || team.logos[0] || '';
  }
  return '';
}

// Normalize & Clean Player Name
function cleanPlayerName(name) {
  if (!name) return '';
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^[A-Z]\.\s+/, '')
    .trim();
}

// Check Player Name Match Strategy
function isPlayerNameMatching(requestedName, apiPlayerName) {
  if (!requestedName || !apiPlayerName) return false;

  const req = cleanPlayerName(requestedName).toLowerCase().split(' ').filter(Boolean);
  const api = cleanPlayerName(apiPlayerName).toLowerCase().split(' ').filter(Boolean);

  if (req.length === 0 || api.length === 0) return false;

  const reqFirst = req[0];
  const apiFirst = api[0];

  if (reqFirst.length > 1 && apiFirst.length > 1) {
    if (reqFirst !== apiFirst && !apiFirst.startsWith(reqFirst) && !reqFirst.startsWith(apiFirst)) {
      return false;
    }
  }

  const reqLast = req[req.length - 1];
  return api.some(part => part === reqLast || part.includes(reqLast));
}

// Fetch Image Blob and Convert to Base64 String
async function getBase64FromUrl(url) {
  try {
    if (!url || url.startsWith('data:')) return url;
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return url;
  }
}

// Handle Image Load Errors for Player Photos
function handlePlayerImgError(img, pName) {
  img.onerror = null;
  if (pName && !dataSaverMode) {
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=0f172a&color=38bdf8&bold=true`;
  } else {
    img.src = PLAIN_PERSON_HEADSHOT;
  }
}

// Get Country Flag Emoji
function getCountryFlag(country) {
  if (!country) return '🌐';
  const c = country.toLowerCase().trim();
  if (c.includes('england') || c.includes('inggris')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (c.includes('scotland') || c.includes('skotlandia')) return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
  if (c.includes('indonesia')) return '🇮🇩';
  if (c.includes('brazil') || c.includes('brasil')) return '🇧🇷';
  if (c.includes('argentina')) return '🇦🇷';
  if (c.includes('france') || c.includes('prancis')) return '🇫🇷';
  if (c.includes('spain') || c.includes('spanyol')) return '🇪🇸';
  if (c.includes('portugal')) return '🇵🇹';
  if (c.includes('germany') || c.includes('jerman')) return '🇩🇪';
  if (c.includes('italy') || c.includes('italia')) return '🇮🇹';
  if (c.includes('netherlands') || c.includes('belanda')) return '🇳🇱';
  if (c.includes('usa') || c.includes('amerika')) return '🇺🇸';
  if (c.includes('japan') || c.includes('jepang')) return '🇯🇵';
  if (c.includes('saudi')) return '🇸🇦';
  return '🌐';
}

// Get Flag Emoji by League ID
function getLeagueFlag(leagueId) {
  if (typeof LEAGUES === 'undefined') return '';
  const l = LEAGUES.find(item => item.id === leagueId);
  return l && l.flag ? l.flag : '';
}

// Format Date Object to YYYYMMDD String
function getFormattedDate(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    d = new Date();
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Display System Timezone Info
function displayTimezoneInfo() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const el = document.getElementById('user-timezone-info');
    if (el) el.innerText = `Zona HP: ${tz}`;
  } catch(e) {}
}

// Format ISO Date String to Local Human Readable Format
function formatLocalDate(isoDateStr) {
  if (!isoDateStr) return '-';
  const date = new Date(isoDateStr);
  if (isNaN(date.getTime())) return '-';

  const userLang = navigator.language || 'id-ID';
  
  const dayName = date.toLocaleDateString(userLang, { weekday: 'short' });
  const dayNum = date.getDate();
  const monthName = date.toLocaleDateString(userLang, { month: 'short' });
  const timeStr = date.toLocaleTimeString(userLang, { hour: '2-digit', minute: '2-digit', hour12: false });

  return `${dayName}, ${dayNum} ${monthName} • ${timeStr}`;
}

// Render Date Selector Navigation Strip
function renderDateStrip() {
  const container = document.getElementById('date-strip-container');
  if (!container) return;
  container.innerHTML = '';
  
  const today = new Date();
  if (!selectedDateFilter) {
    selectedDateFilter = getFormattedDate(today);
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyymmdd = getFormattedDate(d);
    
    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = months[d.getMonth()];

    let label = `${dayName} ${dateNum} ${monthName}`;
    if (i === 0) label = `Hari Ini (${dateNum} ${monthName})`;
    else if (i === -1) label = `Kemarin (${dateNum} ${monthName})`;
    else if (i === 1) label = `Besok (${dateNum} ${monthName})`;

    const isActive = selectedDateFilter === yyyymmdd;

    const btn = document.createElement('button');
    btn.className = `px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
      isActive ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
    }`;
    btn.innerText = label;
    btn.onclick = () => {
      selectedDateFilter = yyyymmdd;
      renderDateStrip();
      loadData(false);
    };
    container.appendChild(btn);
  }
}
