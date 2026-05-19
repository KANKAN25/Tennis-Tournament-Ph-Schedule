const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { discoverActiveTournaments } = require('./services/tournament-discovery-service');

const API_KEY = 'Hel3cTXsnzvdAsBU9rAa0lfRvuFsAbLhlzWdc8jK';
const PORT    = 3456;
const ROOT_DIR = __dirname;
const STATIC_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const YEAR = 2026;

function apiGet(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.sportdb.dev',
      path,
      headers: { 'X-API-Key': API_KEY, 'Accept': 'application/json' }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(getApiErrorMessage(res.statusCode, d)));
        try { resolve(JSON.parse(d)); }
        catch(e) { resolve(null); }
      });
    }).on('error', error => reject(error));
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getApiErrorMessage(statusCode, body) {
  const fallback = `SportDB error ${statusCode}`;
  try {
    return JSON.parse(body).detail || fallback;
  } catch {
    return fallback;
  }
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

async function fetchTournaments(tournaments) {
  const results = [];
  for (const tournament of tournaments) {
    results.push(await fetchTournament(tournament));
    await delay(400);
  }
  return results;
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

  const tournaments = await discoverActiveTournaments(force);
  console.log(`\n[fetch] Loading ${tournaments.length} active tournaments...`);
  const start = Date.now();

  const results = await fetchTournaments(tournaments);
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

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(payload));
}

function getStaticFilePath(urlPath) {
  const requestPath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.normalize(path.join(ROOT_DIR, requestPath));
  const relativePath = path.relative(ROOT_DIR, filePath);
  return relativePath.startsWith('..') ? null : filePath;
}

function getContentType(filePath) {
  return STATIC_TYPES[path.extname(filePath)] || 'application/octet-stream';
}

function sendStatic(req, res) {
  const urlPath = new URL(req.url, `http://localhost:${PORT}`).pathname;
  const filePath = getStaticFilePath(urlPath);
  if (!filePath || !fs.existsSync(filePath)) return sendJson(res, 404, { error: 'Not found' });

  res.writeHead(200, { 'Content-Type': getContentType(filePath) });
  fs.createReadStream(filePath).pipe(res);
}

async function sendMatches(req, res) {
  const force = req.url.includes('refresh=1');
  const matches = await getMatches(force);
  sendJson(res, 200, { matches, count: matches.length });
}

// ── HTTP server ────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const urlPath = new URL(req.url, `http://localhost:${PORT}`).pathname;

  try {
    if (urlPath === '/matches') return await sendMatches(req, res);
    sendStatic(req, res);
  } catch(err) {
    console.error('[error]', err.message);
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n✅  Tennis PH Time — http://localhost:${PORT}`);
  console.log(`    Open http://localhost:${PORT} in your browser!\n`);
  // Warm up cache on start
  getMatches(true).catch(console.error);
});
