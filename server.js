const http  = require('http');
const https = require('https');

const API_KEY = 'hXUYxicf1Ukr6YdVxmKXZdudyEP7Cu6SP9FJYEUf';
const PORT    = 3456;

// ── Hardcoded active tournaments for 2026 ──────────────────────
// Format: { cat, name, path }
// path = "category-slug:catId/tournament-slug:tournamentId"
// Add/remove tournaments here as the season progresses.
const TOURNAMENTS = [
  // ATP
  { cat:'ATP Singles', name:'ATP Dubai',    path:'atp-singles:5724/dubai:xKbLXKij' },
  { cat:'ATP Singles', name:'ATP Acapulco', path:'atp-singles:5724/acapulco:8hzzdqhG' },
  { cat:'ATP Singles', name:'ATP Rotterdam',path:'atp-singles:5724/rotterdam:tOyBUwDf' },
  { cat:'ATP Singles', name:'ATP Marseille',path:'atp-singles:5724/marseille:8QSFGZkJ' },
  { cat:'ATP Singles', name:'ATP Doha',     path:'atp-singles:5724/doha:faSVFPKp' },
  // WTA
  { cat:'WTA Singles', name:'WTA Dubai',    path:'wta-singles:5725/dubai:CWzMo70M' },
  { cat:'WTA Singles', name:'WTA Doha',     path:'wta-singles:5725/doha:CrwZIQlO' },
  { cat:'WTA Singles', name:'WTA Abu Dhabi',path:'wta-singles:5725/abu-dhabi:lKJiHgVg' },
  { cat:'WTA Singles', name:'WTA Hua Hin',  path:'wta-singles:5725/hua-hin:rNvts6S1' },
];

const YEAR = 2026;

function apiGet(path) {
  return new Promise((resolve) => {
    https.get({
      hostname: 'api.sportdb.dev',
      path,
      headers: { 'X-API-Key': API_KEY, 'Accept': 'application/json' }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function parseMatches(items, cat, tournament) {
  if (!Array.isArray(items)) return [];
  return items.map(m => {
    const stage = (m.eventStage || '').toUpperCase();
    const isLive = stage === 'LIVE' || stage === 'INPROGRESS';
    const isDone = !isLive && (stage === 'FINISHED' || !!m.winner || !!m.ftWinner);

    // Build set scores: "6-4  7-5"
    const sets = [];
    for (let i = 1; i <= 5; i++) {
      const h = m[`homeResultPeriod${i}`];
      const a = m[`awayResultPeriod${i}`];
      if (h !== undefined && a !== undefined) sets.push(`${h}-${a}`);
    }

    return {
      cat,
      tournament,
      round:      m.round || '',
      p1:         m.homeName || '',
      p1c:        m.home3CharName || '',
      p2:         m.awayName || '',
      p2c:        m.away3CharName || '',
      homeScore:  m.homeScore || m.homeFullTimeScore || '',
      awayScore:  m.awayScore || m.awayFullTimeScore || '',
      sets:       sets.join('  '),
      isLive,
      isDone,
      startUtime: parseInt(m.startUtime || m.startTime || 0, 10),
    };
  });
}

async function fetchTournament({ cat, name, path }) {
  const base = `/api/flashscore/tennis/${path}/${YEAR}`;
  const [fixtures, results] = await Promise.all([
    apiGet(`${base}/fixtures?page=1`),
    apiGet(`${base}/results?page=1`),
  ]);

  const matches = [
    ...parseMatches(fixtures, cat, name),
    ...parseMatches(results,  cat, name),
  ];

  // Deduplicate by eventId / startUtime+players
  const seen = new Set();
  return matches.filter(m => {
    const key = `${m.startUtime}-${m.p1}-${m.p2}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

// Cache
let cache = null;
let cacheAt = 0;
const TTL = 3 * 60 * 1000; // 3 minutes

async function getMatches(force = false) {
  if (!force && cache && Date.now() - cacheAt < TTL) {
    console.log(`[cache] ${cache.length} matches`);
    return cache;
  }

  console.log(`\n[fetch] Loading ${TOURNAMENTS.length} tournaments...`);
  const start = Date.now();

  // Fetch all tournaments in parallel
  const results = await Promise.all(TOURNAMENTS.map(fetchTournament));
  let all = results.flat();

  // Sort: live → upcoming by time → finished
  all.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    if (a.isDone !== b.isDone) return a.isDone ?  1 : -1;
    return a.startUtime - b.startUtime;
  });

  console.log(`[fetch] ${all.length} matches in ${Date.now()-start}ms`);
  all.forEach(m => console.log(`  ${m.isDone?'✓':m.isLive?'🔴':'○'} ${m.tournament} — ${m.p1} vs ${m.p2} (${m.round})`));

  cache = all;
  cacheAt = Date.now();
  return all;
}

// ── HTTP server ────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const force = req.url.includes('refresh=1');

  try {
    const matches = await getMatches(force);
    res.end(JSON.stringify({ matches, count: matches.length }));
  } catch(err) {
    console.error('[error]', err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`\n✅  Tennis PH Time — http://localhost:${PORT}`);
  console.log(`    Open index.html in your browser!\n`);
  // Warm up cache on start
  getMatches(true).catch(console.error);
});