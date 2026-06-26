import { cacheGet, cacheSet } from './cache.js';
import { config } from '../config.js';

// Contador de chamadas REAIS à API (por instância; útil para acompanhar o consumo).
let realApiCalls = 0;
export const getApiCallCount = () => realApiCalls;

/**
 * GET na football-data.org, sempre passando pelo cache compartilhado.
 * Se a atualização falhar (rate-limit/rede), serve o "último dado bom" salvo em vez de
 * cair pro demo — assim o site não fica offline. PLAN_LIMIT (403) continua propagando.
 * @param {string} path     ex: "/competitions/WC/standings"
 * @param {object} params   query params
 * @param {number} ttl      tempo de cache em segundos
 * @param {string} cacheKey chave única do cache
 */
export async function apiGet(path, params, ttl, cacheKey) {
  const cached = await cacheGet(cacheKey);
  if (cached != null) {
    return { ...cached, _cached: true };
  }

  // Sem chave -> modo demo (não chama a API de verdade)
  if (config.demoMode) {
    throw new Error('DEMO_MODE');
  }

  const url = new URL(config.footballData.baseUrl + path);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    realApiCalls += 1;

    const res = await fetch(url, {
      headers: { 'X-Auth-Token': config.footballData.key },
    });

    // 403 = recurso restrito ao plano -> propaga (vira erro/mensagem no front).
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
    await cacheSet(cacheKey, data, ttl);
    await cacheSet(`good:${cacheKey}`, data, 7 * 24 * 3600); // último dado bom (7 dias)
    return { ...data, _cached: false };
  } catch (err) {
    // Atualização falhou (rate-limit/rede). Se temos um último dado real, servimos ele.
    if (err.code !== 'PLAN_LIMIT') {
      const good = await cacheGet(`good:${cacheKey}`);
      if (good != null) {
        await cacheSet(cacheKey, good, 60); // re-tenta atualizar em 60s
        return { ...good, _cached: true, _stale: true };
      }
    }
    throw err;
  }
}
