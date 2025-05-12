import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  CacheMetricsService,
  CacheStats,
  TotalBytecodes,
} from '@/services/cacheMetricsService';
import { useBlockchainService } from './useBlockchainService';

/**
 * Results returned by useCacheMetrics
 */
interface CacheMetricsResult {
  totalBytecodes: TotalBytecodes | null;
  cacheStats: CacheStats | null;
  isLoadingTotalBytecodes: boolean;
  isLoadingCacheStats: boolean;
  errorTotalBytecodes: Error | null;
  errorCacheStats: Error | null;
  refreshData: () => void;
  currentBlockchainId: string | null;
}

/**
 * Hook to access cache metrics data
 * Uses the current blockchain from useBlockchainService
 */
export function useCacheMetrics(): CacheMetricsResult {
  const { currentBlockchainId, isLoading: isLoadingBlockchain } =
    useBlockchainService(false);
  const [totalBytecodes, setTotalBytecodes] = useState<TotalBytecodes | null>(
    null
  );
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoadingTotalBytecodes, setIsLoadingTotalBytecodes] =
    useState<boolean>(false);
  const [isLoadingCacheStats, setIsLoadingCacheStats] =
    useState<boolean>(false);
  const [errorTotalBytecodes, setErrorTotalBytecodes] = useState<Error | null>(
    null
  );
  const [errorCacheStats, setErrorCacheStats] = useState<Error | null>(null);
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);

  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  // Track previous blockchain ID to detect changes
  const prevBlockchainIdRef = useRef<string | null>(null);

  // Create memoized service instance to avoid recreation on each render
  const service = useMemo(() => new CacheMetricsService(), []);

  // Memoized refresh function
  const refreshData = useCallback(() => {
    setRefreshFlag(true);
  }, []);

  // Effect to fetch total bytecodes
  useEffect(() => {
    // Skip if no blockchain is selected
    if (!currentBlockchainId) {
      return;
    }

    // Handle blockchain change
    if (prevBlockchainIdRef.current !== currentBlockchainId) {
      prevBlockchainIdRef.current = currentBlockchainId;
      setTotalBytecodes(null);
      setCacheStats(null);
    }

    // Determine if we should fetch
    const shouldFetch =
      // On initial mount
      isInitialMount.current ||
      // When user explicitly requests a refresh
      refreshFlag ||
      // When we don't have data yet
      !totalBytecodes;

    if (!shouldFetch || isLoadingTotalBytecodes) {
      return;
    }

    setIsLoadingTotalBytecodes(true);
    setErrorTotalBytecodes(null);

    service
      .getTotalBytecodes(currentBlockchainId)
      .then((data) => {
        setTotalBytecodes(data);
      })
      .catch((err) => {
        console.error('Error fetching total bytecodes:', err);
        setErrorTotalBytecodes(
          err instanceof Error ? err : new Error(String(err))
        );
      })
      .finally(() => {
        setIsLoadingTotalBytecodes(false);
      });
  }, [
    currentBlockchainId,
    refreshFlag,
    service,
    isLoadingTotalBytecodes,
    totalBytecodes,
  ]);

  // Effect to fetch cache stats
  useEffect(() => {
    // Skip if no blockchain is selected
    if (!currentBlockchainId) {
      return;
    }

    // Determine if we should fetch
    const shouldFetch =
      // On initial mount
      isInitialMount.current ||
      // When user explicitly requests a refresh
      refreshFlag ||
      // When we don't have data yet
      !cacheStats;

    if (!shouldFetch || isLoadingCacheStats) {
      return;
    }

    setIsLoadingCacheStats(true);
    setErrorCacheStats(null);

    service
      .getCacheStats(currentBlockchainId)
      .then((data) => {
        setCacheStats(data);
      })
      .catch((err) => {
        console.error('Error fetching cache stats:', err);
        setErrorCacheStats(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setIsLoadingCacheStats(false);
      });
  }, [
    currentBlockchainId,
    refreshFlag,
    service,
    isLoadingCacheStats,
    cacheStats,
  ]);

  // Reset the refresh flag after both fetches complete
  useEffect(() => {
    if (!isLoadingTotalBytecodes && !isLoadingCacheStats && refreshFlag) {
      setRefreshFlag(false);
    }
  }, [isLoadingTotalBytecodes, isLoadingCacheStats, refreshFlag]);

  // Mark initial mount as complete after first render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, []);

  return {
    totalBytecodes,
    cacheStats,
    isLoadingTotalBytecodes: isLoadingTotalBytecodes || isLoadingBlockchain,
    isLoadingCacheStats: isLoadingCacheStats || isLoadingBlockchain,
    errorTotalBytecodes,
    errorCacheStats,
    refreshData,
    currentBlockchainId,
  };
}
