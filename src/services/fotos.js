import { cacheGet, cacheSet } from './cache.js';

// Fotos dos jogadores via Wikipedia (pt) — grátis, sem chave, sem risco de suspensão.
const UA = 'RumoAoHexa/1.0 (projeto pessoal sobre a Seleção Brasileira na Copa 2026)';
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Nomes curtos/ambíguos que a Wikipedia confunde com homônimos -> termo de busca correto.
const ALIAS = {
  martinelli: 'Gabriel Martinelli',
  thiago: 'Igor Thiago',
  wesley: 'Wesley França',
};

// Último recurso: foto via TheSportsDB (cobre jogadores que a Wikipedia não tem).
async function fotoTSDB(termo) {
  const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(termo)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TSDB ${res.status}`);
  const lista = (await res.json()).player || [];
  const p = lista.find((x) => x.strSport === 'Soccer' && x.strNationality === 'Brazil') || lista[0];
  return p ? (p.strThumb || p.strCutout || '') : '';
}

// Busca a foto de UM jogador pela pesquisa "<nome> futebolista" (usada só no fallback).
async function buscarFoto(nome) {
  const q = encodeURIComponent(`${nome} futebolista`);
  const url = `https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=400&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  const page = Object.values((await res.json()).query?.pages || {})[0];
  return page?.thumbnail?.source || '';
}

/**
 * Retorna um mapa { nomeNormalizado: urlDaFoto } para os jogadores pedidos.
 * 1) UMA requisição com todos os títulos (barato, sem rate-limit, resolve acentos via redirect).
 * 2) Busca individual só para os poucos que faltarem. Mapa cacheado (12h).
 */
export async function getFotosBrasil(nomes) {
  const cached = await cacheGet('wiki-fotos-v5');
  if (cached != null) return cached;

  const mapa = {};

  // 1) lote único por títulos
  try {
    const titles = encodeURIComponent(nomes.join('|'));
    const url = `https://pt.wikipedia.org/w/api.php?action=query&titles=${titles}&prop=pageimages&piprop=thumbnail&pithumbsize=400&redirects=1&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      const data = await res.json();
      Object.values(data.query?.pages || {}).forEach((p) => {
        if (p.thumbnail?.source) mapa[norm(p.title)] = p.thumbnail.source;
      });
    }
  } catch { /* segue para o fallback */ }

  // força os nomes com apelido a serem buscados pelo termo certo (mesmo se o lote achou errado)
  Object.keys(ALIAS).forEach((k) => { delete mapa[k]; });

  // 2) fallback Wikipedia (busca individual) para quem ainda não tem foto
  for (const nome of nomes.filter((n) => !mapa[norm(n)])) {
    const termo = ALIAS[norm(nome)] || nome;
    try {
      const foto = await buscarFoto(termo);
      if (foto) mapa[norm(nome)] = foto;
    } catch { /* ignora */ }
    await sleep(150);
  }

  // 3) último recurso: TheSportsDB para os que a Wikipedia não tem (ex.: jogadores jovens)
  for (const nome of nomes.filter((n) => !mapa[norm(n)])) {
    const termo = ALIAS[norm(nome)] || nome;
    try {
      const foto = await fotoTSDB(termo);
      if (foto) mapa[norm(nome)] = foto;
    } catch { /* ignora */ }
    await sleep(150);
  }

  await cacheSet('wiki-fotos-v5', mapa, 12 * 3600);
  return mapa;
}
