import { useState, useMemo } from 'react';
import { useBlockchainService } from './useBlockchainService';

/**
 * Interface for cache manager activity period data
 */
export interface CacheManagerActivityPeriod {
  period: string;
  count: number;
}

/**
 * Mock data for cache manager activity
 */
const MOCK_DATA: Record<
  CacheManagerActivityTimespan,
  CacheManagerActivityPeriod[]
> = {
  D: [
    { period: '2025-05-05', count: 39 },
    { period: '2025-05-06', count: 49 },
    { period: '2025-05-07', count: 18 },
    { period: '2025-05-08', count: 73 },
    { period: '2025-05-09', count: 16 },
    { period: '2025-05-12', count: 8 },
  ],
  W: [
    { period: '2025-18', count: 125 },
    { period: '2025-19', count: 143 },
    { period: '2025-20', count: 98 },
    { period: '2025-21', count: 112 },
  ],
  M: [
    { period: '2025-01', count: 328 },
    { period: '2025-02', count: 415 },
    { period: '2025-03', count: 389 },
    { period: '2025-04', count: 456 },
    { period: '2025-05', count: 287 },
  ],
  Y: [
    { period: '2023', count: 3240 },
    { period: '2024', count: 4125 },
    { period: '2025', count: 1875 },
  ],
};

/**
 * Timespan options for cache manager activity data
 */
export type CacheManagerActivityTimespan = 'D' | 'W' | 'M' | 'Y';

/**
 * Interface for the hook result
 */
export interface CacheManagerActivityResult {
  activityData: CacheManagerActivityPeriod[];
  totalActivity: number;
  isLoading: boolean;
  currentBlockchainId: string | null;
  timespan: CacheManagerActivityTimespan;
  setTimespan: (timespan: CacheManagerActivityTimespan) => void;
}

/**
 * Hook to access cache manager activity data
 * Currently uses mock data
 */
export function useCacheManagerActivity(
  initialTimespan: CacheManagerActivityTimespan = 'D'
): CacheManagerActivityResult {
  const { currentBlockchainId, isLoading: isLoadingBlockchain } =
    useBlockchainService(false);
  const [timespan, setTimespan] =
    useState<CacheManagerActivityTimespan>(initialTimespan);

  // Get mock data based on selected timespan
  const activityData = useMemo(() => {
    return MOCK_DATA[timespan] || [];
  }, [timespan]);

  // Calculate total activity
  const totalActivity = useMemo(() => {
    return activityData.reduce((total, item) => total + item.count, 0);
  }, [activityData]);

  return {
    activityData,
    totalActivity,
    isLoading: isLoadingBlockchain, // For now, just use blockchain loading state
    currentBlockchainId,
    timespan,
    setTimespan,
  };
}
