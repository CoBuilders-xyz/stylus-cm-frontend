'use client';

import React, { useState } from 'react';
import { useCacheMetrics } from '@/hooks/useCacheMetrics';
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
      <div className='flex flex-col w-full pt-16'>
        <div
          className='w-full p-8 px-10'
          style={{
            background:
              'linear-gradient(180deg, #116AAE -193.97%, #072C48 152.16%)',
          }}
        >
          <div className='flex justify-between'>
            <div className='flex flex-col'>
              <h1 className='text-3xl font-bold text-white'>Cache Status</h1>
              <p className='text-gray-300 mt-1 opacity-60'>
                Monitor the status of contract caching across multiple chains
              </p>
            </div>
            <Button
              className='px-4 py-2 bg-black text-white border border-white rounded-md flex items-center gap-2'
              onClick={handleAddNewContract}
            >
              <span>+</span>
              <span>Add Your Stylus Contract to the Cache</span>
            </Button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
            {/* Total Contracts Card */}
            <div className='p-6 rounded-md' style={{ background: '#1A1919' }}>
              <h2 className='text-gray-300 font-medium'>Total Contracts</h2>
              {isLoadingTotalBytecodes || !currentBlockchainId ? (
                <div className='mt-2 space-y-2'>
                  <Skeleton className='h-10 w-32 bg-slate-700' />
                  <Skeleton className='h-4 w-24 bg-slate-700' />
                </div>
              ) : errorTotalBytecodes ? (
                <p className='text-red-500 mt-2'>Error loading data</p>
              ) : totalBytecodes ? (
                <>
                  <p className='text-3xl font-bold text-white mt-2'>
                    {totalBytecodes.bytecodeCount.toLocaleString()}
                  </p>
                  <p className='text-[#B1B1B1] text-sm mt-1'>
                    {totalBytecodes.bytecodeCountDiffWithLastMonth > 0
                      ? '+'
                      : ''}
                    {totalBytecodes.bytecodeCountDiffWithLastMonth.toLocaleString()}{' '}
                    from last month
                  </p>
                </>
              ) : (
                <p className='text-white mt-2'>No data available</p>
              )}
            </div>

            {/* Available Cache Space Card */}
            <div className='p-6 rounded-md' style={{ background: '#1A1919' }}>
              <h2 className='text-gray-300 font-medium'>
                Available Cache Space
              </h2>
              {isLoadingCacheStats || !currentBlockchainId ? (
                <div className='mt-2 space-y-2'>
                  <Skeleton className='h-10 w-32 bg-slate-700' />
                  <Skeleton className='h-4 w-24 bg-slate-700' />
                </div>
              ) : errorCacheStats ? (
                <p className='text-red-500 mt-2'>Error loading data</p>
              ) : cacheStats ? (
                <>
                  <p className='text-3xl font-bold text-white mt-2 mb-4'>
                    {(100 - cacheStats.cacheFilledPercentage).toFixed(1)}%
                  </p>

                  {/* Used and Available Labels on Separate Lines */}
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-400'>Used</span>
                      <span className='text-green-400 font-medium'>
                        {cacheStats.cacheFilledPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-400'>Available</span>
                      <span className='text-white font-medium'>
                        {(100 - cacheStats.cacheFilledPercentage).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar with Custom Styling */}
                  <div className='mt-4 mb-4'>
                    <div className='relative h-3 w-full overflow-hidden rounded-full bg-gray-700'>
                      {/* Used portion (filled from left) */}
                      <div
                        className='h-full bg-green-500 transition-all duration-300'
                        style={{
                          width: `${cacheStats.cacheFilledPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className='text-white mt-2'>No data available</p>
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
        <DialogContent className='bg-black border-gray-700 max-w-md'>
          <DialogTitle className='sr-only'>Authentication Required</DialogTitle>
          <div className='p-4'>
            <NoticeBanner
              image={authRequiredImage}
              title='Authentication Required'
              description='Please connect to your wallet and sign the transaction to add contracts.'
            />
            <div className='flex justify-center'>
              <div className='px-4 py-2 bg-black text-white border border-white rounded-md inline-flex items-center gap-2'>
                <ConnectWallet
                  customCallback={() => setIsAuthModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
