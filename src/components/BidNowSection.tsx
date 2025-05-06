import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeb3, TransactionStatus } from '@/hooks/useWeb3';
import { Contract, SuggestedBidsResponse } from '@/services/contractService';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { AlertTriangle, Loader2, RefreshCw, X } from 'lucide-react';
import cacheManagerAbi from '@/config/abis/cacheManager/cacheManager.json';
import { Abi } from 'viem';
import { useContractsUpdater } from '@/hooks/useContractsUpdater';
import { useContractService } from '@/hooks/useContractService';
import { formatEth, formatRoundedEth } from '@/utils/formatting';
import { toast } from 'sonner';

interface BidNowSectionProps {
  contract: Contract;
  bidAmount: string;
  setBidAmount: (value: string) => void;
  onSuccess?: () => void;
}

export function BidNowSection({
  contract,
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

  // State to track if we're actively polling (for UI feedback)
  const [isPolling, setIsPolling] = useState(false);

  // Store the last bid parameters for retry functionality
  const [lastBidParams, setLastBidParams] = useState<{
    address: `0x${string}`;
    abi: Abi;
    functionName: string;
    args: string[];
    value: string;
  } | null>(null);

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

  // Track if the component is in a disabled state (bidding or polling)
  const isDisabled =
    isPlacingBid ||
    isPolling ||
    (isSuccess && !hasReloaded) ||
    isContractCached;

  // Component ref for click outside detection
  const componentRef = useRef<HTMLDivElement>(null);

  // Function to handle retry of the last bid
  const handleRetry = useCallback(() => {
    if (!lastBidParams) {
      console.error('No previous bid parameters found to retry');
      return;
    }

    // Reset any previous error states
    reset();
    setHasReloaded(false);
    setIsPolling(false);

    // Re-submit the transaction with the same parameters
    writeContract(lastBidParams, (hash) => {
      console.log(`Retry transaction submitted with hash: ${hash}`);
    });
  }, [lastBidParams, writeContract, reset]);

  // Function to fetch the latest contract data and check cache status
  const pollContractStatus = useCallback(async () => {
    if (!contractService || !contract?.id) {
      return false;
    }

    try {
      console.log('Polling for contract cache status...');

      // Fetch the latest contract data from backend using getUserContract
      if (!contract.userContractId) {
        console.error('No user contract ID found for contract:', contract);
        return false;
      }
      const userContract = await contractService.getUserContract(
        contract.userContractId
      );
      console.log('Polled User contract:', userContract);
      // Check if the contract is now cached
      if (userContract?.contract?.bytecode?.isCached) {
        console.log('Contract is now cached in backend!');
        return true;
      }

      console.log('Contract not yet cached in backend, continuing to poll...');
      return false;
    } catch (err) {
      console.error('Error polling contract status:', err);
      return false;
    }
  }, [contractService, contract]);

  // Show error toast if transaction fails
  useEffect(() => {
    if (isError && error) {
      toast.custom(
        (t) => (
          <div className='flex items-center justify-between w-full bg-black text-white border border-white/10 p-3 rounded-lg shadow-lg gap-2'>
            <div className='flex-grow whitespace-nowrap mx-3 text-sm'>
              An error occurred while placing the Bid
            </div>

            <Button
              variant='outline'
              onClick={(e) => {
                e.stopPropagation(); // Prevent toast from closing
                handleRetry();
                toast.dismiss(t);
              }}
              className='flex-shrink-0 flex items-center justify-center gap-1 bg-transparent text-white border-white/30 hover:bg-white/10 whitespace-nowrap'
              size='sm'
            >
              <RefreshCw className='h-3.5 w-3.5 mr-1' />
              Retry
            </Button>
            <Button
              onClick={() => toast.dismiss(t)}
              className='flex-shrink-0 bg-transparent text-white border-white/30 hover:bg-white/10'
              size='sm'
              aria-label='Dismiss'
            >
              <X className='h-3 w-3' />
            </Button>
          </div>
        ),
        {
          duration: 5000, // Show for 5 seconds
          position: 'bottom-center', // Position at bottom center
          id: 'transaction-error-' + Date.now(), // to prevent duplicate toasts
          style: {
            minWidth: '400px', // Set minimum width to prevent wrapping
            width: 'auto',
            maxWidth: '500px', // Increased max width to accommodate text without wrapping
          },
        }
      );

      reset();
      setHasReloaded(false);
      setIsPolling(false);
    }
  }, [isError, error, reset, handleRetry]);

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
      const formattedBid = formatRoundedEth(ethValue, 8);
      console.log('Formatted bid:', formattedBid);
      setBidAmount(formattedBid);
    } catch (error) {
      console.error('Error converting bid value:', error);
      setBidAmount(bid);
    }

    setShowSuggestedButtons(true); // Keep the buttons visible after selection
  };

  // Open suggested bid buttons and fetch bids if needed
  const openSuggestedButtons = () => {
    if (!isContractCached) {
      setShowSuggestedButtons(true);

      // Refresh suggested bids on click
      fetchSuggestedBids();
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

      // Mark as reloaded and stop polling
      setHasReloaded(true);
      setIsPolling(false);
    }
  }, [contract, signalContractUpdated, onSuccess]);

  // Reset the form when transaction completes and start polling for contract status
  useEffect(() => {
    if (isSuccess && !hasReloaded) {
      console.log(
        'Transaction successful, starting to poll for contract status...'
      );
      setBidAmount('');

      // Set polling state to true to update UI
      setIsPolling(true);

      // Variable to track if polling should continue
      let shouldContinuePolling = true;

      // Function to poll for contract status
      const startPolling = async () => {
        // Use a simple poll loop with a 3-second interval
        const maxAttempts = 20; // Try for up to 60 seconds
        let attempts = 0;

        console.log('Starting to poll for contract cache status');

        // Poll every 3 seconds until the contract is cached or we stop polling
        while (shouldContinuePolling && attempts < maxAttempts) {
          attempts++;
          console.log(`Polling attempt ${attempts}/${maxAttempts}`);

          try {
            const isCached = await pollContractStatus();

            if (isCached) {
              console.log('Contract is now cached, reloading data');
              // Set polling to false before reloading data
              setIsPolling(false);
              reloadContractData();
              return;
            }

            // If not cached yet and not at max attempts, wait and try again
            if (attempts < maxAttempts) {
              console.log('Waiting 3 seconds before next poll attempt');
              await new Promise((resolve) => setTimeout(resolve, 3000));
            } else {
              console.log('Max polling attempts reached, forcing reload');
              // Set polling to false before reloading data
              setIsPolling(false);
              reloadContractData();
            }
          } catch (error) {
            console.error('Error during polling:', error);

            // Wait before retry even if there was an error
            if (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 3000));
            } else {
              // If we've hit max attempts, force reload and stop polling
              console.log(
                'Max polling attempts reached after errors, stopping polling'
              );
              setIsPolling(false);
              reloadContractData();
            }
          }
        }
      };

      // Start polling
      startPolling();

      // Clean up function to stop polling when component unmounts
      return () => {
        shouldContinuePolling = false;
        setIsPolling(false);
      };
    }
  }, [
    isSuccess,
    hasReloaded,
    pollContractStatus,
    reloadContractData,
    setBidAmount,
  ]);

  // Reset reload state when reset is called or when transaction changes
  useEffect(() => {
    if (status === TransactionStatus.IDLE) {
      setHasReloaded(false);
      setIsPolling(false);
    }
  }, [status]);

  // Add click outside listener to close suggested buttons
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        componentRef.current &&
        !componentRef.current.contains(event.target as Node)
      ) {
        setShowSuggestedButtons(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      // Create and store the bid parameters for potential retry
      const bidParams = {
        address: currentBlockchain.cacheManagerAddress as `0x${string}`,
        abi: cacheManagerAbi.abi as Abi,
        functionName: 'placeBid',
        args: [contract.address],
        value: bidAmount,
      };

      // Store the parameters for retry functionality
      setLastBidParams(bidParams);

      // Use writeContract from useWeb3 to place the bid
      writeContract(bidParams, (hash) => {
        // This callback is called when the transaction hash is available
        console.log(`Transaction submitted with hash: ${hash}`);
      });
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
      ref={componentRef}
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
        {/* {!isGasPriceHigh && gasPriceGwei && (
          <div className='text-xs text-blue-200 mb-2'>
            Current network fee: {gasPriceGwei} Gwei
          </div>
        )} */}

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
            <div className='relative w-full max-w-[200px]'>
              <Input
                type='text'
                placeholder='Bid amount'
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className={`pr-12 bg-white border-none text-gray-500${
                  isDisabled
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                    : ''
                }`}
                disabled={isDisabled}
                onClick={openSuggestedButtons}
              />
              <div
                className={`absolute right-3 top-0 bottom-0 flex items-center pointer-events-none ${
                  isDisabled
                    ? 'text-gray-400 cursor-not-allowed opacity-60'
                    : 'text-gray-500'
                }`}
              >
                ETH
              </div>
            </div>
            <Button
              onClick={handleSubmitBid}
              disabled={isDisabled}
              className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center'
            >
              {isPlacingBid ? (
                <div className='flex items-center'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                </div>
              ) : isSuccess && !hasReloaded ? (
                <div className='flex items-center'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                </div>
              ) : (
                'Place Bid'
              )}
            </Button>
          </div>
        </div>

        {/* Suggested bid buttons */}
        {!isContractCached && showSuggestedButtons && suggestedBids && (
          <div className='flex justify-between gap-2 mt-3'>
            <Button
              size='sm'
              className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center'
              onClick={(e) => {
                e.stopPropagation();
                setBidAmount('');
              }}
              disabled={isDisabled}
            >
              Clear
            </Button>
            <div className='flex gap-2'>
              <Button
                size='sm'
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center'
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectBid(suggestedBids.suggestedBids.lowRisk);
                }}
                disabled={isDisabled}
              >
                Low Risk:{' '}
                {formatRoundedEth(
                  formatEth(suggestedBids.suggestedBids.lowRisk)
                )}
              </Button>
              <Button
                size='sm'
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center'
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectBid(suggestedBids.suggestedBids.midRisk);
                }}
                disabled={isDisabled}
              >
                Mid Risk:{' '}
                {formatRoundedEth(
                  formatEth(suggestedBids.suggestedBids.midRisk)
                )}
              </Button>
              <Button
                size='sm'
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center'
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectBid(suggestedBids.suggestedBids.highRisk);
                }}
                disabled={isDisabled}
              >
                High Risk:{' '}
                {formatRoundedEth(
                  formatEth(suggestedBids.suggestedBids.highRisk)
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BidNowSection;
