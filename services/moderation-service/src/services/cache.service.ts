import Redis from "ioredis";
import { logger } from "../utils/logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CACHE_TTL = parseInt(process.env.BLACKLIST_CACHE_TTL_SECONDS || "300", 10);
const BLACKLIST_KEY = "moderation:blacklist:v1";

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    redisClient.on("error", (err) => {
      logger.warn("Redis error — cache deshabilitada temporalmente", "CACHE", { error: err.message });
    });
  }
  return redisClient;
}

export interface CachedBlacklistEntry {
  id: string;
  word: string;
  language: string;
  category: string;
  severity: string;
  active: boolean;
  variations: boolean;
  partialMatch: boolean;
}

/**
 * Obtiene el blacklist completo desde Redis.
 * Retorna null si no hay cache o si Redis no está disponible.
 */
export async function getBlacklistFromCache(): Promise<CachedBlacklistEntry[] | null> {
  try {
    const raw = await getRedis().get(BLACKLIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedBlacklistEntry[];
  } catch {
    return null;
  }
}

/**
 * Guarda el blacklist completo en Redis con TTL configurado.
 */
export async function setBlacklistInCache(entries: CachedBlacklistEntry[]): Promise<void> {
  try {
    await getRedis().setex(BLACKLIST_KEY, CACHE_TTL, JSON.stringify(entries));
    logger.debug(`Blacklist cacheada (${entries.length} entradas, TTL ${CACHE_TTL}s)`, "CACHE");
  } catch {
    // No fatal — el servicio sigue funcionando sin cache
  }
}

/**
 * Invalida el cache del blacklist (llamar cuando se modifica la lista).
 */
export async function invalidateBlacklistCache(): Promise<void> {
  try {
    await getRedis().del(BLACKLIST_KEY);
    logger.info("Cache de blacklist invalidada", "CACHE");
  } catch {
    // No fatal
  }
}
