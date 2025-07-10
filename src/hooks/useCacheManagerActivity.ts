import { useState, useMemo, useEffect, useRef } from 'react';
import { useBlockchainService } from './useBlockchainService';
import {
  CacheMetricsService,
  BidAverageTimespan,
} from '@/services/cacheMetricsService';

/**
 * Interface for cache manager activity period data
 */
export interface CacheManagerActivityPeriod {
  period: string;
  insertCount: number;
  deleteCount: number;
  netChange: number;
}

/**
 * Timespan options for cache manager activity data
 */
export type CacheManagerActivityTimespan = BidAverageTimespan;

/**
 * Interface for the hook result
 */
export interface CacheManagerActivityResult {
  activityData: CacheManagerActivityPeriod[];
  totalInserts: number;
  totalDeletes: number;
  totalNetChange: number;
  isLoading: boolean;
  error: Error | null;
  currentBlockchainId: string | null;
  timespan: CacheManagerActivityTimespan;
  setTimespan: (timespan: CacheManagerActivityTimespan) => void;
  refresh: () => void;
}

/**
 * Hook to access cache manager activity data
 */
export function useCacheManagerActivity(
  initialTimespan: CacheManagerActivityTimespan = 'D'
): CacheManagerActivityResult {
  const { currentBlockchainId, isLoading: isLoadingBlockchain } =
    useBlockchainService(false);
  const [activityData, setActivityData] = useState<
    CacheManagerActivityPeriod[]
  >([]);
  const [totalInserts, setTotalInserts] = useState<number>(0);
  const [totalDeletes, setTotalDeletes] = useState<number>(0);
  const [totalNetChange, setTotalNetChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [timespan, setTimespan] =
    useState<CacheManagerActivityTimespan>(initialTimespan);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  // Create memoized service instance to avoid recreation on each render
  const service = useMemo(() => new CacheMetricsService(), []);

  // Function to manually refresh data
  const refresh = () => {
    setRefreshCounter((prevCounter) => prevCounter + 1);
  };

  // Effect to fetch activity data
  useEffect(() => {
    // Skip if no blockchain is selected
    if (!currentBlockchainId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    service
      .getBidTrends(currentBlockchainId, timespan)
      .then((data) => {
        setActivityData(data.periods);
        setTotalInserts(data.global.insertCount);
        setTotalDeletes(data.global.deleteCount);
        setTotalNetChange(data.global.netChange);
      })
      .catch((err) => {
        console.error('Error fetching bid trends data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentBlockchainId, service, timespan, refreshCounter]);

  // Mark initial mount as complete after first render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, []);

  return {
    activityData,
    totalInserts,
    totalDeletes,
    totalNetChange,
    isLoading: isLoading || isLoadingBlockchain,
    error,
    currentBlockchainId,
    timespan,
    setTimespan,
    refresh,
  };
}
