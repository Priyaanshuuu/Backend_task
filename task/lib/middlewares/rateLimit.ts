import {LRUCache} from "lru-cache"
import {NextRequest} from "next/server"

interface RateLimitEntry{
    count : number;
    restAt : number;
}

const MAX_REQ = parseInt(process.env.RATE_LIMIT_MAX ?? "20" , 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOWS_MS ?? "6000" , 10)

const store = new LRUCache<string , RateLimitEntry>({
    max : 10_000,
    ttl : WINDOW_MS,
})

export interface RateLimitResult {
    allowed : boolean,
    remaining : number,
    restAt : number
}

export function checkRateLimit(identifier : string): RateLimitResult{
    const now = Date.now()
    const existing = store.get(identifier)

    if(!existing) {
        store.set(identifier , { count:1 , restAt : now + WINDOW_MS})
        return { allowed : true , remaining: MAX_REQ - 1 , restAt: now + WINDOW_MS}
    }

    if(existing.count >= MAX_REQ){
        return {
            allowed : false,
            remaining : 0,
            restAt : existing.restAt
        }
    }

    existing.count += 1
    store.set(identifier, existing)
    return {
        allowed : true,
        remaining : MAX_REQ - existing.count,
        restAt : existing.restAt
    }
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}