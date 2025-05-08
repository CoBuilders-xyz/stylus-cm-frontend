import React, { useState, useEffect, useCallback } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWeb3, TransactionStatus } from '@/hooks/useWeb3';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { toast } from 'sonner';
import { Abi } from 'viem';
import { AlertTriangle, Loader2, RefreshCw, X } from 'lucide-react';
import cacheManagerAutomationAbi from '@/config/abis/cacheManagerAutomation/CacheManagerAutomation.json';
import { formatWei, formatEth } from '@/utils/formatting';
import { useReadContract, useAccount } from 'wagmi';

interface AutomatedBiddingSectionProps {
  automatedBidding: boolean;
  setAutomatedBidding: (value: boolean) => void;
  maxBidAmount?: string;
  setMaxBidAmount?: (value: string) => void;
  automationFunding?: string;
  setAutomationFunding?: (value: string) => void;
  contract?: { address: string; maxBid?: string; isAutomated?: boolean };
  onSuccess?: () => void;
}

export function AutomatedBiddingSection({
  automatedBidding,
  setAutomatedBidding,
  maxBidAmount = '',
  setMaxBidAmount = () => {},
  automationFunding = '',
  setAutomationFunding = () => {},
  contract,
  onSuccess,
}: AutomatedBiddingSectionProps) {
  // Local state for input values to ensure they update immediately
  const [inputValue, setInputValue] = useState(maxBidAmount);
  const [fundingValue, setFundingValue] = useState(automationFunding);
  const [inputError, setInputError] = useState<string | null>(null);
  const [fundingError, setFundingError] = useState<string | null>(null);
  // Add isInitialized flag to track when component has initialized from contract data
  const [isInitialized, setIsInitialized] = useState(false);

  // Get the current blockchain
  const { currentBlockchain } = useBlockchainService();

  // Get the connected account
  const { address: userAddress, isConnected } = useAccount();

  // Get user balance from cache manager automation contract
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: currentBlockchain?.cacheManagerAutomationAddress as `0x${string}`,
    abi: cacheManagerAutomationAbi.abi as Abi,
    functionName: 'getUserBalance',
    account: userAddress, // Include the user's address to properly sign the request
    query: {
      enabled:
        !!currentBlockchain?.cacheManagerAutomationAddress &&
        isConnected &&
        !!userAddress,
    },
  });

  // Format user balance for display
  const formattedUserBalance = userBalance
    ? formatEth(userBalance.toString())
    : '0';

  // Initialize from contract data if not already initialized
  useEffect(() => {
    if (!isInitialized && contract) {
      // If contract has isAutomated field, use that
      if (contract.isAutomated !== undefined) {
        setAutomatedBidding(contract.isAutomated);
      }

      // If contract has maxBid field, use that
      if (contract.maxBid) {
        // Convert from Wei to ETH for display in the input field
        const maxBidInEth = formatEth(contract.maxBid);
        setMaxBidAmount(maxBidInEth);
        setInputValue(maxBidInEth);
      }

      // Mark as initialized
      setIsInitialized(true);
    }
  }, [contract, isInitialized, setAutomatedBidding, setMaxBidAmount]);

  // Store the last transaction parameters for retry functionality
  const [lastTxParams, setLastTxParams] = useState<{
    address: `0x${string}`;
    abi: Abi;
    functionName: string;
    args: [string, bigint, boolean];
    value: string;
  } | null>(null);

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
  const isTransactionInProgress =
    status === TransactionStatus.PENDING ||
    status === TransactionStatus.PREPARING;

  // Track if transaction is complete
  const isSuccess = status === TransactionStatus.SUCCESS;

  // Track if there was an error
  const isError = status === TransactionStatus.ERROR;

  // Sync local state with prop values when they change
  useEffect(() => {
    // Only update local state if maxBidAmount changes after initialization
    if (isInitialized) {
      setInputValue(maxBidAmount);
    }
  }, [maxBidAmount, isInitialized]);

  useEffect(() => {
    // Only update local state if automationFunding changes after initialization
    if (isInitialized) {
      setFundingValue(automationFunding);
    }
  }, [automationFunding, isInitialized]);

  // Function to handle retry of the last transaction
  const handleRetry = useCallback(() => {
    if (!lastTxParams) {
      console.error('No previous transaction parameters found to retry');
      return;
    }

    // Reset any previous error states
    reset();

    // Re-submit the transaction with the same parameters
    writeContract(lastTxParams, (hash) => {
      console.log(`Retry transaction submitted with hash: ${hash}`);
    });
  }, [lastTxParams, writeContract, reset]);

  // Show error toast if transaction fails
  useEffect(() => {
    if (isError && error) {
      toast.custom(
        (t) => (
          <div className='flex items-center justify-between w-full bg-black text-white border border-white/10 p-3 rounded-lg shadow-lg gap-2'>
            <div className='flex-grow whitespace-nowrap mx-3 text-sm'>
              An error occurred while setting up automated bidding
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
            width: 'auto',
          },
        }
      );

      reset();
    }
  }, [isError, error, reset, handleRetry]);

  // Show success toast when transaction completes
  useEffect(() => {
    if (isSuccess) {
      toast.custom(
        () => (
          <div className='flex items-center w-full bg-black text-white border border-white/10 p-3 rounded-lg shadow-lg'>
            <div className='flex-grow whitespace-nowrap mx-3 text-sm text-center'>
              Automated bidding configured successfully
            </div>
          </div>
        ),
        {
          duration: 5000, // Show for 5 seconds
          position: 'bottom-center', // Position at bottom center
          id: 'transaction-success-' + Date.now(), // to prevent duplicate toasts
          style: {
            width: 'auto',
          },
        }
      );

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      reset();

      // Refetch user balance after successful transaction
      refetchBalance();
    }
  }, [isSuccess, onSuccess, reset, refetchBalance]);

  // Validate numeric input - only validate format, don't set error for empty values
  const validateNumericInput = (
    value: string,
    setError: (error: string | null) => void
  ) => {
    if (!value) {
      return false;
    }

    // Check if the input is a valid number
    const isValidNumber = /^[0-9]*\.?[0-9]*$/.test(value);
    if (!isValidNumber) {
      setError('Enter a valid amount');
      return false;
    }

    if (parseFloat(value) < 0) {
      setError('Amount cannot be negative');
      return false;
    }

    setError(null);
    return true;
  };

  // Handle max bid amount input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Update local state immediately to show typing in real-time
    setInputValue(value);

    // Clear the error if input is emptied
    if (!value) {
      setInputError(null);
    } else {
      // Only validate the format for non-empty values
      validateNumericInput(value, setInputError);
    }

    setMaxBidAmount(value);
  };

  // Handle automation funding input change
  const handleFundingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Update local state immediately to show typing in real-time
    setFundingValue(value);

    // Clear the error if input is emptied
    if (!value) {
      setFundingError(null);
    } else {
      // Only validate the format for non-empty values
      validateNumericInput(value, setFundingError);
    }

    setAutomationFunding(value);
  };

  // Handle set bid button click
  const handleSetBid = () => {
    let hasError = false;

    // When button is clicked, check for empty values and show error if needed
    if (!inputValue) {
      setInputError('Enter a valid Bid Amount');
      hasError = true;
    }

    if (!fundingValue) {
      setFundingError('Enter a valid Amount');
      hasError = true;
    }

    if (hasError) return;

    const isMaxBidValid = validateNumericInput(inputValue, setInputError);
    const isFundingValid = validateNumericInput(fundingValue, setFundingError);

    if (!isMaxBidValid || !isFundingValid) {
      return;
    }

    if (!currentBlockchain) {
      console.error(
        'No blockchain connected. Please connect your wallet to the correct network.'
      );
      return;
    }

    if (!contract || !contract.address) {
      console.error('No contract address provided');
      return;
    }

    try {
      // Create transaction parameters
      const txParams = {
        address:
          currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
        abi: cacheManagerAutomationAbi.abi as Abi,
        functionName: 'insertOrUpdateContract',
        args: [contract.address, formatWei(inputValue), automatedBidding] as [
          string,
          bigint,
          boolean
        ],
        value: fundingValue, // This is the amount to fund the automation (ETH)
      };

      // Store the parameters for retry functionality
      setLastTxParams(txParams);

      // Send the transaction
      writeContract(txParams, (hash) => {
        console.log(`Transaction submitted with hash: ${hash}`);
      });

      console.log('Automated bidding settings:', {
        contract: contract.address,
        maxBid: inputValue,
        enabled: automatedBidding,
        funding: fundingValue,
      });

      // Note: After the transaction is successful, the onSuccess callback will be called,
      // which should update the contract data in the backend with the new maxBid and isAutomated values
    } catch (err) {
      console.error('Error submitting transaction:', err);
    }
  };

  return (
    <div
      className='relative rounded-md p-4 overflow-hidden'
      style={{
        background: 'linear-gradient(89.49deg, #3E71C6 0%, #5897B2 103.8%)',
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

      {/* Gas Price Warning */}
      {isGasPriceHigh && (
        <div className='bg-red-900/70 text-white p-2 rounded-md mb-3 flex items-center relative z-10'>
          <AlertTriangle className='w-5 h-5 mr-2 text-red-300' />
          <span className='text-sm'>
            Warning: Network fees are extremely high{' '}
            {gasPriceGwei && `(${gasPriceGwei} Gwei)`}. Consider waiting for
            lower gas prices.
          </span>
        </div>
      )}

      <div className='flex justify-between items-start relative z-10'>
        <div>
          <p className='font-bold'>Enable Automated Bidding</p>
          <p className='text-sm text-blue-200'>
            Set a maximum bid value to maintain your position in the cache
            without manual intervention.
          </p>
        </div>
        <SwitchPrimitive.Root
          checked={automatedBidding}
          onCheckedChange={setAutomatedBidding}
          className={cn(
            'inline-flex h-[26px] w-[48px] shrink-0 items-center rounded-full border-transparent transition-all outline-none',
            'data-[state=unchecked]:border data-[state=unchecked]:border-[#73777A] data-[state=unchecked]:bg-[#2C2E30]',
            'data-[state=checked]:border-0 data-[state=checked]:bg-[#335CD7]'
          )}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block h-[20px] w-[20px] rounded-full bg-white shadow-lg ring-0 transition-transform',
              'data-[state=checked]:translate-x-[24px] data-[state=unchecked]:translate-x-0.5'
            )}
          />
        </SwitchPrimitive.Root>
      </div>

      {/* Display user balance */}
      <div className='mt-2 text-sm text-white relative z-10'>
        <span>Your automation balance: </span>
        <span className='font-semibold'>{formattedUserBalance} ETH</span>
      </div>

      {/* Input fields - shown only when automated bidding is enabled */}
      {automatedBidding && (
        <div className='mt-4 relative z-10'>
          <div className='grid grid-cols-[auto_1fr_auto] gap-y-5'>
            {/* Row 1: Automation Funding */}
            <div className='self-center'>
              <p className='font-bold'>Automation Funding</p>
            </div>
            <div className='flex justify-end'>
              <div className='flex flex-col w-full max-w-[200px]'>
                <div className='relative'>
                  <Input
                    type='text'
                    placeholder='Enter amount'
                    value={fundingValue}
                    onChange={handleFundingChange}
                    className={`pr-12 bg-white border-none text-gray-500 ${
                      fundingError ? 'border-red-500' : ''
                    } ${
                      isTransactionInProgress
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                        : ''
                    }`}
                    disabled={isTransactionInProgress}
                  />
                  <div className='absolute right-3 top-0 bottom-0 flex items-center pointer-events-none text-gray-500'>
                    ETH
                  </div>
                </div>
                {fundingError && (
                  <div className='text-white text-xs italic text-left mt-1'>
                    {fundingError}
                  </div>
                )}
              </div>
            </div>
            <div>{/* Empty cell */}</div>

            {/* Row 2: Maximum Bid Amount */}
            <div className='self-center'>
              <p className='font-bold'>Maximum Bid Amount</p>
            </div>
            <div className='flex justify-end'>
              <div className='flex flex-col w-full max-w-[200px]'>
                <div className='relative'>
                  <Input
                    type='text'
                    placeholder='Enter amount'
                    value={inputValue}
                    onChange={handleInputChange}
                    className={`pr-12 bg-white border-none text-gray-500 ${
                      inputError ? 'border-red-500' : ''
                    } ${
                      isTransactionInProgress
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                        : ''
                    }`}
                    disabled={isTransactionInProgress}
                  />
                  <div className='absolute right-3 top-0 bottom-0 flex items-center pointer-events-none text-gray-500'>
                    ETH
                  </div>
                </div>
                {inputError && (
                  <div className='text-white text-xs italic text-left mt-1'>
                    {inputError}
                  </div>
                )}
              </div>
            </div>
            <div className='self-start pl-2'>
              <Button
                onClick={handleSetBid}
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center'
                disabled={isTransactionInProgress || isSuccess}
              >
                {isTransactionInProgress ? (
                  <div className='flex items-center'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                  </div>
                ) : (
                  'Set Bid'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomatedBiddingSection;
