import React, { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3, TransactionStatus } from '@/hooks/useWeb3';
import { Contract } from '@/services/contractService';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { AlertTriangle, Loader2 } from 'lucide-react';
import cacheManagerAbi from '@/config/abis/cacheManager/cacheManager.json';
import { Abi } from 'viem';
import { useContractsUpdater } from '@/hooks/useContractsUpdater';

interface BidNowSectionProps {
  contract: Contract;
  minBidAmount: string;
  bidAmount: string;
  setBidAmount: (value: string) => void;
  onSuccess?: () => void;
}

export function BidNowSection({
  contract,
  minBidAmount,
  bidAmount,
  setBidAmount,
  onSuccess,
}: BidNowSectionProps) {
  // Get the current blockchain
  const { currentBlockchain } = useBlockchainService();

  // Get the contracts updater
  const { signalContractUpdated } = useContractsUpdater();

  // State to prevent multiple reloads
  const [hasReloaded, setHasReloaded] = useState(false);

  // Use the web3 hook
  const {
    writeContract,
    status,
    txHash,
    error,
    reset,
    gasPriceGwei,
    isGasPriceHigh,
  } = useWeb3({
    // Set gas protection configuration
    gasProtection: {
      maxGasPriceGwei: 500, // Maximum gas price in Gwei
      gasLimit: BigInt(500000), // Gas limit
    },
  });

  // Track if transaction is in progress
  const isPlacingBid =
    status === TransactionStatus.PENDING ||
    status === TransactionStatus.PREPARING;

  // Track if transaction is complete
  const isSuccess = status === TransactionStatus.SUCCESS;

  // Track if there was an error
  const isError = status === TransactionStatus.ERROR;

  // Handle reload of contract data
  const reloadContractData = useCallback(() => {
    if (contract && contract.id) {
      console.log('Reloading contract data...');
      // Signal that contract should be updated
      signalContractUpdated(contract.id, 'bid');

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Mark as reloaded
      setHasReloaded(true);
    }
  }, [contract, signalContractUpdated, onSuccess]);

  // Reset the form when transaction completes and schedule a reload
  useEffect(() => {
    if (isSuccess && !hasReloaded) {
      console.log('Transaction successful, scheduling reload...');
      setBidAmount('');

      // Schedule a reload of contract data after 3 seconds
      const reloadTimer = setTimeout(() => {
        reloadContractData();
      }, 6000);

      // Cleanup the timer if component unmounts
      return () => clearTimeout(reloadTimer);
    }
  }, [isSuccess, hasReloaded, setBidAmount, reloadContractData]);

  // Reset reload state when reset is called or when transaction changes
  useEffect(() => {
    if (status === TransactionStatus.IDLE) {
      setHasReloaded(false);
    }
  }, [status]);

  // Show error in console if transaction fails
  useEffect(() => {
    if (isError && error) {
      // Use console.error for now instead of toast
      console.error(`Error placing bid: ${error.message}`);
      reset();
      setHasReloaded(false);
    }
  }, [isError, error, reset]);

  // Handle bid submission
  const handleSubmitBid = () => {
    if (!currentBlockchain) {
      console.error(
        'No blockchain connected. Please connect your wallet to the correct network.'
      );
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      console.error('Please enter a valid bid amount');
      return;
    }

    try {
      // Reset the reloaded state before starting a new transaction
      setHasReloaded(false);

      // Use writeContract from useWeb3 to place the bid
      writeContract(
        {
          address: currentBlockchain.cacheManagerAddress as `0x${string}`,
          abi: cacheManagerAbi.abi as Abi,
          functionName: 'placeBid',
          args: [contract.address],
          value: bidAmount,
        },
        (hash) => {
          // This callback is called when the transaction hash is available
          console.log(`Transaction submitted with hash: ${hash}`);
        }
      );
    } catch (err) {
      console.error('Error submitting bid:', err);
      console.error(
        `Error placing bid: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    }
  };

  // Manual reset function that also resets reload state
  const handleReset = () => {
    reset();
    setHasReloaded(false);
  };

  return (
    <div
      className='relative rounded-md p-4 overflow-hidden'
      style={{
        background:
          'linear-gradient(89.49deg, #3E71C6 0%, #5897B2 55.53%, #C35B88 103.8%)',
      }}
    >
      {/* White noise texture overlay */}
      <div
        className='absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='white'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div className='flex flex-col relative z-10'>
        {/* Gas Price Warning */}
        {isGasPriceHigh && (
          <div className='bg-red-900/70 text-white p-2 rounded-md mb-3 flex items-center'>
            <AlertTriangle className='w-5 h-5 mr-2 text-red-300' />
            <span className='text-sm'>
              Warning: Network fees are extremely high{' '}
              {gasPriceGwei && `(${gasPriceGwei} Gwei)`}. Consider waiting for
              lower gas prices.
            </span>
          </div>
        )}

        {/* Normal Gas Price Info */}
        {!isGasPriceHigh && gasPriceGwei && (
          <div className='text-xs text-blue-200 mb-2'>
            Current network fee: {gasPriceGwei} Gwei
          </div>
        )}

        <div className='flex justify-between items-start'>
          <div>
            <p className='font-bold'>Bid now</p>
            <p className='text-sm text-blue-200'>
              Higher bids extend cache duration
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <div className='relative rounded-md overflow-hidden'>
              <input
                type='text'
                placeholder={`From ${minBidAmount}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className='px-3 py-2 bg-white border-none outline-none text-[#B1B1B1] w-50'
                disabled={isPlacingBid || isGasPriceHigh || isSuccess}
              />
            </div>
            {isSuccess ? (
              <Button
                className='px-4 py-2 rounded-md bg-transparent border border-white'
                onClick={handleReset}
              >
                New Bid
              </Button>
            ) : (
              <Button
                className='px-4 py-2 rounded-md bg-transparent border border-white'
                onClick={handleSubmitBid}
                disabled={isPlacingBid || isGasPriceHigh}
              >
                {isPlacingBid ? (
                  <span className='flex items-center'>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Placing Bid...
                  </span>
                ) : (
                  'Place bid'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BidNowSection;
