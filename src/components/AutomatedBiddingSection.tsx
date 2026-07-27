import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Abi } from 'viem';
import {
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
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

import { useReadContract, useAccount } from 'wagmi';
import { useUserCMAContract } from '@/hooks/useUserCMAContract';
import { useConfigureBidding } from '@/hooks/useConfigureBidding';

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
  /**
   * CMA contract address on the contract's chain. Sourced from
   * `contractData.blockchain.cacheManagerAutomationAddress` — mirror of
   * the pattern the Activation tab adopted in COB-499, replacing the
   * old "read from header selector" approach that could silently target
   * the wrong CMA if the selector and the contract's chain desynced.
   */
  cmaAddress?: `0x${string}`;
  /** Chain the CMA writes must happen on. */
  chainId?: number;
  onSuccess?: () => void;
}

export function AutomatedBiddingSection({
  maxBidAmount = '',
  setMaxBidAmount = () => {},
  automationFunding = '0',
  setAutomationFunding = () => {},
  contract,
  cmaAddress,
  chainId,
  onSuccess,
}: AutomatedBiddingSectionProps) {
  const [inputValue, setInputValue] = useState(maxBidAmount);
  const [fundingValue, setFundingValue] = useState(automationFunding);
  const [inputError, setInputError] = useState<string | null>(null);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  const [showAutomationPanel, setShowAutomationPanel] = useState(false);
  const [originalMaxBid, setOriginalMaxBid] = useState('0');

  const [automatedBidding, setAutomatedBidding] = useState(true);

  const { address: userAddress, isConnected } = useAccount();

  // Chain-authoritative read of this contract's CMA record. Sourcing the
  // activation fields we must preserve (`autoActivate`, `maxActivationCost`)
  // from the backend `contract` prop instead would let backend indexer lag
  // silently clobber a just-submitted change from the Activation tab —
  // exactly the COB-499 regression class. Refetches on write confirmation.
  const { data: cmaRecord, refetch: refetchCMARecord } = useUserCMAContract({
    chainId,
    cmaAddress,
    contractAddress: contract?.address,
  });

  // Get user balance from cache manager automation contract. Gated on
  // `chainId != null` too — without it, wagmi falls back to the connected
  // chain before `chainId` resolves and reads `cmaAddress` (a chain-scoped
  // contract) on the wrong chain, surfacing a stale zero balance.
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: cmaAddress,
    abi: cacheManagerAutomationAbi.abi as Abi,
    functionName: 'getUserBalance',
    account: userAddress,
    chainId,
    query: {
      enabled:
        cmaAddress != null &&
        chainId != null &&
        isConnected &&
        !!userAddress,
    },
  });

  const contractExists = cmaRecord != null;
  const isRegistered = contractExists;

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
    setAutomatedBidding(cmaRecord.enabled);
    const maxBidEth = formatEther(cmaRecord.maxBid);
    setMaxBidAmount(maxBidEth);
    setOriginalMaxBid(maxBidEth);
  }, [contract?.address, cmaRecord, setMaxBidAmount]);

  // Sync local state with prop values when they change
  useEffect(() => {
    if (contract?.address) {
      setInputValue(maxBidAmount);
    }
  }, [maxBidAmount, contract?.address]);

  useEffect(() => {
    if (contract?.address) {
      setAutomationFunding(automationFunding);
    }
  }, [setAutomationFunding, automationFunding, contract?.address]);

  // Parse form inputs into the wei values the hook expects. Guarded by
  // the button-level validation below, but parseEther still needs a
  // best-effort default for the simulate gate — `0n` for empty/invalid
  // input keeps the sim disabled (via `enabled` below) rather than
  // throwing on render.
  const safeParseEther = (value: string): bigint => {
    if (!value || !/^[0-9]*\.?[0-9]*$/.test(value) || parseFloat(value) < 0) {
      return BigInt(0);
    }
    try {
      return parseEther(value);
    } catch {
      return BigInt(0);
    }
  };

  const parsedMaxBid = safeParseEther(inputValue);
  const parsedFunding = safeParseEther(fundingValue);
  // Persisted on-chain `maxBid` (from `originalMaxBid`, rehydrated from
  // the CMA record). Kept alongside `parsedMaxBid` because the toggle
  // path writes the persisted value and must remain functional even
  // when the user has cleared the max-bid input.
  const persistedMaxBid = safeParseEther(originalMaxBid);

  // Activation-side fields to preserve on the atomic write. When
  // registered, echo the live on-chain values; on fresh insert, seed
  // (false, 0n) — nothing to preserve.
  const preserveAutoActivate = cmaRecord?.autoActivate ?? false;
  const preserveMaxActivationCost = cmaRecord?.maxActivationCost ?? BigInt(0);

  // Gate the DECLARATIVE simulate only: CMA record resolved + a
  // usable input maxBid. The toggle path is intentionally not covered
  // here — with an empty input, sim stays disabled (no doomed RPCs)
  // but `save({maxBid: persistedMaxBid, ...})` still works, because
  // the hook does not gate `save()` on `enabled` and falls through to
  // the imperative-simulate branch when the declarative snapshot is
  // absent.
  const isFormReady =
    cmaRecord !== undefined && parsedMaxBid > BigInt(0);

  const {
    isChainMismatch,
    isSwitchingChain,
    switchToTarget,
    isSaving,
    isSimulating,
    simulationError,
    refetchSimulation,
    save,
  } = useConfigureBidding({
    contractAddress: contract?.address,
    targetChainId: chainId,
    cmaAddress,
    isRegistered,
    currentAutoActivate: preserveAutoActivate,
    currentMaxActivationCost: preserveMaxActivationCost,
    maxBid: parsedMaxBid,
    biddingEnabled: automatedBidding,
    insertFundingValue: parsedFunding,
    onConfirmed: () => {
      // Refetch balance + CMA record so both this tab and the Activation
      // tab see the just-updated values.
      refetchBalance();
      refetchCMARecord();
      onSuccess?.();
    },
    enabled: isFormReady,
  });

  const validateNumericInput = (
    value: string,
    setError: (error: string | null) => void
  ) => {
    if (!value) {
      return false;
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (!value) {
      setInputError(null);
    } else {
      validateNumericInput(value, setInputError);
    }
    setMaxBidAmount(value);
  };

  const handleFundingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFundingValue(value);
    if (!value) {
      setFundingError(null);
    } else {
      validateNumericInput(value, setFundingError);
    }
    setAutomationFunding(value);
  };

  // Set / Update handlers — inputs are already reflected in hook params
  // via state; just fire save().
  const handleSetAutomation = () => {
    let hasError = false;
    if (!inputValue) {
      setInputError('Enter a valid Bid Amount');
      hasError = true;
    }
    if (!fundingValue) {
      setFundingError('Enter a valid Amount');
      hasError = true;
    }
    if (hasError) return;
    if (!validateNumericInput(inputValue, setInputError)) return;
    if (!validateNumericInput(fundingValue, setFundingError)) return;
    save();
  };

  const handleUpdateAutomation = () => {
    if (!inputValue) {
      setInputError('Enter a valid Bid Amount');
      return;
    }
    if (!validateNumericInput(inputValue, setInputError)) return;
    save();
  };

  // Toggle: pass explicit overrides so the write uses the
  // previously-persisted `maxBid` (ignoring any unsaved input edits)
  // and the flipped `biddingEnabled`. Local `automatedBidding` state
  // is NOT flipped here — the `onConfirmed` refetch re-hydrates from
  // the on-chain CMA record via the effect above, matching the
  // pre-COB-504 behaviour where the UI reflected the persisted value
  // only after tx confirmation. See `SaveOverrides` in
  // `useConfigureBidding` for why the overrides are needed.
  const handleToggleAutomation = () => {
    save({
      maxBid: persistedMaxBid,
      biddingEnabled: !automatedBidding,
    });
  };

  const targetChainLabel = 'the contract network';

  const showSimulationFailure =
    isConnected &&
    !isChainMismatch &&
    !isSaving &&
    !isSimulating &&
    simulationError != null &&
    isFormReady;

  const controlsDisabled = isSaving;

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

      <div className='flex flex-wrap justify-between items-start gap-3 relative z-10'>
        <div className='min-w-0 flex-1'>
          <p className='font-bold'>Automated Bidding Configuration</p>
          <p className='text-sm text-blue-200'>
            Configure automated bidding to maintain your position in the cache
            without manual intervention.
          </p>
        </div>
        <button
          onClick={() => setShowAutomationPanel(!showAutomationPanel)}
          className='flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors'
          disabled={controlsDisabled}
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
              {isChainMismatch ? (
                <Button
                  onClick={switchToTarget}
                  disabled={isSwitchingChain}
                  className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center px-2 mx-2 py-1 h-6'
                >
                  {isSwitchingChain ? (
                    <Loader2 className='h-3 w-3 animate-spin' />
                  ) : (
                    `Switch to ${targetChainLabel}`
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleToggleAutomation}
                  className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center px-2 mx-2 py-1 h-6'
                  disabled={controlsDisabled}
                >
                  {isSaving ? (
                    <div className='flex items-center'>
                      <Loader2 className='h-3 w-3 animate-spin' />
                    </div>
                  ) : automatedBidding ? (
                    'Disable'
                  ) : (
                    'Enable'
                  )}
                </Button>
              )}
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
                          controlsDisabled
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                            : ''
                        }`}
                        disabled={controlsDisabled}
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
                      controlsDisabled
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                        : ''
                    }`}
                    disabled={controlsDisabled}
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

          {/* Set / Update button + disclaimer */}
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
            {isChainMismatch ? (
              <Button
                onClick={switchToTarget}
                disabled={isSwitchingChain}
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center shrink-0'
              >
                {isSwitchingChain ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  `Switch to ${targetChainLabel}`
                )}
              </Button>
            ) : contractExists ? (
              <Button
                onClick={handleUpdateAutomation}
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center shrink-0'
                disabled={controlsDisabled || !disclaimerChecked}
              >
                {isSaving ? (
                  <div className='flex items-center'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                  </div>
                ) : (
                  'Update Automation'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSetAutomation}
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center shrink-0'
                disabled={controlsDisabled || !disclaimerChecked}
              >
                {isSaving ? (
                  <div className='flex items-center'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                  </div>
                ) : (
                  'Set Automation'
                )}
              </Button>
            )}
          </div>

          {showSimulationFailure && (
            <div className='mt-3 flex items-start gap-2 text-[11px] text-red-100'>
              <AlertTriangle className='h-3 w-3 shrink-0 mt-0.5' />
              <span className='flex-1'>
                Could not simulate the save transaction. Check your inputs
                and retry.
              </span>
              <button
                type='button'
                onClick={() => refetchSimulation()}
                className='inline-flex items-center gap-1 text-white hover:text-blue-100 shrink-0'
              >
                <RefreshCw className='h-3 w-3' />
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutomatedBiddingSection;
