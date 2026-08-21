interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private timers = new Map<string, NodeJS.Timeout>();

  set<T>(key: string, data: T, ttlSeconds: number = 300) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    const ttlMs = ttlSeconds * 1000;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });

    // Auto-expire after TTL
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttlMs);

    this.timers.set(key, timer);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
        this.timers.delete(key);
      }
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  remove(key: string) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
  }

  getStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheManager = new CacheManager();
