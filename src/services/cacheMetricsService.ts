import { ApiClient } from './api';

/**
 * Interface for total bytecodes response
 */
export interface TotalBytecodes {
  bytecodeCount: number;
  bytecodeCountDiffWithLastMonth: number;
}

/**
 * Interface for cache stats response
 */
export interface CacheStats {
  queueSize: string;
  cacheSize: string;
  queueSizeMB: number;
  cacheSizeMB: number;
  cacheFilledPercentage: number;
}

/**
 * Cache Metrics Service for non-authenticated API requests related to cache metrics
 */
export class CacheMetricsService {
  private apiClient: ApiClient;

  /**
   * Create a new CacheMetricsService instance
   * No authentication required for cache metrics
   */
  constructor() {
    // Pass empty string as access token for non-authenticated requests
    this.apiClient = new ApiClient('');
  }

  /**
   * Get total bytecodes for a specific blockchain
   * @param blockchainId The blockchain ID
   * @returns Promise with total bytecodes information
   */
  async getTotalBytecodes(blockchainId: string): Promise<TotalBytecodes> {
    return this.apiClient.get<TotalBytecodes>(
      `/blockchains/${blockchainId}/total-bytecodes`
    );
  }

  /**
   * Get cache statistics for a specific blockchain
   * @param blockchainId The blockchain ID
   * @returns Promise with cache statistics
   */
  async getCacheStats(blockchainId: string): Promise<CacheStats> {
    return this.apiClient.get<CacheStats>(
      `/blockchains/${blockchainId}/cache-stats`
    );
  }
}
