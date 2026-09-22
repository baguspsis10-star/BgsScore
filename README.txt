BGS ScoreHub + Liga 1 & Liga 2 Indonesia
==========================================

Paket ini sudah menambahkan dukungan Liga 1 Indonesia untuk kompetisi
BRI SUPER LEAGUE 2026-27 dan Liga 2 Indonesia untuk kompetisi Pegadaian
Championship 2026-27.

Struktur folder:
- index.html
- manifest.json
- css/style.css
- css/pitch.css
- js/data.js
- js/odds.js
- js/utils.js
- js/api.js
- js/liga1.js
- js/liga2.js
- js/matches.js
- js/teams.js
- js/standings.js
- js/news.js
- js/modals.js
- js/app.js
- icon-192.png
- icon-512.png

API Liga 1:
https://api-liga-1-indonesia--4piliga1.replit.app/api

API Liga 2:
https://api-liga-2-indonesia--4piliga2.replit.app/api

Fitur yang ditambahkan:
- Jadwal mendatang, pertandingan live, dan hasil selesai untuk Liga 1 dan Liga 2.
- Detail laga iLeague: kickoff, zona waktu, stadion/lokasi,
  penonton, skor, logo klub, timeline, statistik, lineup, dan perangkat
  pertandingan jika disediakan API.
- Klasemen BRI Super League serta Grup A dan Grup B Liga 2.
- Top scorer dan top assist Liga 1, serta top scorer Liga 2.
- Logo klub dan foto pemain dari API iLeague jika tersedia.
- Liga 1 dan Liga 2 muncul di filter Semua Liga, modal pilih liga,
  pencarian, tampilan live, favorit, dan tab pertandingan liga.

Catatan:
File js/liga1.js dan js/liga2.js menggunakan snapshot resmi jika tersedia
dan otomatis memakai fallback ke endpoint kategori (fixtures, live,
standings, top-scorers, dan clubs) jika route snapshot tidak tersedia.