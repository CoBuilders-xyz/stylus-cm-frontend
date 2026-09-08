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
import { CACHE_MANAGER_AUTOMATION_ABI } from '@/config/abis/cacheManagerAutomation/cacheManagerAutomation';
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
import { useUserCMAContract } from '@/hooks/useUserCMAContract';

interface AutomatedBiddingSectionProps {
  maxBidAmount?: string;
  setMaxBidAmount?: (value: string) => void;
  automationFunding?: string;
  setAutomationFunding?: (value: string) => void;
  contract?: {
    address: string;
    maxBid?: string;
    isAutomated?: boolean;
  };
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
  const [originalMaxBid, setOriginalMaxBid] = useState('0');

  // Local state for the automated bidding toggle within the form - enabled by default
  const [automatedBidding, setAutomatedBidding] = useState(true);

  // Get the current blockchain
  const { currentBlockchain } = useBlockchainService();

  // Get the connected account
  const {
    address: userAddress,
    isConnected,
    chainId: walletChainId,
  } = useAccount();
  const isChainMismatch =
    isConnected &&
    currentBlockchain != null &&
    walletChainId !== currentBlockchain.chainId;

  // Chain-authoritative read of this contract's CMA record. Sourcing the
  // activation fields we must preserve (`autoActivate`, `maxActivationCost`)
  // from the backend `contract` prop instead would let backend indexer lag
  // silently clobber a just-submitted change from the Activation tab —
  // exactly the COB-499 regression class. Refetches on write confirmation.
  const {
    data: cmaRecord,
    refetch: refetchCMARecord,
  } = useUserCMAContract({
    chainId: currentBlockchain?.chainId,
    cmaAddress: currentBlockchain?.cacheManagerAutomationAddress as
      | `0x${string}`
      | undefined,
    contractAddress: contract?.address,
  });

  // Get user balance from cache manager automation contract
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: currentBlockchain?.cacheManagerAutomationAddress as `0x${string}`,
    abi: CACHE_MANAGER_AUTOMATION_ABI,
    functionName: 'getUserBalance',
    account: userAddress, // Include the user's address to properly sign the request
    chainId: currentBlockchain?.chainId,
    query: {
      enabled:
        !!currentBlockchain?.cacheManagerAutomationAddress &&
        isConnected &&
        !!userAddress &&
        !isChainMismatch,
    },
  });

  // `contractExists` used to be derived from a duplicate `getUserContracts`
  // read that ran in parallel with `useUserCMAContract`. Now both derive
  // from the same hook — wagmi dedupes the RPC call and both surfaces
  // agree on the source of truth (COB-499 CodeRabbit finding).
  const contractExists = cmaRecord != null;

  // Format user balance for display
  const formattedUserBalance = userBalance
    ? formatEther(BigInt(userBalance.toString()))
    : '0';

  // Hydrate the form from the on-chain CMA record. `cmaRecord === undefined`
  // means the read hasn't resolved yet — do nothing. `null` means the
  // contract is not registered (defaults). Object means registered — echo
  // the values into the form.
  useEffect(() => {
    if (!contract?.address) return;
    if (cmaRecord === undefined) return;
    if (cmaRecord === null) {
      setAutomatedBidding(true);
      setMaxBidAmount('');
      setOriginalMaxBid('0');
      return;
    }
    setAutomatedBidding(cmaRecord.biddingEnabled);
    const maxBidEth = formatEther(cmaRecord.maxBid);
    setMaxBidAmount(maxBidEth);
    setOriginalMaxBid(maxBidEth);
  }, [contract?.address, cmaRecord, setAutomatedBidding, setMaxBidAmount]);

  // Store the last transaction parameters for retry functionality
  const [lastTxParams, setLastTxParams] = useState<{
    address: `0x${string}`;
    abi: Abi;
    functionName: string;
    args: [string, bigint, boolean, boolean, bigint];
    value: string;
    chainId: number;
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

    if (
      !currentBlockchain ||
      lastTxParams.chainId !== currentBlockchain.chainId
    ) {
      showErrorToast({
        message:
          'The selected network changed since this transaction failed. Submit the configuration again on the current network.',
      });
      return;
    }

    // Reset any previous error states
    reset();

    // Re-submit the transaction with the same parameters
    writeContract(lastTxParams, (hash) => {
      console.log(`Retry transaction submitted with hash: ${hash}`);
    });
  }, [currentBlockchain, lastTxParams, writeContract, reset]);

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

        // Immediately refetch the balance and the CMA record so both this
        // tab and the Activation tab see the just-updated values.
        refetchBalance();
        refetchCMARecord();

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
    refetchCMARecord,
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

    if (isChainMismatch) {
      showErrorToast({
        message: `Switch your wallet to ${currentBlockchain.name} before configuring automated bidding.`,
      });
      return;
    }

    if (!contract || !contract.address) {
      console.error('No contract address provided');
      showSomethingWentWrongToast();
      return;
    }

    // Refuse to `insertContract` unless the on-chain read has definitively
    // resolved to "not registered". `undefined` means the CMA read is
    // still in flight — the button is visible because `contractExists`
    // defaults to false while loading, but firing `insertContract`
    // against an already-registered contract would revert on-chain and
    // burn the user's gas.
    if (cmaRecord === undefined) {
      showErrorToast({
        message:
          'Still reading the on-chain configuration. Try again in a moment.',
      });
      return;
    }
    if (cmaRecord !== null) {
      showErrorToast({
        message:
          'This contract is already automated. Refresh to see its current config, then use Update.',
      });
      return;
    }

    try {
      console.log('Setting bid with values:', {
        contractAddress: contract.address,
        maxBidAmount: inputValue,
        automatedBidding: automatedBidding,
      });

      // `insertContract` is safe here — the guard above proved the
      // contract is not yet in CMA. There's nothing on-chain to preserve,
      // so the activation fields default to (false, 0) — same defaults
      // an Activation-first flow would pass when it initialises a fresh
      // record.
      const txParams = {
        address:
          currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
        abi: CACHE_MANAGER_AUTOMATION_ABI,
        functionName: 'insertContract',
        // CMA input order: (_contract, _maxBid, _biddingEnabled, _autoActivate, _maxActivationCost)
        args: [
          contract.address,
          parseEther(inputValue), // _maxBid
          automatedBidding, // _biddingEnabled
          false, // _autoActivate
          BigInt(0), // _maxActivationCost
        ] as [string, bigint, boolean, boolean, bigint],
        value: fundingValue,
        chainId: currentBlockchain.chainId,
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

    if (isChainMismatch) {
      showErrorToast({
        message: `Switch your wallet to ${currentBlockchain.name} before updating automated bidding.`,
      });
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

      // Preserve auto-activation fields from the chain-authoritative CMA
      // read (COB-499). If the read hasn't resolved yet, we refuse the
      // write — defaulting to (false, 0) here would silently wipe a
      // config the user set from the Activation tab.
      if (cmaRecord == null) {
        showErrorToast({
          message:
            'Still reading the on-chain configuration. Try again in a moment.',
        });
        return;
      }

      // Create transaction parameters for updateContract
      const txParams = {
        address:
          currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
        abi: CACHE_MANAGER_AUTOMATION_ABI,
        functionName: 'updateContract',
        // CMA input order: (_contract, _maxBid, _biddingEnabled, _autoActivate, _maxActivationCost)
        args: [
          contract.address,
          parseEther(inputValue), // _maxBid
          automatedBidding, // _biddingEnabled
          cmaRecord.autoActivate, // _autoActivate (preserved from chain)
          cmaRecord.maxActivationCost, // _maxActivationCost (preserved from chain)
        ] as [string, bigint, boolean, boolean, bigint],
        chainId: currentBlockchain.chainId,
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

    if (isChainMismatch) {
      showErrorToast({
        message: `Switch your wallet to ${currentBlockchain.name} before changing automated bidding.`,
      });
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

      // Same chain-read preservation as `handleUpdateAutomation` (COB-499).
      if (cmaRecord == null) {
        showErrorToast({
          message:
            'Still reading the on-chain configuration. Try again in a moment.',
        });
        return;
      }

      // Create transaction parameters for updateContract with funding = 0
      const txParams = {
        address:
          currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
        abi: CACHE_MANAGER_AUTOMATION_ABI,
        functionName: 'updateContract',
        // CMA input order: (_contract, _maxBid, _biddingEnabled, _autoActivate, _maxActivationCost)
        args: [
          contract.address,
          parseEther(originalMaxBid), // _maxBid (unchanged)
          newAutomatedBidding, // _biddingEnabled
          cmaRecord.autoActivate, // _autoActivate (preserved from chain)
          cmaRecord.maxActivationCost, // _maxActivationCost (preserved from chain)
        ] as [string, bigint, boolean, boolean, bigint],
        chainId: currentBlockchain.chainId,
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
    <div className='relative rounded-[10px] p-4 overflow-hidden bg-surface-2 border border-hairline'>
      {/* Gas Price Warning */}
      {isGasPriceHigh && (
        <div className='bg-crit-soft text-crit-text p-2 rounded-md mb-3 flex items-center relative z-10'>
          <AlertTriangle className='w-4 h-4 me-2 shrink-0' />
          <span className='text-[12px]'>
            Warning: Network fees are extremely high{' '}
            {gasPriceGwei && `(${gasPriceGwei} Gwei)`}. Consider waiting for
            lower gas prices.
          </span>
        </div>
      )}

      <div className='flex flex-wrap justify-between items-start gap-3 relative z-10'>
        <div className='min-w-0 flex-1'>
          <p className='text-[13px] font-semibold text-ink-1'>
            Automated Bidding Configuration
          </p>
          <p className='text-[11.5px] text-ink-3'>
            Configure automated bidding to maintain your position in the cache
            without manual intervention.
          </p>
        </div>
        <button
          onClick={() => setShowAutomationPanel(!showAutomationPanel)}
          className='flex items-center justify-center w-8 h-8 rounded-lg border border-hairline bg-transparent text-ink-2 hover:text-ink-1 hover:border-hairline-strong transition-colors'
          disabled={isTransactionInProgress}
        >
          {showAutomationPanel ? (
            <ChevronUp className='w-4 h-4' />
          ) : (
            <ChevronDown className='w-4 h-4' />
          )}
        </button>
      </div>

      {/* Display user balance */}
      <div className='mt-2 text-[12px] text-ink-2 relative z-10'>
        <div className='flex items-center justify-between'>
          <div>
            <span>Automation balance: </span>
            <span className='font-medium text-ink-1 num'>
              {formattedUserBalance} ETH
            </span>
          </div>
        </div>

        {/* Show automation status for existing contracts */}
        {contractExists && (
          <div className='flex items-center justify-left mt-1'>
            <div>
              <span>Automation is currently: </span>
              <span className='font-medium text-ink-1'>
                {automatedBidding ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className='flex items-center px-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleToggleAutomation}
                className='mx-2 h-6 px-2'
                disabled={
                  isTransactionInProgress || isSuccess || isChainMismatch
                }
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
                    <p className='text-[13px] font-medium text-ink-2'>
                      Automation Funding
                    </p>
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
                        className={`pe-12 h-9 bg-surface-1 border-hairline rounded-lg text-[13px] text-ink-1 placeholder:text-ink-3 focus:border-accent-blue ${
                          fundingError ? 'border-crit' : ''
                        } ${
                          isTransactionInProgress
                            ? 'cursor-not-allowed opacity-60'
                            : ''
                        }`}
                        disabled={isTransactionInProgress}
                      />
                      <div className='absolute end-3 top-0 bottom-0 flex items-center pointer-events-none text-ink-3'>
                        ETH
                      </div>
                    </div>
                    {fundingError && (
                      <div className='text-crit-text text-[11px] text-start mt-1'>
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
                <p className='text-[13px] font-medium text-ink-2'>
                  Maximum Bid Amount
                </p>
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
                    className={`pe-12 h-9 bg-surface-1 border-hairline rounded-lg text-[13px] text-ink-1 placeholder:text-ink-3 focus:border-accent-blue ${
                      inputError ? 'border-crit' : ''
                    } ${
                      isTransactionInProgress
                        ? 'cursor-not-allowed opacity-60'
                        : ''
                    }`}
                    disabled={isTransactionInProgress}
                  />
                  <div className='absolute end-3 top-0 bottom-0 flex items-center pointer-events-none text-ink-3'>
                    ETH
                  </div>
                </div>
                {inputError && (
                  <div className='text-crit-text text-[11px] text-start mt-1'>
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
                  className='mt-1 data-[state=checked]:bg-accent-blue data-[state=checked]:text-white border-hairline-strong'
                />
                <Label
                  htmlFor='disclaimer'
                  className='text-[11.5px] text-ink-3 leading-tight'
                >
                  I understand this is an experimental feature pending audit
                  completion, and I accept the associated risks of using
                  automated bidding. Performance may vary, and I acknowledge
                  that I am solely responsible for monitoring my account.
                </Label>
              </div>
              <Button
                onClick={handleSetAutomation}
                className='shrink-0'
                disabled={
                  isTransactionInProgress ||
                  isSuccess ||
                  isChainMismatch ||
                  !disclaimerChecked
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
                  className='mt-1 data-[state=checked]:bg-accent-blue data-[state=checked]:text-white border-hairline-strong'
                />
                <Label
                  htmlFor='disclaimer'
                  className='text-[11.5px] text-ink-3 leading-tight'
                >
                  I understand this is an experimental feature pending audit
                  completion, and I accept the associated risks of using
                  automated bidding. Performance may vary, and I acknowledge
                  that I am solely responsible for monitoring my account.
                </Label>
              </div>
              <Button
                onClick={handleUpdateAutomation}
                className='shrink-0'
                disabled={
                  isTransactionInProgress ||
                  isSuccess ||
                  isChainMismatch ||
                  !disclaimerChecked
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
