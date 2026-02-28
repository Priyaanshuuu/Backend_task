import { LRUCache } from "lru-cache";

interface CacheOptions {
  maxItems?: number;
  ttlMs?: number;
}

function createLlmCache({ maxItems = 500, ttlMs = 1000 * 60 * 10 }: CacheOptions = {}) {
  return new LRUCache<string, string>({
    max: maxItems,
    ttl: ttlMs,
  });
}

export const llmCache = createLlmCache();

export function buildCacheKey(userId: string, message: string): string {
  return `${userId}::${message.trim().toLowerCase()}`;
}