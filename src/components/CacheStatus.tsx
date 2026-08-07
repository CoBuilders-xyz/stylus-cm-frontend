'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useCacheMetrics } from '@/hooks/useCacheMetrics';
import {
  CacheMetricsService,
  BidTrendsResponse,
} from '@/services/cacheMetricsService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuthentication } from '@/context/AuthenticationProvider';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import SidePanel from '@/components/SidePanel';
import AddContract from '@/components/AddContract';
import ConnectWallet from '@/components/ConnectWallet';
import NoticeBanner from '@/components/NoticeBanner';
import authRequiredImage from 'public/auth-required.svg';

export default function CacheStatus() {
  const {
    totalBytecodes,
    cacheStats,
    isLoadingTotalBytecodes,
    isLoadingCacheStats,
    errorTotalBytecodes,
    errorCacheStats,
    currentBlockchainId,
  } = useCacheMetrics();

  const { isAuthenticated } = useAuthentication();

  // Monthly insert/delete totals for the two activity tiles
  const metricsService = useMemo(() => new CacheMetricsService(), []);
  const [bidTrends, setBidTrends] = useState<BidTrendsResponse | null>(null);
  const [bidTrendsError, setBidTrendsError] = useState(false);
  useEffect(() => {
    setBidTrends(null);
    setBidTrendsError(false);
    if (!currentBlockchainId) return;
    let cancelled = false;
    metricsService
      .getBidTrends(currentBlockchainId, 'M')
      .then((res) => {
        if (!cancelled) setBidTrends(res);
      })
      .catch(() => {
        if (!cancelled) {
          setBidTrends(null);
          setBidTrendsError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentBlockchainId, metricsService]);

  // State for auth modal and side panel
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelWidth = '53%';

  // Handler for adding a new contract
  const handleAddNewContract = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <div className='flex flex-col w-full'>
        <div className='w-full page-gutter pt-5'>
          <div className='flex justify-between items-center gap-4 mb-5'>
            <div className='flex flex-col'>
              <h1 className='page-title'>Cache Status</h1>
              <p className='page-desc'>
                Monitor the status of contract caching across multiple chains
              </p>
            </div>
            <Button onClick={handleAddNewContract}>
              <span>+</span>
              <span>Add Contract</span>
            </Button>
          </div>

          <div className='grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 mb-6'>
            {/* Total Contracts Card */}
            <div className='app-card px-4 py-3.5'>
              <h2 className='tile-label'>Total Contracts</h2>
              {isLoadingTotalBytecodes || !currentBlockchainId ? (
                <div className='mt-2 space-y-1'>
                  <Skeleton className='h-8 w-24 bg-surface-3' />
                  <Skeleton className='h-3 w-20 bg-surface-3' />
                </div>
              ) : errorTotalBytecodes ? (
                <p className='text-red-500 mt-2 text-sm'>Error loading data</p>
              ) : totalBytecodes ? (
                <>
                  <p className='stat-value mt-1.5'>
                    {totalBytecodes.bytecodeCount.toLocaleString()}
                  </p>
                  <p className='text-xs mt-0.5 text-ink-3'>
                    <span
                      className={
                        totalBytecodes.bytecodeCountDiffWithLastMonth > 0
                          ? 'text-ok-text font-medium'
                          : ''
                      }
                    >
                      {totalBytecodes.bytecodeCountDiffWithLastMonth > 0
                        ? '+'
                        : ''}
                      {totalBytecodes.bytecodeCountDiffWithLastMonth.toLocaleString()}
                    </span>{' '}
                    from last month
                  </p>
                </>
              ) : (
                <p className='text-ink-2 mt-2 text-sm'>No data available</p>
              )}
            </div>

            {/* Available Cache Space Card */}
            <div className='app-card px-4 py-3.5'>
              <h2 className='tile-label'>Available Cache Space</h2>
              {isLoadingCacheStats || !currentBlockchainId ? (
                <div className='mt-2 space-y-2'>
                  <Skeleton className='h-8 w-24 bg-surface-3' />
                  <div className='space-y-1'>
                    <Skeleton className='h-3 w-full bg-surface-3' />
                    <Skeleton className='h-3 w-full bg-surface-3' />
                  </div>
                  <Skeleton className='h-2 w-full bg-surface-3 rounded-full' />
                </div>
              ) : errorCacheStats ? (
                <p className='text-red-500 mt-2 text-sm'>Error loading data</p>
              ) : cacheStats ? (
                <>
                  <p className='stat-value mt-1.5'>
                    {(100 - cacheStats.cacheFilledPercentage).toFixed(1)}
                    <span className='text-[13px] font-medium text-ink-2 ms-0.5'>
                      %
                    </span>
                  </p>

                  {/* Progress meter */}
                  <div className='mt-2.5'>
                    <div className='relative h-1 w-full overflow-hidden rounded-full bg-surface-3'>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          cacheStats.cacheFilledPercentage > 90
                            ? 'bg-warn'
                            : 'bg-accent-blue'
                        }`}
                        style={{
                          width: `${cacheStats.cacheFilledPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className='text-xs mt-1.5 text-ink-3 num'>
                    {cacheStats.cacheFilledPercentage.toFixed(1)}% used
                  </p>
                </>
              ) : (
                <p className='text-ink-1 mt-2 text-sm'>No data available</p>
              )}
            </div>

            {/* Insertions (last 30 days) */}
            <div className='app-card px-4 py-3.5'>
              <h2 className='tile-label'>Insertions &middot; 30d</h2>
              {bidTrends ? (
                <>
                  <p className='stat-value mt-1.5'>
                    {bidTrends.global.insertCount.toLocaleString()}
                  </p>
                  <p className='text-xs mt-0.5 text-ink-3'>
                    bids placed across the cache
                  </p>
                </>
              ) : bidTrendsError ? (
                <p className='text-sm mt-2 text-ink-3'>Data unavailable</p>
              ) : (
                <div className='mt-2 space-y-1'>
                  <Skeleton className='h-7 w-16 bg-surface-3' />
                  <Skeleton className='h-3 w-24 bg-surface-3' />
                </div>
              )}
            </div>

            {/* Deletions (last 30 days) */}
            <div className='app-card px-4 py-3.5'>
              <h2 className='tile-label'>Deletions &middot; 30d</h2>
              {bidTrends ? (
                <>
                  <p className='stat-value mt-1.5'>
                    {bidTrends.global.deleteCount.toLocaleString()}
                  </p>
                  <p className='text-xs mt-0.5 text-ink-3'>
                    evictions from the cache
                  </p>
                </>
              ) : bidTrendsError ? (
                <p className='text-sm mt-2 text-ink-3'>Data unavailable</p>
              ) : (
                <div className='mt-2 space-y-1'>
                  <Skeleton className='h-7 w-16 bg-surface-3' />
                  <Skeleton className='h-3 w-24 bg-surface-3' />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel for Adding Contract */}
      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        width={panelWidth}
        ariaLabel='Add contract'
      >
        {isPanelOpen && (
          <AddContract
            shouldRedirect={true}
            onSuccess={() => {
              setIsPanelOpen(false);
            }}
          />
        )}
      </SidePanel>

      {/* Authentication Modal */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className='bg-surface-1 border-hairline-strong sm:max-w-md'>
          <DialogTitle className='sr-only'>Authentication Required</DialogTitle>
          <div className='p-4'>
            <NoticeBanner
              image={authRequiredImage}
              title='Authentication Required'
              description='Please connect to your wallet and sign the transaction to add contracts.'
            />
            <div className='flex justify-center'>
              <ConnectWallet customCallback={() => setIsAuthModalOpen(false)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
