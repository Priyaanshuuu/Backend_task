import { describe, it, expect, beforeEach } from "@jest/globals";
import { llmCache, buildCacheKey } from "@/lib/utils/cache";

describe("LLM Cache", () => {
  beforeEach(() => {
    llmCache.clear();
  });

  it("should store and retrieve a value", () => {
    const key = buildCacheKey("user-1", "What is 2+2?");
    llmCache.set(key, "4");
    expect(llmCache.get(key)).toBe("4");
  });

  it("should return undefined for non-existent keys", () => {
    const key = buildCacheKey("user-1", "something that was never cached");
    expect(llmCache.get(key)).toBeUndefined();
  });

  it("should normalize whitespace in cache keys", () => {
    const key1 = buildCacheKey("user-1", "  hello world  ");
    const key2 = buildCacheKey("user-1", "hello world");
    expect(key1).toBe(key2);
  });

  it("should scope cache keys by userId", () => {
    const key1 = buildCacheKey("user-1", "same message");
    const key2 = buildCacheKey("user-2", "same message");
    expect(key1).not.toBe(key2);
  });

  it("should overwrite existing entries", () => {
    const key = buildCacheKey("user-1", "test message");
    llmCache.set(key, "first response");
    llmCache.set(key, "updated response");
    expect(llmCache.get(key)).toBe("updated response");
  });
});