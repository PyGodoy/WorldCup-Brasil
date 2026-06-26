import NodeCache from 'node-cache';
import { Redis } from '@upstash/redis';

// Cache compartilhado e persistente.
// Em produção (Vercel), se as variáveis do Upstash Redis existirem, TODAS as instâncias
// serverless dividem o MESMO cache — então a API externa é chamada raramente (sem estourar
// o limite) e o "último dado bom" sobrevive entre as instâncias.
// Sem essas variáveis (ex.: rodando local), cai automaticamente para cache em memória.
const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedis ? Redis.fromEnv() : null;
const mem = new NodeCache({ checkperiod: 120 });

export const usingRedis = hasRedis;

export async function cacheGet(key) {
  if (redis) {
    try {
      const v = await redis.get(key);
      return v ?? null;
    } catch {
      // se o Redis falhar, usa a memória local como rede de segurança
      return mem.get(key) ?? null;
    }
  }
  const v = mem.get(key);
  return v === undefined ? null : v;
}

export async function cacheSet(key, value, ttlSeconds) {
  mem.set(key, value, ttlSeconds); // sempre guarda em memória também
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch {
      /* ignora falha do Redis; a memória já guardou */
    }
  }
}
