interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private memory = new Map<string, CacheEntry<unknown>>();
  private prefix = 'finance-dashboard:';

  set<T>(key: string, data: T, ttl: number): void {
    const fullKey = this.prefix + key;
    const expiresAt = Date.now() + ttl;
    this.memory.set(fullKey, { data, expiresAt });

    try {
      localStorage.setItem(fullKey, JSON.stringify({ data, expiresAt }));
    } catch {
      // Ignore localStorage errors (private browsing, quota exceeded)
    }
  }

  get<T>(key: string): T | null {
    const fullKey = this.prefix + key;

    // Check memory first
    const memEntry = this.memory.get(fullKey);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return memEntry.data as T;
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(fullKey);
      if (stored) {
        const { data, expiresAt } = JSON.parse(stored);
        if (expiresAt > Date.now()) {
          this.memory.set(fullKey, { data, expiresAt });
          return data as T;
        }
      }
    } catch {
      // Ignore parse errors
    }

    return null;
  }

  delete(key: string): void {
    const fullKey = this.prefix + key;
    this.memory.delete(fullKey);
    try {
      localStorage.removeItem(fullKey);
    } catch {
      // Ignore
    }
  }

  clear(): void {
    this.memory.clear();
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(this.prefix));
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore
    }
  }

  // Clean expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.memory.entries()) {
      if (entry.expiresAt <= now) {
        this.memory.delete(key);
      }
    }
  }
}

export const cache = new Cache();

// Periodic cleanup
setInterval(() => cache.cleanup(), 60_000);