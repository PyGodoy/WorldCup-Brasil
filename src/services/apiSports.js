import { cacheGet, cacheSet } from './cache.js';
import { config } from '../config.js';

// Cliente mínimo da API-Football (api-sports), usado APENAS para o elenco,
// porque ela fornece foto + número da camisa dos jogadores. Usa o cache compartilhado.
export async function apiSportsGet(path, params, ttl, cacheKey) {
  const cached = await cacheGet(cacheKey);
  if (cached != null) return { ...cached, _cached: true };

  const url = new URL(`https://${config.apiFootball.host}${path}`);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url, { headers: { 'x-apisports-key': config.apiFootball.key } });
  if (!res.ok) throw new Error(`API-Football respondeu ${res.status}`);

  const data = await res.json();
  const errs = data.errors || {};
  if (Array.isArray(errs) ? errs.length : Object.keys(errs).length) {
    throw new Error(`API-Football erro: ${JSON.stringify(errs)}`);
  }

  const payload = { response: data.response };
  await cacheSet(cacheKey, payload, ttl);
  return { ...payload, _cached: false };
}
