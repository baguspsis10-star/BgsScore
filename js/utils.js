// ==========================================
// UTILS & HELPER FUNCTIONS MODULE
// ==========================================

// Global Constants & Image Fallbacks
const PLAIN_SHIELD_LOGO = 'https://a.espncdn.com/i/teamlogos/default-team-logo.png';
const PLAIN_PERSON_HEADSHOT = 'https://a.espncdn.com/i/headshots/nopic-headshot.png';

// In-Memory Caches
const leagueLogoCache = {};
const playerPhotoCache = {};

// Fallback Cache Helpers
async function getPhotoFromCache(key) { return null; }
async function savePhotoToCache(key, url) { return true; }

// Date & Time Formatting
function getFormattedDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatLocalDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Satuan Tinggi (Feet/Inches -> CM)
function formatHeightCm(heightStr) {
  if (!heightStr || heightStr === '-') return '-';
  const str = String(heightStr).trim();
  if (str.toLowerCase().includes('cm')) return str;
  if (str.includes("'")) {
    const parts = str.split("'");
    const feet = parseFloat(parts[0]) || 0;
    const inches = parseFloat(parts[1]?.replace('"', '')) || 0;
    return `${Math.round((feet * 30.48) + (inches * 2.54))} cm`;
  }
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  return num < 100 ? `${Math.round(num * 2.54)} cm` : `${Math.round(num)} cm`;
}

// Satuan Berat (Lbs -> KG)
function formatWeightKg(weightStr) {
  if (!weightStr || weightStr === '-') return '-';
  const str = String(weightStr).trim();
  if (str.toLowerCase().includes('kg')) return str;
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  return (str.toLowerCase().includes('lb') || num > 120) 
    ? `${Math.round(num * 0.453592)} kg` 
    : `${Math.round(num)} kg`;
}

// Konversi Odds American/Moneyline ke Desimal
function convertToDecimalOdds(americanOdds) {
  if (!americanOdds) return null;
  const num = parseFloat(americanOdds);
  if (isNaN(num)) return americanOdds;
  if (num > 0) return ((num / 100) + 1).toFixed(2);
  return ((100 / Math.abs(num)) + 1).toFixed(2);
}

// Algoritma Penilaian Rating Pemain (Base 6.0)
function calculatePlayerRating(evStats) {
  if (!evStats) return '6.5';
  let rating = 6.0;

  rating += (evStats.goals || 0) * 1.5;
  rating += (evStats.assists || 0) * 0.8;
  rating += (evStats.penGoals || 0) * 1.0;
  rating -= (evStats.penMiss || 0) * 1.2;
  rating -= (evStats.yellows || 0) * 0.6;
  rating -= (evStats.reds || 0) * 2.2;

  rating = Math.min(10.0, Math.max(3.0, rating));
  return rating.toFixed(1);
}

// Text & Image Helpers
function cleanPlayerName(pName) {
  if (!pName) return '';
  return pName.trim();
}

function formatMultiLineName(pName) {
  if (!pName) return '';
  const parts = pName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]}<br>${parts.slice(1).join(' ')}`;
}

function getTeamLogo(teamObj) {
  if (!teamObj) return PLAIN_SHIELD_LOGO;
  if (teamObj.logo) return teamObj.logo;
  if (teamObj.logos && teamObj.logos[0]?.href) return teamObj.logos[0].href;
  if (teamObj.id) return `https://a.espncdn.com/i/teamlogos/soccer/500/${teamObj.id}.png`;
  return PLAIN_SHIELD_LOGO;
}

function generateUnlicensedLeagueBadge(leagueId, name, country = '') {
  const code = (name || leagueId || 'LG').substring(0, 3).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(code)}&background=180d30&color=22c55e&bold=true&rounded=true&size=128`;
}
