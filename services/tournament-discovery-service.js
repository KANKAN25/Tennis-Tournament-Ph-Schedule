const https = require('https');

const FLASH_SCORE_HOST = 'www.flashscore.com';
const FLASH_SCORE_TENNIS_PATH = '/tennis/';
const ACTIVE_TOURNAMENT_TTL = 30 * 60 * 1000;

const TOURNAMENT_CATEGORIES = [
  { cat: 'ATP Singles', label: 'ATP', slug: 'atp-singles', sportDbId: '5724' },
  { cat: 'WTA Singles', label: 'WTA', slug: 'wta-singles', sportDbId: '5725' },
];

let activeTournamentCache = null;
let activeTournamentCacheAt = 0;

function fetchText(hostname, path) {
  return new Promise((resolve) => {
    https.get({ hostname, path, headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createCategoryBySlug() {
  return new Map(TOURNAMENT_CATEGORIES.map(category => [category.slug, category]));
}

function getCurrentTournamentsBlock(html) {
  const blockStart = html.indexOf('Current Tournaments');
  const blockEnd = html.indexOf('leftMenu__item--more', blockStart);
  return html.slice(blockStart, blockEnd > blockStart ? blockEnd : undefined);
}

function parseActiveTournamentLinks(html) {
  const categoryBySlug = createCategoryBySlug();
  const links = new Map();
  const activeHtml = getCurrentTournamentsBlock(html);
  const regex = /href="\/tennis\/(atp-singles|wta-singles)\/([^/"]+)\/"/g;
  let match = regex.exec(activeHtml);

  while (match) {
    const category = categoryBySlug.get(match[1]);
    links.set(`${match[1]}:${match[2]}`, { category, slug: match[2] });
    match = regex.exec(activeHtml);
  }

  return [...links.values()];
}

function createTournamentName(candidate) {
  const name = candidate.slug.split('-').map(toTitleCase).join(' ');
  return `${candidate.category.label} ${name}`;
}

function toTitleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseTournamentId(html) {
  const ids = [...html.matchAll(/"tournament(?:Id)?":"([A-Za-z0-9]+)"/g)].map(match => match[1]);
  return [...new Set(ids)].pop() || null;
}

function createTournament(candidate, tournamentId) {
  return {
    cat: candidate.category.cat,
    name: createTournamentName(candidate),
    path: `${candidate.category.slug}:${candidate.category.sportDbId}/${candidate.slug}:${tournamentId}`,
  };
}

async function resolveTournament(candidate) {
  const html = await fetchText(FLASH_SCORE_HOST, `/tennis/${candidate.category.slug}/${candidate.slug}/`);
  const tournamentId = parseTournamentId(html);
  return tournamentId ? createTournament(candidate, tournamentId) : null;
}

async function resolveTournaments(candidates) {
  const tournaments = [];
  for (const candidate of candidates) {
    tournaments.push(await resolveTournament(candidate));
    await delay(250);
  }
  return tournaments.filter(Boolean);
}

async function discoverActiveTournaments(force = false) {
  if (!force && activeTournamentCache && Date.now() - activeTournamentCacheAt < ACTIVE_TOURNAMENT_TTL) {
    return activeTournamentCache;
  }

  const html = await fetchText(FLASH_SCORE_HOST, FLASH_SCORE_TENNIS_PATH);
  const candidates = parseActiveTournamentLinks(html);
  activeTournamentCache = await resolveTournaments(candidates);
  activeTournamentCacheAt = Date.now();
  return activeTournamentCache;
}

module.exports = { discoverActiveTournaments };
