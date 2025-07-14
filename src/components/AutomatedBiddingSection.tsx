import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWeb3, TransactionStatus } from '@/hooks/useWeb3';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { Abi } from 'viem';
import {
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import cacheManagerAutomationAbi from '@/config/abis/cacheManagerAutomation/CacheManagerAutomation.json';
import { formatEther, parseEther } from 'viem';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  showSuccessToast,
  showErrorToast,
  showSomethingWentWrongToast,
} from '@/components/Toast';

import { useReadContract, useAccount } from 'wagmi';

interface AutomatedBiddingSectionProps {
  maxBidAmount?: string;
  setMaxBidAmount?: (value: string) => void;
  automationFunding?: string;
  setAutomationFunding?: (value: string) => void;
  contract?: { address: string; maxBid?: string; isAutomated?: boolean };
  onSuccess?: () => void;
}

export function AutomatedBiddingSection({
  maxBidAmount = '',
  setMaxBidAmount = () => {},
  automationFunding = '0', // Default to 0 for automation funding - initial amount to deposit when setting up automated bidding
  setAutomationFunding = () => {},
  contract,
  onSuccess,
}: AutomatedBiddingSectionProps) {
  // Local state for input values to ensure they update immediately
  const [inputValue, setInputValue] = useState(maxBidAmount);
  const [fundingValue, setFundingValue] = useState(automationFunding);
  const [inputError, setInputError] = useState<string | null>(null);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  // Separate state for controlling panel visibility
  const [showAutomationPanel, setShowAutomationPanel] = useState(false);
  const [contractExists, setContractExists] = useState(false);
  const [originalMaxBid, setOriginalMaxBid] = useState('0');

  // Local state for the automated bidding toggle within the form - enabled by default
  const [automatedBidding, setAutomatedBidding] = useState(true);

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

  // Get user's automated contracts
  const { data: userContracts, refetch: refetchUserContracts } =
    useReadContract({
      address:
        currentBlockchain?.cacheManagerAutomationAddress as `0x${string}`,
      abi: cacheManagerAutomationAbi.abi as Abi,
      functionName: 'getUserContracts',
      account: userAddress,
      query: {
        enabled:
          !!currentBlockchain?.cacheManagerAutomationAddress &&
          isConnected &&
          !!userAddress,
      },
    });

  // Format user balance for display
  const formattedUserBalance = userBalance
    ? formatEther(BigInt(userBalance.toString()))
    : '0';

  // Check if current contract is automated
  useEffect(() => {
    // Only proceed if we have the necessary data
    if (
      contract?.address &&
      userContracts &&
      Array.isArray(userContracts)
      // Check if this is a new contract or different from the last checked one
    ) {
      console.log('Checking contract automation status for:', contract.address);

      // Remember this contract address to detect future changes

      // Look for the contract in user's automated contracts
      const existingContract = userContracts.find(
        (c) =>
          c.contractAddress.toLowerCase() === contract.address.toLowerCase()
      );

      if (existingContract) {
        // Update UI with the automated contract's values
        setAutomatedBidding(existingContract.enabled);

        // Format the max bid to ETH for display
        const maxBidEth = formatEther(existingContract.maxBid.toString());
        setMaxBidAmount(maxBidEth);
        setOriginalMaxBid(maxBidEth);
        setContractExists(true);
      } else {
        console.log('Contract is not automated:', contract.address);
        // If not found, reset to default values
        setAutomatedBidding(true);
        setMaxBidAmount('');
        setOriginalMaxBid('0');
        setContractExists(false);
      }
    }
  }, [contract?.address, userContracts, setAutomatedBidding, setMaxBidAmount]);

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
    if (contract?.address) {
      setInputValue(maxBidAmount);
    }
  }, [maxBidAmount, contract?.address]);

  useEffect(() => {
    // Only update local state if automationFunding changes after initialization
    if (contract?.address) {
      setAutomationFunding(automationFunding);
    }
  }, [setAutomationFunding, automationFunding, contract?.address]);

  // Function to handle retry of the last transaction
  const handleRetry = useCallback(() => {
    if (!lastTxParams) {
      console.error('No previous transaction parameters found to retry');
      showSomethingWentWrongToast();
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
      showErrorToast({
        message: 'An error occurred while setting up automated bidding',
        onRetry: handleRetry,
      });

      reset();
    }
  }, [isError, error, reset, handleRetry]);

  // Show success toast when transaction completes
  useEffect(() => {
    if (isSuccess) {
      showSuccessToast({
        message: 'Automated bidding configured successfully',
      });

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Instead of just refetching, first update our local state with the values we just set
      // This ensures that the values stay consistent with what the user just set
      if (contract?.address) {
        // If we just completed a successful transaction, we should keep the user's input value
        // rather than allowing it to be overwritten by outdated contract data

        // Store current values before reset
        const currentInputValue = inputValue;
        const currentAutomatedBidding = automatedBidding;

        // Reset transaction state
        reset();

        // Immediately refetch the balance and contracts to get updated data
        refetchBalance();
        refetchUserContracts();

        // Log the values we're keeping
        console.log('Keeping user values after successful transaction:', {
          maxBidAmount: currentInputValue,
          automatedBidding: currentAutomatedBidding,
        });
      }
    }
  }, [
    isSuccess,
    onSuccess,
    reset,
    refetchBalance,
    refetchUserContracts,
    inputValue,
    automatedBidding,
    contract?.address,
  ]);

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
  const handleSetAutomation = () => {
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
      showSomethingWentWrongToast();
      return;
    }

    if (!contract || !contract.address) {
      console.error('No contract address provided');
      showSomethingWentWrongToast();
      return;
    }

    try {
      console.log('Setting bid with values:', {
        contractAddress: contract.address,
        maxBidAmount: inputValue,
        automatedBidding: automatedBidding,
      });

      // Create transaction parameters
      const txParams = {
        address:
          currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
        abi: cacheManagerAutomationAbi.abi as Abi,
        functionName: 'insertContract',
        args: [contract.address, parseEther(inputValue), automatedBidding] as [
          string,
          bigint,
          boolean
        ],
        value: fundingValue,
      };

      // Store the parameters for retry functionality
      setLastTxParams(txParams);

      // Send the transaction
      writeContract(txParams, (hash) => {
        console.log(`Transaction submitted with hash: ${hash}`);
      });
    } catch (err) {
      console.error('Error submitting transaction:', err);
      showSomethingWentWrongToast();
    }
  };

  const handleUpdateAutomation = () => {
    let hasError = false;

    // When button is clicked, check for empty values and show error if needed
    if (!inputValue) {
      setInputError('Enter a valid Bid Amount');
      hasError = true;
    }

    if (hasError) return;

    const isMaxBidValid = validateNumericInput(inputValue, setInputError);

    if (!isMaxBidValid) {
      return;
    }

    if (!currentBlockchain) {
      console.error(
        'No blockchain connected. Please connect your wallet to the correct network.'
      );
      showSomethingWentWrongToast();
      return;
    }

    if (!contract || !contract.address) {
      console.error('No contract address provided');
      showSomethingWentWrongToast();
      return;
    }

    try {
      console.log('Updating automation with values:', {
        contractAddress: contract.address,
        maxBidAmount: inputValue,
        automatedBidding: automatedBidding,
      });

      // Create transaction parameters for updateContract
      const txParams = {
        address:
          currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
        abi: cacheManagerAutomationAbi.abi as Abi,
        functionName: 'updateContract',
        args: [contract.address, parseEther(inputValue), automatedBidding] as [
          string,
          bigint,
          boolean
        ],
      };

      // Store the parameters for retry functionality
      setLastTxParams({
        ...txParams,
        value: '0', // updateContract is nonpayable, so no ETH value needed
      });

      // Send the transaction
      writeContract(txParams, (hash) => {
        console.log(`Update transaction submitted with hash: ${hash}`);
      });
    } catch (err) {
      console.error('Error submitting update transaction:', err);
      showSomethingWentWrongToast();
    }
  };

  const handleToggleAutomation = () => {
    if (!currentBlockchain) {
      console.error(
        'No blockchain connected. Please connect your wallet to the correct network.'
      );
      showSomethingWentWrongToast();
      return;
    }

    if (!contract || !contract.address) {
      console.error('No contract address provided');
      showSomethingWentWrongToast();
      return;
    }

    try {
      const newAutomatedBidding = !automatedBidding;
      console.log('Toggling automation with values:', {
        contractAddress: contract.address,
        maxBidAmount: originalMaxBid,
        automatedBidding: newAutomatedBidding,
      });

      // Create transaction parameters for updateContract with funding = 0
      const txParams = {
        address:
          currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
        abi: cacheManagerAutomationAbi.abi as Abi,
        functionName: 'updateContract',
        args: [
          contract.address,
          parseEther(originalMaxBid),
          newAutomatedBidding,
        ] as [string, bigint, boolean],
      };

      // Store the parameters for retry functionality
      setLastTxParams({
        ...txParams,
        value: '0', // updateContract is nonpayable, so no ETH value needed
      });

      // Send the transaction
      writeContract(txParams, (hash) => {
        console.log(`Toggle transaction submitted with hash: ${hash}`);
      });
    } catch (err) {
      console.error('Error submitting toggle transaction:', err);
      showSomethingWentWrongToast();
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
          <p className='font-bold'>Automated Bidding Configuration</p>
          <p className='text-sm text-blue-200'>
            Configure automated bidding to maintain your position in the cache
            without manual intervention.
          </p>
        </div>
        <button
          onClick={() => setShowAutomationPanel(!showAutomationPanel)}
          className='flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors'
          disabled={isTransactionInProgress}
        >
          {showAutomationPanel ? (
            <ChevronUp className='w-5 h-5 text-white' />
          ) : (
            <ChevronDown className='w-5 h-5 text-white' />
          )}
        </button>
      </div>

      {/* Display user balance */}
      <div className='mt-2 text-sm text-white relative z-10'>
        <div className='flex items-center justify-between'>
          <div>
            <span>Automation balance: </span>
            <span className='font-semibold'>{formattedUserBalance} ETH</span>
          </div>
        </div>

        {/* Show automation status for existing contracts */}
        {contractExists && (
          <div className='flex items-center justify-left mt-1'>
            <div>
              <span>Automation is currently: </span>
              <span className='font-semibold'>
                {automatedBidding ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className='flex items-center px-2'>
              <Button
                onClick={handleToggleAutomation}
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center px-2 mx-2 py-1 h-6'
                disabled={isTransactionInProgress || isSuccess}
              >
                {isTransactionInProgress ? (
                  <div className='flex items-center'>
                    <Loader2 className='h-3 w-3 animate-spin' />
                  </div>
                ) : automatedBidding ? (
                  'Disable'
                ) : (
                  'Enable'
                )}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className='w-4 h-4 cursor-help' />
                </TooltipTrigger>
                <TooltipContent>
                  {automatedBidding ? (
                    <p className='max-w-xs'>
                      <strong>Disable automation for this contract.</strong>
                      <br />
                      It will no longer be considered in upcoming automated
                      bidding rounds.
                    </p>
                  ) : (
                    <p className='max-w-xs'>
                      <strong>Enable automation for this contract.</strong>
                      <br />
                      It will be included in the next automated bidding round.
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* Form with all inputs including the toggle - shown only when panel is open */}
      {showAutomationPanel && (
        <div className='mt-4 relative z-10'>
          <div className='grid grid-cols-[auto_1fr_auto] gap-y-5'>
            {/* Row 1: Automation Funding - only show for new contracts */}
            {!contractExists && (
              <>
                <div className='self-center'>
                  <div className='flex items-center space-x-2'>
                    <p className='font-bold'>Automation Funding</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className='w-4 h-4 cursor-help' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className='max-w-xs'>
                          <strong>Fund the automation gas tank.</strong>
                          <br />
                          This is the balance your automation contract will use
                          to place bids on your behalf.
                          <br />
                          You can fund it now or later using the &quot;Gas
                          Tank&quot; section in the navbar.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                <div></div>
              </>
            )}

            {/* Row 2: Maximum Bid Amount */}
            <div className='self-center'>
              <div className='flex items-center space-x-2'>
                <p className='font-bold'>Maximum Bid Amount</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='w-4 h-4 cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='max-w-xs'>
                      <strong>Defines your bidding limit.</strong>
                      <br />
                      The system will bid the lower of:
                      <br />
                      - The amount that decays to the current minBid in ~1 month
                      <br />
                      - Your defined max bid
                      <br />
                      It only bids when the Cache Manager is 98% or more full;
                      otherwise, it bids 0.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
            <div></div>
          </div>

          {/* Disclaimer and Set Automation button for new contracts */}
          {!contractExists && (
            <div className='flex items-start justify-between space-x-4 mt-6'>
              <div className='flex items-start space-x-2'>
                <Checkbox
                  id='disclaimer'
                  checked={disclaimerChecked}
                  onCheckedChange={(checked) =>
                    setDisclaimerChecked(checked === true)
                  }
                  className='mt-1 data-[state=checked]:bg-white data-[state=checked]:text-blue-600 border-white'
                />
                <Label
                  htmlFor='disclaimer'
                  className='text-sm font-medium leading-tight'
                >
                  I understand this is an experimental feature pending audit
                  completion, and I accept the associated risks of using
                  automated bidding. Performance may vary, and I acknowledge
                  that I am solely responsible for monitoring my account.
                </Label>
              </div>
              <Button
                onClick={handleSetAutomation}
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center shrink-0'
                disabled={
                  isTransactionInProgress || isSuccess || !disclaimerChecked
                }
              >
                {isTransactionInProgress ? (
                  <div className='flex items-center'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                  </div>
                ) : (
                  'Set Automation'
                )}
              </Button>
            </div>
          )}

          {/* Update button for existing contracts */}
          {contractExists && (
            <div className='flex items-start justify-between space-x-4 mt-6'>
              <div className='flex items-start space-x-2'>
                <Checkbox
                  id='disclaimer'
                  checked={disclaimerChecked}
                  onCheckedChange={(checked) =>
                    setDisclaimerChecked(checked === true)
                  }
                  className='mt-1 data-[state=checked]:bg-white data-[state=checked]:text-blue-600 border-white'
                />
                <Label
                  htmlFor='disclaimer'
                  className='text-sm font-medium leading-tight'
                >
                  I understand this is an experimental feature pending audit
                  completion, and I accept the associated risks of using
                  automated bidding. Performance may vary, and I acknowledge
                  that I am solely responsible for monitoring my account.
                </Label>
              </div>
              <Button
                onClick={handleUpdateAutomation}
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center shrink-0'
                disabled={
                  isTransactionInProgress || isSuccess || !disclaimerChecked
                }
              >
                {isTransactionInProgress ? (
                  <div className='flex items-center'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                  </div>
                ) : (
                  'Update Automation'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutomatedBiddingSection;
