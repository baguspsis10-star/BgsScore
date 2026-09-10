// FETCH BERITA SEPAK BOLA ESPN, FILTER KATEGORI, PAGINASI & TERJEMAHAN OTOMATIS

let allNewsArticles = [];
let displayedNewsCount = 0;
const NEWS_PER_PAGE = 10;
let currentNewsCategory = 'all';

const NEWS_CATEGORIES = [
  { id: 'all', name: 'Semua', icon: 'fa-globe' },
  { id: 'eng.1', name: 'Premier League', icon: 'fa-trophy' },
  { id: 'uefa.champions', name: 'UCL', icon: 'fa-star' },
  { id: 'esp.1', name: 'La Liga', icon: 'fa-trophy' },
  { id: 'ita.1', name: 'Serie A', icon: 'fa-trophy' },
  { id: 'idn.1', name: 'Liga 1 IDN', icon: 'fa-flag' }
];

async function fetchESPNNews(forceRefresh = false) {
  const container = document.getElementById('news-container');
  if (!container) return;

  container.classList.remove('hidden');

  // Pasang baris filter kategori di paling atas jika belum ada
  if (!document.getElementById('news-category-bar')) {
    renderNewsCategoryFilter(container);
  } else {
    updateCategoryFilterButtons();
  }

  const listContainer = document.getElementById('news-list-wrapper');
  if (!listContainer) return;

  if (!forceRefresh && allNewsArticles.length > 0) {
    return;
  }

  listContainer.innerHTML = `
    <div class="py-12 text-center text-xs text-slate-400 space-y-2">
      <i class="fa-solid fa-circle-notch fa-spin text-emerald-400 text-2xl"></i>
      <p class="font-medium">Memuat berita kategori...</p>
    </div>
  `;

  let articles = [];
  const primaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${currentNewsCategory}/news?limit=50`;

  try {
    const res = await fetch(primaryUrl);
    if (res.ok) {
      const data = await res.json();
      articles = data.articles || [];
    }
  } catch (e) {
    console.warn("Gagal fetch news dari:", primaryUrl);
  }

  // Fallback ke 'all' jika kategori spesifik kosong/gagal
  if (articles.length === 0 && currentNewsCategory !== 'all') {
    try {
      const fallbackRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/all/news?limit=50');
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        articles = fallbackData.articles || [];
      }
    } catch (e) {}
  }

  allNewsArticles = articles;

  if (allNewsArticles.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-12 text-slate-500 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs space-y-2">
        <i class="fa-solid fa-newspaper text-2xl text-slate-600 block"></i>
        <p>Belum ada berita terbaru untuk kategori ini.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = `
    <div id="news-list" class="space-y-3"></div>
    <div id="news-pagination-container" class="pt-2 text-center"></div>
  `;

  displayedNewsCount = 0;
  renderNewsBatch();
}

// Render Strip Filter Kategori Berita
function renderNewsCategoryFilter(parentContainer) {
  const filterBar = document.createElement('div');
  filterBar.id = 'news-category-bar';
  filterBar.className = 'flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-3';

  filterBar.innerHTML = NEWS_CATEGORIES.map(cat => `
    <button id="cat-btn-${cat.id}" onclick="switchNewsCategory('${cat.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
      currentNewsCategory === cat.id 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 border border-emerald-500/50' 
        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
    }">
      <i class="fa-solid ${cat.icon} text-[10px] ${currentNewsCategory === cat.id ? 'text-white' : 'text-emerald-400'}"></i>
      ${cat.name}
    </button>
  `).join('');

  const listWrapper = document.createElement('div');
  listWrapper.id = 'news-list-wrapper';

  parentContainer.innerHTML = '';
  parentContainer.appendChild(filterBar);
  parentContainer.appendChild(listWrapper);
}

// Update Highlight Tombol Filter
function updateCategoryFilterButtons() {
  NEWS_CATEGORIES.forEach(cat => {
    const btn = document.getElementById(`cat-btn-${cat.id}`);
    if (!btn) return;
    const isActive = currentNewsCategory === cat.id;

    btn.className = `px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
      isActive 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 border border-emerald-500/50' 
        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
    }`;
    
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = `fa-solid ${cat.icon} text-[10px] ${isActive ? 'text-white' : 'text-emerald-400'}`;
    }
  });
}

// Switch Kategori Berita
function switchNewsCategory(catId) {
  if (currentNewsCategory === catId) return;
  currentNewsCategory = catId;
  allNewsArticles = [];
  displayedNewsCount = 0;
  fetchESPNNews(true);
}

// Render Batch 10 Berita
function renderNewsBatch() {
  const listEl = document.getElementById('news-list');
  const pagEl = document.getElementById('news-pagination-container');
  if (!listEl) return;

  const nextBatch = allNewsArticles.slice(displayedNewsCount, displayedNewsCount + NEWS_PER_PAGE);

  nextBatch.forEach((item, batchIdx) => {
    const globalIdx = displayedNewsCount + batchIdx;
    const formattedDate = formatNewsDate(item.published || item.lastModified);

    const card = document.createElement('div');
    card.className = "bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-3 shadow-md";
    card.innerHTML = `
      ${item.images?.[0]?.url ? `<img src="${item.images[0].url}" class="w-full h-44 object-cover rounded-xl border border-slate-800" loading="lazy" alt="" onerror="this.style.display='none'">` : ''}
      <div>
        <div class="flex items-center justify-between gap-2 text-[10px] text-slate-400 mb-1.5">
          <span class="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-md">
            <i class="fa-solid fa-newspaper text-[9px] mr-1"></i>ESPN News
          </span>
          ${formattedDate ? `<span class="flex items-center gap-1 text-slate-400"><i class="fa-regular fa-clock text-[9px]"></i> ${formattedDate}</span>` : ''}
        </div>
        <h3 id="news-title-${globalIdx}" class="text-xs sm:text-sm font-bold text-white leading-snug">${item.headline}</h3>
        <p id="news-desc-${globalIdx}" class="text-[11px] text-slate-400 mt-1.5 leading-relaxed">${item.description || ''}</p>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
        <a href="${item.links?.web?.href || '#'}" target="_blank" rel="noopener" class="text-emerald-400 font-bold hover:underline flex items-center gap-1">
          Baca di ESPN <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
        </a>
        <button onclick="translateNews(${globalIdx})" id="btn-trans-${globalIdx}" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-semibold transition flex items-center gap-1">
          <i class="fa-solid fa-language text-emerald-400"></i> Terjemahkan
        </button>
      </div>
    `;
    listEl.appendChild(card);
  });

  displayedNewsCount += nextBatch.length;

  if (pagEl) {
    if (displayedNewsCount < allNewsArticles.length) {
      pagEl.innerHTML = `
        <button onclick="renderNewsBatch()" class="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 hover:border-emerald-500 rounded-xl font-bold text-xs transition shadow-lg flex items-center justify-center gap-2 mx-auto active:scale-95">
          <i class="fa-solid fa-arrows-rotate"></i> Muat Berita Lainnya (${allNewsArticles.length - displayedNewsCount} tersisa)
        </button>
      `;
    } else {
      pagEl.innerHTML = `
        <p class="text-[11px] text-slate-500 font-medium py-2">Semua berita terbaru telah ditampilkan.</p>
      `;
    }
  }
}

// Format Tanggal dan Jam
function formatNewsDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const dateFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeFormatted = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dateFormatted} • ${timeFormatted} WIB`;
}

// FUNGSI PENERJEMAH (MyMemory Free API)
async function translateNews(idx) {
  const titleEl = document.getElementById(`news-title-${idx}`);
  const descEl = document.getElementById(`news-desc-${idx}`);
  const btnEl = document.getElementById(`btn-trans-${idx}`);

  if (!titleEl || !btnEl) return;

  btnEl.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-emerald-400"></i> Menerjemahkan...`;
  btnEl.disabled = true;

  try {
    const textToTranslate = `${titleEl.innerText} ||| ${descEl ? descEl.innerText : ''}`;
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|id`);
    const data = await res.json();

    if (data.responseData?.translatedText) {
      const parts = data.responseData.translatedText.split('|||');
      if (parts[0]) titleEl.innerText = parts[0].trim();
      if (parts[1] && descEl) descEl.innerText = parts[1].trim();

      btnEl.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> Diterjemahkan`;
      btnEl.className = "px-2.5 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 rounded-lg font-semibold text-[11px]";
    }
  } catch (e) {
    btnEl.innerHTML = `<i class="fa-solid fa-language text-emerald-400"></i> Coba Lagi`;
    btnEl.disabled = false;
  }
}
