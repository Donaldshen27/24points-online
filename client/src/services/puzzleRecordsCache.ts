interface CachedData<T> {
  data: T;
  timestamp: number;
}

class DataCache {
  private cache = new Map<string, CachedData<any>>();
  private readonly TTL = 30000; // 30 seconds cache TTL

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Method to preload data
  preload(key: string, fetchFunction: () => Promise<any>): void {
    // Only preload if cache is empty or expired
    if (!this.get(key)) {
      fetchFunction().catch(console.error);
    }
  }
}

// Create separate instances for different data types
export const puzzleRecordsCache = new DataCache();
export const leaderboardCache = new DataCache();