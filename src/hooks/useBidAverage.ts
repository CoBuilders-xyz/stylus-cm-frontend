import { useEffect, useState, useMemo, useRef } from 'react';
import {
  CacheMetricsService,
  BidAverageResponse,
  BidAverageTimespan,
} from '@/services/cacheMetricsService';
import { useBlockchainService } from './useBlockchainService';

/**
 * Size range for bid average data
 */
export type BidAverageSizeRange = 'small' | 'medium' | 'large';

/**
 * Interface for size range configuration
 */
interface SizeRangeConfig {
  minSize: number;
  maxSize?: number;
}

/**
 * Size range configuration for bid average
 */
const SIZE_RANGES: Record<BidAverageSizeRange, SizeRangeConfig> = {
  small: { minSize: 0, maxSize: 800 }, // < 8kb
  medium: { minSize: 800, maxSize: 1600 }, // 8kb to 16kb
  large: { minSize: 1600 }, // > 16kb
};

/**
 * Results returned by useBidAverage
 */
interface BidAverageResult {
  bidAverageData: BidAverageResponse | null;
  isLoading: boolean;
  error: Error | null;
  currentBlockchainId: string | null;
  timespan: BidAverageTimespan;
  sizeRange: BidAverageSizeRange;
  setTimespan: (timespan: BidAverageTimespan) => void;
  setSizeRange: (sizeRange: BidAverageSizeRange) => void;
  refresh: () => void;
}

/**
 * Hook to access bid average data
 * Uses the current blockchain from useBlockchainService
 */
export function useBidAverage(
  initialTimespan: BidAverageTimespan = 'D',
  initialSizeRange: BidAverageSizeRange = 'small'
): BidAverageResult {
  const { currentBlockchainId, isLoading: isLoadingBlockchain } =
    useBlockchainService(false);
  const [bidAverageData, setBidAverageData] =
    useState<BidAverageResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [timespan, setTimespan] = useState<BidAverageTimespan>(initialTimespan);
  const [sizeRange, setSizeRange] =
    useState<BidAverageSizeRange>(initialSizeRange);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  // Create memoized service instance to avoid recreation on each render
  const service = useMemo(() => new CacheMetricsService(), []);

  // Function to manually refresh data
  const refresh = () => {
    setRefreshCounter((prevCounter) => prevCounter + 1);
  };

  // Effect to fetch bid average data
  useEffect(() => {
    // Skip if no blockchain is selected
    if (!currentBlockchainId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Get current size range configuration
    const { minSize, maxSize } = SIZE_RANGES[sizeRange];

    service
      .getBidAverage(currentBlockchainId, timespan, minSize, maxSize)
      .then((data) => {
        setBidAverageData(data);
      })
      .catch((err) => {
        console.error('Error fetching bid average data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentBlockchainId, service, timespan, sizeRange, refreshCounter]);

  // Mark initial mount as complete after first render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, []);

  return {
    bidAverageData,
    isLoading: isLoading || isLoadingBlockchain,
    error,
    currentBlockchainId,
    timespan,
    sizeRange,
    setTimespan,
    setSizeRange,
    refresh,
  };
}
