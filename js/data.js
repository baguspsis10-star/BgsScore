// DATA, CONSTANTS, & GLOBAL STATE MODULE

const LEAGUES = [
  // International / FIFA
  { id: 'fifa.world', name: "FIFA World Cup", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.wwc', name: "FIFA Women's World Cup", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.world.u20', name: "FIFA Under-20 World Cup", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.world.u17', name: "FIFA Under-17 World Cup", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.wworld.u17', name: "FIFA Under-17 Women's World Cup", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.cwc', name: "FIFA Club World Cup", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/c8mhhf1548325850.png", category: "Internasional" },
  { id: 'fifa.friendly', name: "International Friendly", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.friendly.w', name: "Women's International Friendly", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.friendly_u21', name: "Under-21 International Friendly", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.u20.friendly', name: "International U20 Friendly", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.shebelieves', name: "SheBelieves Cup", country: "Internasional", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.w.champions_cup', name: "FIFA Women's Champions Cup", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.intercontinental_cup', name: "FIFA Intercontinental Cup", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.olympics', name: "Men's Olympic Soccer Tournament", country: "Internasional", flag: "🏅", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.w.olympics', name: "Women's Olympic Soccer Tournament", country: "Internasional", flag: "🏅", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.worldq', name: "World Cup Qualifying", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.worldq.uefa', name: "FIFA World Cup Qualifying - UEFA", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Internasional" },
  { id: 'fifa.worldq.caf', name: "FIFA World Cup Qualifying - CAF", country: "Afrika", flag: "🌍", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.worldq.afc', name: "FIFA World Cup Qualifying - AFC", country: "Asia", flag: "🌏", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.worldq.concacaf', name: "FIFA World Cup Qualifying - Concacaf", country: "Amerika", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.worldq.conmebol', name: "FIFA World Cup Qualifying - CONMEBOL", country: "Amerika", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.worldq.ofc', name: "FIFA World Cup Qualifying - OFC", country: "Oceania", flag: "🌊", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.wwcq.ply', name: "FIFA Women's World Cup Qualifying - Playoff", country: "Internasional", flag: "🌐", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'fifa.wworldq.uefa', name: "FIFA Women's World Cup Qualifying - UEFA", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Internasional" },

  // UEFA
  { id: 'uefa.champions', name: "UEFA Champions League", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/83ip001680100782.png", category: "Piala/kompetisi" },
  { id: 'uefa.champions_qual', name: "UEFA Champions League Qualifying", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/83ip001680100782.png", category: "Piala/kompetisi" },
  { id: 'uefa.europa', name: "UEFA Europa League", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/2d3n2k1680100806.png", category: "Piala/kompetisi" },
  { id: 'uefa.europa_qual', name: "UEFA Europa League Qualifying", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/2d3n2k1680100806.png", category: "Piala/kompetisi" },
  { id: 'uefa.europa.conf', name: "UEFA Conference League", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/4v7s941680100827.png", category: "Piala/kompetisi" },
  { id: 'uefa.europa.conf_qual', name: "UEFA Conference League Qualifying", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/4v7s941680100827.png", category: "Piala/kompetisi" },
  { id: 'uefa.super_cup', name: "UEFA Super Cup", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Piala/kompetisi" },
  { id: 'uefa.wchampions', name: "UEFA Women's Champions League", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Piala/kompetisi" },
  { id: 'uefa.euro', name: "UEFA European Championship", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/6t2i5w1534346927.png", category: "Internasional" },
  { id: 'uefa.euroq', name: "UEFA European Championship Qualifying", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Internasional" },
  { id: 'uefa.weuro', name: "UEFA Women's European Championship", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Internasional" },
  { id: 'uefa.euro_u21', name: "UEFA European Under-21 Championship", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Internasional" },
  { id: 'uefa.euro_u21_qual', name: "UEFA European Under-21 Championship Qualifying", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Internasional" },
  { id: 'uefa.euro.u19', name: "UEFA European Under-19 Championship", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Internasional" },
  { id: 'uefa.nations', name: "UEFA Nations League", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/7l0pvn1538304918.png", category: "Internasional" },
  { id: 'uefa.w.nations', name: "UEFA Women's Nations League", country: "Eropa", flag: "🇪🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/7l0pvn1538304918.png", category: "Internasional" },

  // England
  { id: 'eng.1', name: "English Premier League", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/3v933i1680099716.png", category: "Eropa" },
  { id: 'eng.2', name: "English Championship", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/9f3upr1680099738.png", category: "Eropa" },
  { id: 'eng.3', name: "English League One", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/3t87761680099757.png", category: "Eropa" },
  { id: 'eng.4', name: "English League Two", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/e0l07b1680099778.png", category: "Eropa" },
  { id: 'eng.5', name: "English National League", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/5k83571534347712.png", category: "Eropa" },
  { id: 'eng.fa', name: "English FA Cup", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Piala/kompetisi" },
  { id: 'eng.league_cup', name: "English Carabao Cup", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'eng.trophy', name: "English EFL Trophy", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'eng.charity', name: "English FA Community Shield", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Piala/kompetisi" },
  { id: 'eng.asia_trophy', name: "Premier League Asia Trophy", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/3v933i1680099716.png", category: "Piala/kompetisi" },
  { id: 'eng.w.1', name: "English Women's Super League", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/3v933i1680099716.png", category: "Eropa" },
  { id: 'eng.w.fa', name: "English Women's FA Cup", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Piala/kompetisi" },
  { id: 'eng.w.charity', name: "English Women's FA Community Shield", country: "Inggris", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/f1k1a51534346903.png", category: "Piala/kompetisi" },

  // Spain
  { id: 'esp.1', name: "Spanish LALIGA", country: "Spanyol", flag: "🇪🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/k83j411680100122.png", category: "Eropa" },
  { id: 'esp.2', name: "Spanish LALIGA 2", country: "Spanyol", flag: "🇪🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/k83j411680100122.png", category: "Eropa" },
  { id: 'esp.copa_del_rey', name: "Spanish Copa del Rey", country: "Spanyol", flag: "🇪🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'esp.super_cup', name: "Spanish Supercopa", country: "Spanyol", flag: "🇪🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/k83j411680100122.png", category: "Piala/kompetisi" },
  { id: 'esp.joan_gamper', name: "Trofeo Joan Gamper", country: "Spanyol", flag: "🇪🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/k83j411680100122.png", category: "Piala/kompetisi" },
  { id: 'esp.w.1', name: "Spanish Liga F", country: "Spanyol", flag: "🇪🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/k83j411680100122.png", category: "Eropa" },
  { id: 'esp.copa_de_la_reina', name: "Spanish Copa de la Reina", country: "Spanyol", flag: "🇪🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },

  // Germany
  { id: 'ger.1', name: "German Bundesliga", country: "Jerman", flag: "🇩🇪", logo: "https://www.thesportsdb.com/images/media/league/badge/0319201680099902.png", category: "Eropa" },
  { id: 'ger.2', name: "German 2. Bundesliga", country: "Jerman", flag: "🇩🇪", logo: "https://www.thesportsdb.com/images/media/league/badge/0319201680099902.png", category: "Eropa" },
  { id: 'ger.dfb_pokal', name: "German Cup", country: "Jerman", flag: "🇩🇪", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'ger.super_cup', name: "German Supercup", country: "Jerman", flag: "🇩🇪", logo: "https://www.thesportsdb.com/images/media/league/badge/0319201680099902.png", category: "Piala/kompetisi" },
  { id: 'ger.playoff.relegation', name: "German Bundesliga Promotion/Relegation Playoff", country: "Jerman", flag: "🇩🇪", logo: "https://www.thesportsdb.com/images/media/league/badge/0319201680099902.png", category: "Eropa" },
  { id: 'ger.2.promotion.relegation', name: "German Bundesliga 2 Promotion/Relegation Playoffs", country: "Jerman", flag: "🇩🇪", logo: "https://www.thesportsdb.com/images/media/league/badge/0319201680099902.png", category: "Eropa" },

  // Italy
  { id: 'ita.1', name: "Italian Serie A", country: "Italia", flag: "🇮🇹", logo: "https://www.thesportsdb.com/images/media/league/badge/1932311680100000.png", category: "Eropa" },
  { id: 'ita.2', name: "Italian Serie B", country: "Italia", flag: "🇮🇹", logo: "https://www.thesportsdb.com/images/media/league/badge/1932311680100000.png", category: "Eropa" },
  { id: 'ita.coppa_italia', name: "Coppa Italia", country: "Italia", flag: "🇮🇹", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'ita.super_cup', name: "Italian Supercoppa", country: "Italia", flag: "🇮🇹", logo: "https://www.thesportsdb.com/images/media/league/badge/1932311680100000.png", category: "Piala/kompetisi" },

  // France
  { id: 'fra.1', name: "French Ligue 1", country: "Prancis", flag: "🇫🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/1802311680100052.png", category: "Eropa" },
  { id: 'fra.2', name: "French Ligue 2", country: "Prancis", flag: "🇫🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/1802311680100052.png", category: "Eropa" },
  { id: 'fra.coupe_de_france', name: "Coupe de France", country: "Prancis", flag: "🇫🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'fra.super_cup', name: "French Trophee des Champions", country: "Prancis", flag: "🇫🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/1802311680100052.png", category: "Piala/kompetisi" },
  { id: 'fra.w.1', name: "French Premiere Ligue", country: "Prancis", flag: "🇫🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/1802311680100052.png", category: "Eropa" },

  // Netherlands
  { id: 'ned.1', name: "Dutch Eredivisie", country: "Belanda", flag: "🇳🇱", logo: "https://www.thesportsdb.com/images/media/league/badge/978281168010031.png", category: "Eropa" },
  { id: 'ned.2', name: "Dutch Keuken Kampioen Divisie", country: "Belanda", flag: "🇳🇱", logo: "https://www.thesportsdb.com/images/media/league/badge/978281168010031.png", category: "Eropa" },
  { id: 'ned.3', name: "Dutch Tweede Divisie", country: "Belanda", flag: "🇳🇱", logo: "https://www.thesportsdb.com/images/media/league/badge/978281168010031.png", category: "Eropa" },
  { id: 'ned.cup', name: "Dutch KNVB Beker", country: "Belanda", flag: "🇳🇱", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'ned.supercup', name: "Dutch Johan Cruyff Shield", country: "Belanda", flag: "🇳🇱", logo: "https://www.thesportsdb.com/images/media/league/badge/978281168010031.png", category: "Piala/kompetisi" },
  { id: 'ned.w.1', name: "Dutch Vrouwen Eredivisie", country: "Belanda", flag: "🇳🇱", logo: "https://www.thesportsdb.com/images/media/league/badge/978281168010031.png", category: "Eropa" },
  { id: 'ned.w.knvb_cup', name: "Dutch KNVB Beker Vrouwen", country: "Belanda", flag: "🇳🇱", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },

  // Scotland
  { id: 'sco.1', name: "Scottish Premiership", country: "Skotlandia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/8422311680100180.png", category: "Eropa" },
  { id: 'sco.2', name: "Scottish Championship", country: "Skotlandia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/8422311680100180.png", category: "Eropa" },
  { id: 'sco.3', name: "Scottish League One", country: "Skotlandia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/8422311680100180.png", category: "Eropa" },
  { id: 'sco.4', name: "Scottish League Two", country: "Skotlandia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/8422311680100180.png", category: "Eropa" },
  { id: 'sco.tennents', name: "Scottish Cup", country: "Skotlandia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'sco.cis', name: "Scottish League Cup", country: "Skotlandia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'sco.challenge', name: "Scottish League Challenge Cup", country: "Skotlandia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },

  // Portugal / Belgium / Austria / Other Europe
  { id: 'por.1', name: "Portuguese Primeira Liga", country: "Portugal", flag: "🇵🇹", logo: "https://www.thesportsdb.com/images/media/league/badge/3012911680100200.png", category: "Eropa" },
  { id: 'por.taca.portugal', name: "Taca de Portugal", country: "Portugal", flag: "🇵🇹", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'bel.1', name: "Belgian Pro League", country: "Belgia", flag: "🇧🇪", logo: "https://upload.wikimedia.org/wikipedia/id/5/58/Pro_League_logo.jpg", category: "Eropa" },
  { id: 'aut.1', name: "Austrian Bundesliga", country: "Austria", flag: "🇦🇹", logo: "https://www.thesportsdb.com/images/media/league/badge/3012911680100200.png", category: "Eropa" },
  { id: 'gre.1', name: "Greek Super League", country: "Yunani", flag: "🇬🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/3012911680100200.png", category: "Eropa" },
  { id: 'tur.1', name: "Turkish Super Lig", country: "Turki", flag: "🇹🇷", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4f/S%C3%BCper_Lig_logo.svg", category: "Eropa" },
  { id: 'den.1', name: "Danish Superliga", country: "Denmark", flag: "🇩🇰", logo: "https://www.thesportsdb.com/images/media/league/badge/3012911680100200.png", category: "Eropa" },
  { id: 'nor.1', name: "Norwegian Eliteserien", country: "Norwegia", flag: "🇳🇴", logo: "https://www.thesportsdb.com/images/media/league/badge/3012911680100200.png", category: "Eropa" },
  { id: 'swe.1', name: "Swedish Allsvenskan", country: "Swedia", flag: "🇸🇪", logo: "https://www.thesportsdb.com/images/media/league/badge/3012911680100200.png", category: "Eropa" },
  { id: 'cyp.1', name: "Cypriot First Division", country: "Siprus", flag: "🇨🇾", logo: "https://www.thesportsdb.com/images/media/league/badge/3012911680100200.png", category: "Eropa" },
  { id: 'irl.1', name: "Irish Premier Division", country: "Irlandia", flag: "🇮🇪", logo: "https://www.thesportsdb.com/images/media/league/badge/3012911680100200.png", category: "Eropa" },
  { id: 'rus.1', name: "Russian Premier League", country: "Rusia", flag: "🇷🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/3012911680100200.png", category: "Eropa" },

  // USA / CONCACAF
  { id: 'usa.1', name: "MLS", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'usa.open', name: "U.S. Open Cup", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2522c01534347814.png", category: "Piala/kompetisi" },
  { id: 'usa.nwsl', name: "NWSL", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'usa.nwsl.cup', name: "NWSL Challenge Cup", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'usa.nwsl.summer.cup', name: "NWSL X Liga MX Femenil Summer Cup", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'usa.usl.1', name: "USL Championship", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'usa.usl.l1', name: "USL League One", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'usa.w.usl.1', name: "USL Super League", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'usa.ncaa.m.1', name: "NCAA Men's Soccer", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'usa.ncaa.w.1', name: "NCAA Women's Soccer", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'concacaf.champions', name: "Concacaf Champions Cup", country: "CONCACAF", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'concacaf.leagues.cup', name: "Leagues Cup", country: "CONCACAF", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'concacaf.gold', name: "Concacaf Gold Cup", country: "CONCACAF", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Internasional" },
  { id: 'concacaf.nations.league', name: "Concacaf Nations League", country: "CONCACAF", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Internasional" },
  { id: 'concacaf.w.gold', name: "Concacaf W Gold Cup", country: "CONCACAF", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Internasional" },
  { id: 'concacaf.w.champions_cup', name: "Concacaf W Champions Cup", country: "CONCACAF", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'campeones.cup', name: "Campeones Cup", country: "CONCACAF", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'can.w.nsl', name: "Northern Super League (Canada)", country: "Kanada", flag: "🇨🇦", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },

  // Mexico
  { id: 'mex.1', name: "Mexican Liga BBVA MX", country: "Meksiko", flag: "🇲🇽", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'mex.2', name: "Mexican Liga de Expansion MX", country: "Meksiko", flag: "🇲🇽", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'mex.campeon', name: "Mexican Campeon de Campeones", country: "Meksiko", flag: "🇲🇽", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'mex.supercopa', name: "Mexican Supercopa MX", country: "Meksiko", flag: "🇲🇽", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },

  // South America / CONMEBOL
  { id: 'conmebol.libertadores', name: "CONMEBOL Libertadores", country: "Amerika Selatan", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'conmebol.sudamericana', name: "CONMEBOL Sudamericana", country: "Amerika Selatan", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'conmebol.recopa', name: "CONMEBOL Recopa", country: "Amerika Selatan", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'conmebol.america', name: "Copa America", country: "Amerika Selatan", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Internasional" },
  { id: 'conmebol.america_qual', name: "Copa America Qualifying", country: "Amerika Selatan", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Internasional" },
  { id: 'conmebol.america.femenina', name: "Copa America Femenina", country: "Amerika Selatan", flag: "🌎", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Internasional" },
  { id: 'global.finalissima', name: "CONMEBOL-UEFA Cup of Champions", country: "Internasional", flag: "🏆", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Internasional" },
  { id: 'arg.1', name: "Argentine Liga Profesional de Futbol", country: "Argentina", flag: "🇦🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'arg.copa', name: "Copa Argentina", country: "Argentina", flag: "🇦🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'bra.1', name: "Brazilian Serie A", country: "Brasil", flag: "🇧🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'bra.2', name: "Brazilian Serie B", country: "Brasil", flag: "🇧🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'bra.copa_do_brazil', name: "Copa do Brasil", country: "Brasil", flag: "🇧🇷", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Piala/kompetisi" },
  { id: 'chi.1', name: "Chilean Primera Division", country: "Chili", flag: "🇨🇱", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'col.1', name: "Colombian Primera A", country: "Kolombia", flag: "🇨🇴", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'par.1', name: "Paraguayan Primera Division", country: "Paraguay", flag: "🇵🇾", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'per.1', name: "Peruvian Liga 1", country: "Peru", flag: "🇵🇪", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'uru.1', name: "Liga AUF Uruguaya", country: "Uruguay", flag: "🇺🇾", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'bol.1', name: "Bolivian Liga Profesional", country: "Bolivia", flag: "🇧🇴", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'ecu.1', name: "LigaPro Ecuador", country: "Ekuador", flag: "🇪🇨", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },
  { id: 'ven.1', name: "Venezuelan Primera Division", country: "Venezuela", flag: "🇻🇪", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" },

  // Africa / CAF
  { id: 'caf.nations', name: "Africa Cup of Nations", country: "Afrika", flag: "🌍", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'caf.nations_qual', name: "Africa Cup of Nations Qualifying", country: "Afrika", flag: "🌍", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'caf.champions', name: "CAF Champions League", country: "Afrika", flag: "🌍", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Piala/kompetisi" },
  { id: 'caf.confed', name: "CAF Confederation Cup", country: "Afrika", flag: "🌍", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Piala/kompetisi" },
  { id: 'rsa.1', name: "South African Premiership", country: "Afrika Selatan", flag: "🇿🇦", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Afrika" },
  { id: 'nga.1', name: "Nigerian Professional League", country: "Nigeria", flag: "🇳🇬", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Afrika" },
  { id: 'gha.1', name: "Ghanaian Premier League", country: "Ghana", flag: "🇬🇭", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Afrika" },

  // Asia / Middle East / Oceania
  { id: 'afc.champions', name: "AFC Champions League Elite", country: "Asia", flag: "🌏", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Piala/kompetisi" },
  { id: 'afc.cup', name: "AFC Champions League Two", country: "Asia", flag: "🌏", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Piala/kompetisi" },
  { id: 'afc.asian.cup', name: "AFC Asian Cup", country: "Asia", flag: "🌏", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'ksa.1', name: "Saudi Pro League", country: "Arab Saudi", flag: "🇸🇦", logo: "https://upload.wikimedia.org/wikipedia/commons/4/42/Saudi_Pro_League_Logo.svg", category: "Asia" },
  { id: 'ksa.kings.cup', name: "Saudi King's Cup", country: "Arab Saudi", flag: "🇸🇦", logo: "https://upload.wikimedia.org/wikipedia/commons/4/42/Saudi_Pro_League_Logo.svg", category: "Piala/kompetisi" },
  { id: 'jpn.1', name: "Japanese J.League", country: "Jepang", flag: "🇯🇵", logo: "https://upload.wikimedia.org/wikipedia/commons/b/bc/J1_league_logo_2026.svg", category: "Asia" },
  { id: 'chn.1', name: "Chinese Super League", country: "Tiongkok", flag: "🇨🇳", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Asia" },
  { id: 'ind.1', name: "Indian Super League", country: "India", flag: "🇮🇳", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Asia" },
  { id: 'tha.1', name: "Thai League 1", country: "Thailand", flag: "🇹🇭", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Asia" },
  { id: 'mys.1', name: "Malaysian Super League", country: "Malaysia", flag: "🇲🇾", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Asia" },
  { id: 'idn.1', name: "Indonesian Super League", country: "Indonesia", flag: "🇮🇩", logo: "https://upload.wikimedia.org/wikipedia/id/2/2a/BRI_Super_League_%28Alt%29.svg", category: "Asia" },
  { id: 'sgp.1', name: "Singaporean Premier League", country: "Singapura", flag: "🇸🇬", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Asia" },
  { id: 'aus.1', name: "Australian A-League Men", country: "Australia", flag: "🇦🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Asia" },
  { id: 'aus.w.1', name: "Australian A-League Women", country: "Australia", flag: "🇦🇺", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Asia" },

  // Club Friendlies & Misc
  { id: 'club.friendly', name: "Club Friendly", country: "Internasional", flag: "🤝", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'nonfifa', name: "Non-FIFA Friendly", country: "Internasional", flag: "⚽", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Internasional" },
  { id: 'friendly.emirates_cup', name: "Emirates Cup", country: "Inggris", flag: "🏆", logo: "https://www.thesportsdb.com/images/media/league/badge/3v933i1680099716.png", category: "Piala/kompetisi" },
  { id: 'global.champs_cup', name: "International Champions Cup", country: "Internasional", flag: "🏆", logo: "https://www.thesportsdb.com/images/media/league/badge/5d4x5v1534346808.png", category: "Piala/kompetisi" },
  { id: 'generic.ussf', name: "Misc. U.S. Soccer Games", country: "Amerika Serikat", flag: "🇺🇸", logo: "https://www.thesportsdb.com/images/media/league/badge/2510211680100500.png", category: "Amerika" }
];

// App Navigation & Filter State
let activeNav = 'all'; 
let selectedLeague = 'all';
let selectedDateFilter = '';
let showFinishedInLive = true;
let showUpcomingInLive = true;
let showFinishedInFav = true;
let showUpcomingInFav = true;
let selectedStandingsLeague = null;
let selectedStandingsTab = 'table';
let cachedEvents = [];
let currentOpenModal = null;
let currentOpenTeam = null;

// User Preferences (LocalStorage)
let dataSaverMode = JSON.parse(localStorage.getItem('bgs_data_saver') || 'false');
let favoriteMatches = JSON.parse(localStorage.getItem('bgs_favorites') || '[]');
let favoriteTeams = JSON.parse(localStorage.getItem('bgs_favorite_teams') || '[]');
let soundSettings = JSON.parse(localStorage.getItem('bgs_sound_settings') || JSON.stringify({
  master: true, goal: true, lineup: true, kickoff1: true, halftime: true, kickoff2: true, fulltime: true, corner: true, yellow: true, red: true
}));

// Runtime Caches
let recentGoalCache = {};
let matchStateCache = {};
let playerPhotoCache = {};
let leagueLogoCache = {};

// Fallback Placeholders
const PLAIN_SHIELD_LOGO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'><path d='M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z'/></svg>";
const PLAIN_PERSON_HEADSHOT = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

// INDEXEDDB STORAGE ENGINE FOR CACHED MEDIA
let dbPromise = null;

function openPhotoDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('BGS_Photo_Storage', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos');
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }
  return dbPromise;
}

async function getPhotoFromCache(key) {
  try {
    const db = await openPhotoDB();
    return new Promise((resolve) => {
      const tx = db.transaction('photos', 'readonly');
      const store = tx.objectStore('photos');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function savePhotoToCache(key, data) {
  try {
    const db = await openPhotoDB();
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    store.put(data, key);
  } catch (e) {}
}