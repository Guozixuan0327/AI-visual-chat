import logger from '../utils/logger';

interface FrameRecord {
  hash: string;
  timestamp: number;
}

interface UsageStats {
  totalRequests: number;
  skippedFrames: number;
  lastResetTime: number;
}

export class CostOptimizer {
  private recentFrameHashes: Map<string, number>;
  private usageStats: UsageStats;
  private maxHashCacheSize: number;
  private hashTTL: number; // Time to live for hashes in ms

  constructor() {
    this.recentFrameHashes = new Map();
    this.maxHashCacheSize = 50; // Keep last 50 frame hashes
    this.hashTTL = 5 * 60 * 1000; // 5 minutes TTL
    this.usageStats = {
      totalRequests: 0,
      skippedFrames: 0,
      lastResetTime: Date.now(),
    };
  }

  /**
   * Check if a frame should be skipped based on deduplication
   * @param imageHash - Hash of the image
   * @returns true if frame should be skipped (duplicate)
   */
  shouldSkipFrame(imageHash: string): boolean {
    const now = Date.now();
    const cachedTimestamp = this.recentFrameHashes.get(imageHash);

    // Check if hash exists and is within TTL
    if (cachedTimestamp && (now - cachedTimestamp) < this.hashTTL) {
      this.usageStats.skippedFrames++;
      logger.debug(`Frame skipped: duplicate hash ${imageHash}`);
      return true;
    }

    // Add new hash to cache
    this.addFrameHash(imageHash, now);
    return false;
  }

  /**
   * Add frame hash to cache with cleanup
   */
  private addFrameHash(hash: string, timestamp: number): void {
    // Clean up expired entries
    this.cleanupExpiredHashes(timestamp);

    // If cache is full, remove oldest entry
    if (this.recentFrameHashes.size >= this.maxHashCacheSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.recentFrameHashes.delete(oldestKey);
      }
    }

    this.recentFrameHashes.set(hash, timestamp);
  }

  /**
   * Remove expired hashes from cache
   */
  private cleanupExpiredHashes(now: number): void {
    for (const [hash, timestamp] of this.recentFrameHashes.entries()) {
      if ((now - timestamp) >= this.hashTTL) {
        this.recentFrameHashes.delete(hash);
      }
    }
  }

  /**
   * Get the oldest key in the cache
   */
  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, timestamp] of this.recentFrameHashes.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Record an API request for tracking
   */
  recordApiRequest(): void {
    this.usageStats.totalRequests++;
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): UsageStats & { deduplicationRate: number } {
    const total = this.usageStats.totalRequests + this.usageStats.skippedFrames;
    const deduplicationRate = total > 0 ? (this.usageStats.skippedFrames / total) * 100 : 0;

    return {
      ...this.usageStats,
      deduplicationRate: Math.round(deduplicationRate * 100) / 100,
    };
  }

  /**
   * Reset usage statistics
   */
  resetStats(): void {
    this.usageStats = {
      totalRequests: 0,
      skippedFrames: 0,
      lastResetTime: Date.now(),
    };
    this.recentFrameHashes.clear();
    logger.info('Cost optimizer stats reset');
  }

  /**
   * Generate a simple hash from base64 image data
   */
  static generateImageHash(imageBase64: string): string {
    // Use first 2000 characters for speed
    const sample = imageBase64.slice(0, 2000);
    let hash = 0;

    for (let i = 0; i < sample.length; i++) {
      const char = sample.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }
}

export const costOptimizer = new CostOptimizer();
