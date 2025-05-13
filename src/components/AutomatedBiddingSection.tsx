import React, { useState, useEffect, useCallback } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWeb3, TransactionStatus } from '@/hooks/useWeb3';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { Abi } from 'viem';
import { AlertTriangle, Loader2 } from 'lucide-react';
import cacheManagerAutomationAbi from '@/config/abis/cacheManagerAutomation/CacheManagerAutomation.json';
import { formatEther, parseEther } from 'viem';
import {
  showSuccessToast,
  showErrorToast,
  showSomethingWentWrongToast,
} from '@/components/Toast';

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
  automationFunding = '0', // Default to 0 for automation funding - initial amount to deposit when setting up automated bidding
  setAutomationFunding = () => {},
  contract,
  onSuccess,
}: AutomatedBiddingSectionProps) {
  // Local state for input values to ensure they update immediately
  const [inputValue, setInputValue] = useState(maxBidAmount);
  /* Temporarily commented out while funding input is hidden
  const [fundingValue, setFundingValue] = useState(automationFunding);
  */
  const [inputError, setInputError] = useState<string | null>(null);
  /* Temporarily commented out while funding input is hidden
  const [fundingError, setFundingError] = useState<string | null>(null);
  */
  // Track the last checked contract address to detect changes

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

  // Log user contracts when available for debugging
  useEffect(() => {
    if (
      userContracts &&
      Array.isArray(userContracts) &&
      userContracts.length > 0
    ) {
      console.log('User automated contracts found:', userContracts);
      userContracts.forEach((contract, index) => {
        console.log(`Contract ${index + 1}:`, {
          address: contract.contractAddress,
          maxBid: formatEther(contract.maxBid) + ' ETH',
          lastBid: formatEther(contract.lastBid) + ' ETH',
          enabled: contract.enabled ? 'Active' : 'Inactive',
        });
      });
    }
  }, [userContracts]);

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
      const automatedContract = userContracts.find(
        (c) =>
          c.contractAddress.toLowerCase() === contract.address.toLowerCase()
      );

      if (automatedContract) {
        console.log(
          'Contract found in automated contracts:',
          automatedContract
        );

        // Update UI with the automated contract's values
        setAutomatedBidding(automatedContract.enabled);

        // Format the max bid to ETH for display
        const maxBidEth = formatEther(automatedContract.maxBid.toString());
        setMaxBidAmount(maxBidEth);

        console.log(
          `Automation status: ${automatedContract.enabled}, Max bid: ${maxBidEth} ETH`
        );
      } else {
        console.log('Contract is not automated:', contract.address);
        // If not found, reset to default values
        setAutomatedBidding(false);
        setMaxBidAmount('');
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

  /* Temporarily commented out while funding input is hidden
  // Handle automation funding input change
  const handleFundingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setAutomationFunding(value);
  };
  */

  // Handle set bid button click
  const handleSetBid = () => {
    let hasError = false;

    // When button is clicked, check for empty values and show error if needed
    if (!inputValue) {
      setInputError('Enter a valid Bid Amount');
      hasError = true;
    }

    // No longer checking for automationFunding since the input is hidden
    // if (!automationFunding) {
    //   setInputError('Enter a valid Amount');
    //   hasError = true;
    // }

    if (hasError) return;

    const isMaxBidValid = validateNumericInput(inputValue, setInputError);
    // We're not validating automationFunding anymore since we're using a fixed value
    // const isFundingValid = validateNumericInput(
    //   automationFunding,
    //   setInputError
    // );

    // if (!isMaxBidValid || !isFundingValid) {
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
        functionName: 'insertOrUpdateContract',
        args: [contract.address, parseEther(inputValue), automatedBidding] as [
          string,
          bigint,
          boolean
        ],
        value: '0', // Using fixed value of '0' for automation funding
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

  // Add new state for add funds and withdraw funds inputs
  const [addFundsValue, setAddFundsValue] = useState('');
  const [addFundsError, setAddFundsError] = useState<string | null>(null);
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [isWithdrawingFunds, setIsWithdrawingFunds] = useState(false);

  // Function to handle adding funds to automation
  const handleAddFunds = () => {
    // Validate input
    if (
      !addFundsValue ||
      !validateNumericInput(addFundsValue, setAddFundsError)
    ) {
      setAddFundsError('Please enter a valid amount');
      return;
    }

    // Check if blockchain is available
    if (!currentBlockchain) {
      console.error(
        'No blockchain connected. Please connect your wallet to the correct network.'
      );
      showSomethingWentWrongToast();
      return;
    }

    try {
      setIsAddingFunds(true);

      // Create transaction parameters
      const txParams = {
        address:
          currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
        abi: cacheManagerAutomationAbi.abi as Abi,
        functionName: 'fundBalance',
        args: [] as const, // Even though this function doesn't take args, wagmi requires this property
        value: addFundsValue, // Amount to add in ETH
      };

      // Send the transaction
      writeContract(txParams, (hash) => {
        console.log(`Add funds transaction submitted with hash: ${hash}`);
      });

      console.log('Adding funds:', {
        amount: addFundsValue,
      });
    } catch (err) {
      console.error('Error adding funds:', err);
      setIsAddingFunds(false);
      showSomethingWentWrongToast();
    }
  };

  // Function to handle withdrawing funds from automation
  const handleWithdrawFunds = () => {
    // Check if blockchain is available
    if (!currentBlockchain) {
      console.error(
        'No blockchain connected. Please connect your wallet to the correct network.'
      );
      showSomethingWentWrongToast();
      return;
    }

    try {
      setIsWithdrawingFunds(true);

      // Create transaction parameters
      const txParams = {
        address:
          currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
        abi: cacheManagerAutomationAbi.abi as Abi,
        functionName: 'withdrawBalance',
        args: [] as const, // Even though this function doesn't take args, wagmi requires this property
      };

      // Send the transaction
      writeContract(txParams, (hash) => {
        console.log(`Withdraw funds transaction submitted with hash: ${hash}`);
      });

      console.log('Withdrawing funds from automation');
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      setIsWithdrawingFunds(false);
      showSomethingWentWrongToast();
    }
  };

  // Reset status after transaction completes
  useEffect(() => {
    if (isSuccess) {
      setIsAddingFunds(false);
      setIsWithdrawingFunds(false);
      setAddFundsValue('');
    }
  }, [isSuccess]);

  // Handle add funds input change
  const handleAddFundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddFundsValue(value);

    // Clear the error if input is emptied
    if (!value) {
      setAddFundsError(null);
    } else {
      // Only validate the format for non-empty values
      validateNumericInput(value, setAddFundsError);
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
            {/* Row 1: Automation Funding - Temporarily hidden
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
            <div></div>
            */}

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

          {/* Divider inside the toggle */}
          <div className='my-10 border-t border-blue-300/30 relative z-10'></div>

          {/* Add Funds Section - Now inside the toggle */}
          <div className='relative z-10'>
            <h3 className='font-bold text-white mb-2'>
              Add Funds to Automation
            </h3>
            <p className='text-sm text-blue-200 mb-4'>
              Increase your automation balance to ensure your automated bids can
              continue.
            </p>

            <div className='grid grid-cols-[auto_1fr_auto] gap-y-5'>
              {/* Left column: Title */}
              <div className='self-center'>
                <p className='font-bold'>Automation Funds</p>
              </div>
              {/* Middle column: Input */}
              <div className='flex justify-end'>
                <div className='flex flex-col w-full max-w-[200px]'>
                  <div className='relative'>
                    <Input
                      type='text'
                      placeholder='Amount to add'
                      value={addFundsValue}
                      onChange={handleAddFundsChange}
                      className={`pr-12 bg-white border-none text-gray-500 ${
                        addFundsError ? 'border-red-500' : ''
                      } ${
                        isTransactionInProgress || isAddingFunds
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                          : ''
                      }`}
                      disabled={isTransactionInProgress || isAddingFunds}
                    />
                    <div className='absolute right-3 top-0 bottom-0 flex items-center pointer-events-none text-gray-500'>
                      ETH
                    </div>
                  </div>
                  {addFundsError && (
                    <div className='text-white text-xs italic mt-1'>
                      {addFundsError}
                    </div>
                  )}
                </div>
              </div>
              {/* Right column: Button */}
              <div className='self-start pl-2'>
                <Button
                  onClick={handleAddFunds}
                  className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center'
                  disabled={
                    isTransactionInProgress ||
                    isAddingFunds ||
                    isWithdrawingFunds
                  }
                >
                  {isAddingFunds ? (
                    <div className='flex items-center'>
                      <Loader2 className='h-4 w-4 animate-spin mr-1' />
                      Adding...
                    </div>
                  ) : (
                    <>Add Funds</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Divider inside the toggle */}
          <div className='my-10 border-t border-blue-300/30 relative z-10'></div>

          {/* Withdraw Funds Section - Now inside the toggle */}
          <div className='relative z-10'>
            <h3 className='font-bold text-white mb-2'>
              Withdraw Funds from Automation
            </h3>
            <p className='text-sm text-blue-200 mb-4'>
              Withdraw your entire automation balance back to your wallet.
            </p>

            <div className='grid grid-cols-[auto_1fr_auto] gap-y-5'>
              {/* Left column: Title */}
              <div className='self-center'>
                <p className='font-bold'>Withdraw Funds</p>
              </div>
              {/* Middle column: Balance info */}
              <div className='flex justify-end'>
                <div className='self-center text-white text-right'>
                  Available:{' '}
                  <span className='font-semibold'>
                    {formattedUserBalance} ETH
                  </span>
                </div>
              </div>
              {/* Right column: Button */}
              <div className='self-start pl-2'>
                <Button
                  onClick={handleWithdrawFunds}
                  className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center'
                  disabled={
                    isTransactionInProgress ||
                    isWithdrawingFunds ||
                    isAddingFunds ||
                    parseFloat(formattedUserBalance) <= 0
                  }
                >
                  {isWithdrawingFunds ? (
                    <div className='flex items-center'>
                      <Loader2 className='h-4 w-4 animate-spin mr-1' />
                      Withdrawing...
                    </div>
                  ) : (
                    <>Withdraw All</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomatedBiddingSection;
