import React, { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWeb3, TransactionStatus } from '@/hooks/useWeb3';
import { Contract, SuggestedBidsResponse } from '@/services/contractService';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { AlertTriangle, Loader2 } from 'lucide-react';
import cacheManagerAbi from '@/config/abis/cacheManager/cacheManager.json';
import { Abi } from 'viem';
import { useContractsUpdater } from '@/hooks/useContractsUpdater';
import { useContractService } from '@/hooks/useContractService';
import { formatEth } from '@/utils/formatting';

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

  // Get the contract service
  const contractService = useContractService();

  // State to prevent multiple reloads
  const [hasReloaded, setHasReloaded] = useState(false);

  // State for suggested bids
  const [showSuggestedButtons, setShowSuggestedButtons] = useState(false);
  const [suggestedBids, setSuggestedBids] =
    useState<SuggestedBidsResponse | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Use the web3 hook
  const { writeContract, status, error, reset, gasPriceGwei, isGasPriceHigh } =
    useWeb3({
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

  // Check if contract is already cached
  const isContractCached = contract?.bytecode?.isCached || false;

  // Fetch suggested bids
  const fetchSuggestedBids = useCallback(async () => {
    if (!contractService || !contract?.address || !currentBlockchain?.id) {
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const suggestions = await contractService.getSuggestedBidsByAddress(
        contract.address,
        currentBlockchain.id
      );
      setSuggestedBids(suggestions);
    } catch (err) {
      console.error('Error fetching suggested bids:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [contractService, contract?.address, currentBlockchain?.id]);

  // Keep the existing effect that fetches suggestions when showing suggestions
  useEffect(() => {
    if (showSuggestedButtons && !suggestedBids && !isLoadingSuggestions) {
      fetchSuggestedBids();
    }
  }, [
    showSuggestedButtons,
    suggestedBids,
    isLoadingSuggestions,
    fetchSuggestedBids,
  ]);

  // Handle bid selection
  const handleSelectBid = (bid: string) => {
    // Format the bid value for display and use
    try {
      // Convert from Wei to ETH with proper precision
      const bidBigInt = BigInt(bid);
      const divisor = BigInt(10 ** 18);

      // Calculate whole and decimal parts
      const wholePart = bidBigInt / divisor;
      const fractionalPart = bidBigInt % divisor;

      // Format with sufficient decimal places (up to 18)
      const fractionalStr = fractionalPart.toString().padStart(18, '0');

      // Remove trailing zeros
      const trimmedFractional = fractionalStr.replace(/0+$/, '');

      // Create the final ETH value as a string
      let ethValue = wholePart.toString();
      if (trimmedFractional.length > 0) {
        ethValue += '.' + trimmedFractional;
      }

      setBidAmount(ethValue);
    } catch (error) {
      console.error('Error converting bid value:', error);
      setBidAmount(bid);
    }

    setShowSuggestedButtons(true); // Keep the buttons visible after selection
  };

  // Open suggested bid buttons (not toggle)
  const openSuggestedButtons = () => {
    if (!isContractCached && !showSuggestedButtons) {
      setShowSuggestedButtons(true);
    }
  };

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

      // Schedule a reload of contract data after 6 seconds
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
  const handleSubmitBid = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isContractCached) {
      console.error('Cannot place bid on already cached contracts');
      return;
    }

    if (!currentBlockchain) {
      console.error(
        'No blockchain connected. Please connect your wallet to the correct network.'
      );
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) < 0) {
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

  return (
    <div
      className='relative rounded-md p-4 overflow-hidden'
      style={{
        background:
          'linear-gradient(89.49deg, #3E71C6 0%, #5897B2 55.53%, #C35B88 103.8%)',
      }}
      onClick={openSuggestedButtons}
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
              {isContractCached
                ? 'Bidding disabled for cached contracts'
                : 'Higher bids extend cache duration'}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <div className='relative rounded-md overflow-hidden'>
              <input
                type='text'
                placeholder={`From ${minBidAmount}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className={`px-3 py-2 border-none outline-none w-50 ${
                  isContractCached
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-white text-[#B1B1B1]'
                }`}
                disabled={isPlacingBid || isGasPriceHigh || isContractCached}
                onClick={openSuggestedButtons}
              />
            </div>
            <Button
              className={`px-4 py-2 rounded-md border ${
                isContractCached
                  ? 'bg-gray-700 border-gray-600 text-gray-400 opacity-60 cursor-not-allowed'
                  : 'bg-transparent border-white'
              }`}
              onClick={handleSubmitBid}
              disabled={isPlacingBid || isGasPriceHigh || isContractCached}
            >
              {isPlacingBid ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Place bid'
              )}
            </Button>
          </div>
        </div>

        {/* Suggested bid buttons */}
        {!isContractCached && showSuggestedButtons && suggestedBids && (
          <div className='flex justify-end gap-2 mt-3'>
            <Button
              size='sm'
              className='bg-transparent border border-blue-200 text-xs text-white hover:bg-blue-700 flex items-center'
              onClick={(e) => {
                e.stopPropagation();
                handleSelectBid(suggestedBids.suggestedBids.lowRisk);
              }}
              title="Low risk of eviction from cache - recommended for contracts that don't need immediate state access"
            >
              Low Risk: {formatEth(suggestedBids.suggestedBids.lowRisk)}
            </Button>
            <Button
              size='sm'
              className='bg-transparent border border-blue-200 text-xs text-white hover:bg-blue-700 flex items-center'
              onClick={(e) => {
                e.stopPropagation();
                handleSelectBid(suggestedBids.suggestedBids.midRisk);
              }}
              title='Medium risk of eviction - balanced option for most contracts'
            >
              Mid Risk: {formatEth(suggestedBids.suggestedBids.midRisk)}
            </Button>
            <Button
              size='sm'
              className='bg-transparent border border-blue-200 text-xs text-white hover:bg-blue-700 flex items-center'
              onClick={(e) => {
                e.stopPropagation();
                handleSelectBid(suggestedBids.suggestedBids.highRisk);
              }}
              title='High risk of eviction - minimum viable bid to compete in the cache'
            >
              High Risk: {formatEth(suggestedBids.suggestedBids.highRisk)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BidNowSection;
