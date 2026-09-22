BGS ScoreHub + Liga 2 Indonesia
================================

Paket ini sudah menambahkan dukungan Liga 2 Indonesia untuk kompetisi
Pegadaian Championship 2026-27.

Struktur folder:
- index.html
- manifest.json
- css/style.css
- css/pitch.css
- js/data.js
- js/odds.js
- js/utils.js
- js/api.js
- js/liga2.js
- js/matches.js
- js/teams.js
- js/standings.js
- js/news.js
- js/modals.js
- js/app.js
- icon-192.png
- icon-512.png

API Liga 2:
https://api-liga-2-indonesia--4piliga2.replit.app/api

Fitur yang ditambahkan:
- Jadwal mendatang, pertandingan live, dan hasil selesai.
- Detail laga dari URL iLeague: kickoff, zona waktu, stadion/lokasi,
  penonton, skor, logo klub, timeline, statistik, lineup, dan perangkat
  pertandingan jika disediakan API.
- Klasemen Grup A dan Grup B.
- Top scorer dengan foto pemain, klub, dan logo klub.
- Liga 2 muncul di filter Semua Liga, modal pilih liga, pencarian,
  tampilan live, favorit, dan tab pertandingan liga.

Catatan:
Versi API yang aktif saat paket dibuat mengembalikan 404 untuk route
/api/liga2Snapshot. File js/liga2.js otomatis memakai fallback ke endpoint
upcoming, live, finished, standings, dan top-scorers, sehingga aplikasi
tetap dapat menampilkan data resmi yang tersedia.