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
 * Interface for bid average period data
 */
export interface BidAveragePeriod {
  period: string;
  averageBid: string;
  parsedAverageBid: string;
  count: number;
}

/**
 * Interface for global bid average data
 */
export interface BidAverageGlobal {
  averageBid: string;
  parsedAverageBid: string;
  count: number;
}

/**
 * Interface for bid average response
 */
export interface BidAverageResponse {
  periods: BidAveragePeriod[];
  global: BidAverageGlobal;
}

/**
 * Interface for bid trends period data
 */
export interface BidTrendsPeriod {
  period: string;
  count: number;
}

/**
 * Interface for global bid trends data
 */
export interface BidTrendsGlobal {
  count: number;
}

/**
 * Interface for bid trends response
 */
export interface BidTrendsResponse {
  periods: BidTrendsPeriod[];
  global: BidTrendsGlobal;
}

/**
 * Timespan options for bid data
 */
export type BidAverageTimespan = 'D' | 'W' | 'M' | 'Y';

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

  /**
   * Get bid average data for a specific blockchain
   * @param blockchainId The blockchain ID
   * @param timespan The timespan (D=Day, W=Week, M=Month, Y=Year)
   * @param minSize Minimum size in bytes (optional)
   * @param maxSize Maximum size in bytes (optional)
   * @returns Promise with bid average information
   */
  async getBidAverage(
    blockchainId: string,
    timespan: BidAverageTimespan,
    minSize?: number,
    maxSize?: number
  ): Promise<BidAverageResponse> {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('timespan', timespan);

    if (minSize !== undefined) {
      params.append('minSize', minSize.toString());
    }

    if (maxSize !== undefined) {
      params.append('maxSize', maxSize.toString());
    }

    return this.apiClient.get<BidAverageResponse>(
      `/blockchains/${blockchainId}/bid-average?${params.toString()}`
    );
  }

  /**
   * Get bid trends data for a specific blockchain
   * @param blockchainId The blockchain ID
   * @param timespan The timespan (D=Day, W=Week, M=Month, Y=Year)
   * @returns Promise with bid trends information
   */
  async getBidTrends(
    blockchainId: string,
    timespan: BidAverageTimespan
  ): Promise<BidTrendsResponse> {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('timespan', timespan);

    return this.apiClient.get<BidTrendsResponse>(
      `/blockchains/${blockchainId}/bid-trends?${params.toString()}`
    );
  }
}
