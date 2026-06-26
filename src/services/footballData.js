import NodeCache from 'node-cache';
import { config } from '../config.js';

// Cache em memória compartilhado por TODOS os visitantes.
// 10 mil visitantes leem desta cópia; a API externa só é chamada quando o cache expira.
const cache = new NodeCache({ checkperiod: 60 });

// Contador de chamadas REAIS à API (útil para acompanhar o consumo do plano free).
let realApiCalls = 0;
export const getApiCallCount = () => realApiCalls;

/**
 * GET na football-data.org, sempre passando pelo cache.
 * @param {string} path     ex: "/competitions/WC/standings"
 * @param {object} params   query params
 * @param {number} ttl      tempo de cache em segundos
 * @param {string} cacheKey chave única do cache
 */
export async function apiGet(path, params, ttl, cacheKey) {
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return { ...cached, _cached: true };
  }

  // Sem chave -> modo demo (não chama a API de verdade)
  if (config.demoMode) {
    throw new Error('DEMO_MODE');
  }

  const url = new URL(config.footballData.baseUrl + path);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));

  realApiCalls += 1;

  const res = await fetch(url, {
    headers: { 'X-Auth-Token': config.footballData.key },
  });

  // 403 = recurso restrito ao plano -> cai no fallback demo (igual ao DEMO_MODE).
  if (res.status === 403) {
    const e = new Error('PLAN_LIMIT: recurso restrito ao seu plano');
    e.code = 'PLAN_LIMIT';
    throw e;
  }
  // 429 = estourou o limite de requisições por minuto.
  if (res.status === 429) {
    const e = new Error('RATE_LIMIT: limite de requisições por minuto atingido');
    e.code = 'RATE_LIMIT';
    throw e;
  }
  if (!res.ok) {
    throw new Error(`football-data respondeu ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  cache.set(cacheKey, data, ttl);
  return { ...data, _cached: false };
}

export { cache };
