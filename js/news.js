// FETCH BERITA SEPAK BOLA ESPN & TERJEMAHAN OTOMATIS

async function fetchESPNNews() {
  const container = document.getElementById('news-container');
  if (!container) return;

  // Tampilkan kontainer berita
  container.classList.remove('hidden');

  container.innerHTML = `
    <div class="py-12 text-center text-xs text-slate-400">
      <i class="fa-solid fa-circle-notch fa-spin text-emerald-400 text-xl mb-2"></i>
      <p>Memuat berita terbaru dari ESPN...</p>
    </div>
  `;

  try {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/all/news');
    const data = await res.json();
    const articles = data.articles || [];

    if (articles.length === 0) {
      container.innerHTML = `<div class="text-center py-10 text-xs text-slate-500">Tidak ada berita ditemukan.</div>`;
      return;
    }

    container.innerHTML = articles.map((item, idx) => `
      <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-3 shadow-md">
        ${item.images?.[0]?.url ? `<img src="${item.images[0].url}" class="w-full h-44 object-cover rounded-xl border border-slate-800" loading="lazy" alt="">` : ''}
        <div>
          <h3 id="news-title-${idx}" class="text-xs sm:text-sm font-bold text-white leading-snug">${item.headline}</h3>
          <p id="news-desc-${idx}" class="text-[11px] text-slate-400 mt-1.5 leading-relaxed">${item.description || ''}</p>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
          <a href="${item.links?.web?.href || '#'}" target="_blank" class="text-emerald-400 font-bold hover:underline flex items-center gap-1">
            Baca di ESPN <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
          </a>
          <button onclick="translateNews(${idx})" id="btn-trans-${idx}" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-semibold transition flex items-center gap-1">
            <i class="fa-solid fa-language text-emerald-400"></i> Terjemahkan
          </button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = `<div class="text-center py-10 text-xs text-red-400">Gagal memuat berita ESPN.</div>`;
  }
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
