'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { formatEther, parseEther } from 'viem';
import { AlertTriangle, ExternalLink, Loader2, RefreshCw, Save, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ActivationEvent,
  ActivationInfo,
} from '@/lib/activation';
import ActivationHero from '@/components/ActivationHero';
import ActivationHistory from '@/components/ActivationHistory';
import { explorerTxUrl } from '@/utils/explorer';
import { useActivateProgram } from '@/hooks/useActivateProgram';
import { useConfigureAutoActivation } from '@/hooks/useConfigureAutoActivation';
import { useUserCMAContract } from '@/hooks/useUserCMAContract';

interface Props {
  activation: ActivationInfo;
  history: ActivationEvent[];
  chainId?: number;
  /**
   * WASM contract to activate. When set together with `chainId`, the header
   * renders a live "Activate now" button wired to the ArbWasm precompile.
   * Left undefined on the explore view (read-only).
   */
  contractAddress?: string;
  /** Human-readable chain name used in the "Switch to X" fallback CTA. */
  chainName?: string;
  /** Fires after the activation tx is confirmed on-chain. */
  onActivated?: () => void;
  readOnly?: boolean;
  /**
   * Persisted per-contract auto-activation config from the backend. Used
   * only for the read-only summary rendered on the explore view — the
   * editable path sources baseline values from the on-chain CMA read via
   * `useUserCMAContract` (COB-499 addendum), so backend indexer lag can
   * no longer cause silent clobbers between the Activation and Bidding tabs.
   */
  autoActivate?: boolean;
  /** Max activation cost in wei (`null` = never configured). */
  maxActivationCost?: string | null;
  /** CMA contract address on the contract's chain, needed for the on-chain read. */
  cmaAddress?: `0x${string}`;
  /** Fires after the CMA config tx is confirmed on-chain. */
  onConfigSaved?: () => void;
  /** True while the parent is fetching the enriched contract detail. */
  isLoading?: boolean;
}

function formatMaxActivationCost(wei: string | null | undefined): string {
  if (wei == null || wei === '') return '—';
  try {
    return `${formatEther(BigInt(wei))} ETH`;
  } catch {
    // Backend should always send a wei-formatted decimal string, but a
    // stray non-numeric value should not crash the whole tab.
    return '—';
  }
}

interface AutoActivationReadonlyProps {
  autoActivate: boolean | undefined;
  maxActivationCost: string | null | undefined;
}

/**
 * Read-only summary card used on the explore-contracts view where the user
 * cannot edit the CMA config. Kept dark-bordered rather than gradient — the
 * gradient action-card styling is reserved for interactive controls, matching
 * the Cache tab's split between the (interactive) Bidding cards and the
 * (informational) contract-info rows.
 */
function AutoActivationReadonly({
  autoActivate,
  maxActivationCost,
}: AutoActivationReadonlyProps) {
  return (
    <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h3 className='text-lg font-medium'>Auto-activation</h3>
          <p className='text-gray-400 text-sm'>
            Automatically re-activate this contract before it expires.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
            autoActivate
              ? 'border-green-500/40 bg-green-500/10 text-green-300'
              : 'border-gray-600/60 bg-gray-500/10 text-gray-300'
          }`}
        >
          <span
            aria-hidden
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              autoActivate ? 'bg-green-400' : 'bg-gray-400'
            }`}
          />
          {autoActivate ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <dl className='mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
        <div>
          <dt className='text-[11px] uppercase tracking-wider text-gray-500'>
            Max activation cost
          </dt>
          <dd className='mt-0.5 text-gray-100 tabular-nums'>
            {formatMaxActivationCost(maxActivationCost)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function ActivationTab({
  activation,
  history,
  chainId,
  contractAddress,
  chainName,
  onActivated,
  readOnly = false,
  autoActivate,
  maxActivationCost,
  cmaAddress,
  onConfigSaved,
  isLoading = false,
}: Props) {
  const isActive = activation.status === 'active';
  const canActivate =
    !readOnly && contractAddress != null && chainId != null;
  const canConfigure =
    !readOnly &&
    contractAddress != null &&
    chainId != null &&
    cmaAddress != null;

  if (isLoading) {
    return <ActivationTabSkeleton readOnly={readOnly} />;
  }

  return (
    <div>
      <ActivationHero
        info={activation}
        actionSlot={
          canActivate ? (
            <ActivateNowControl
              contractAddress={contractAddress as string}
              chainId={chainId as number}
              chainName={chainName}
              isActive={isActive}
              onActivated={onActivated}
            />
          ) : undefined
        }
      />

      {/* Auto-activation section — mirrors the "Bidding" section on the
          Cache tab (h3 heading + gradient action card underneath) so both
          tabs share the same visual rhythm. */}
      {canConfigure || (!readOnly && autoActivate !== undefined) ? (
        <>
          <div className='mb-3'>
            <h3 className='text-lg'>Auto-activation</h3>
          </div>

          <div className='space-y-4 mb-8'>
            {canConfigure ? (
              <AutoActivationConfig
                contractAddress={contractAddress as string}
                chainId={chainId as number}
                chainName={chainName}
                cmaAddress={cmaAddress as `0x${string}`}
                onSaved={onConfigSaved}
              />
            ) : (
              <AutoActivationReadonly
                autoActivate={autoActivate}
                maxActivationCost={maxActivationCost}
              />
            )}
          </div>
        </>
      ) : null}

      {/* Activation history — same borderless Table treatment as the Bid
          History section on the Cache tab. Hidden on the explore-contracts
          (read-only) view to match the Cache tab, which also hides its Bid
          History there until the user adds the contract. */}
      {!readOnly && (
        <ActivationHistory
          isLoading={false}
          events={history}
          chainId={chainId}
        />
      )}
    </div>
  );
}

interface ActivateNowControlProps {
  contractAddress: string;
  chainId: number;
  chainName: string | undefined;
  isActive: boolean;
  onActivated: (() => void) | undefined;
}

/**
 * Header CTA that fronts the shared `useActivateProgram` flow. Rendered as a
 * single button that swaps its label and click handler across four states
 * — "already active", "switch to X", "activating…", and idle — plus an
 * inline tx-hash link once the user signs. Kept in this file rather than
 * extracted to its own module because it is one caller, tightly coupled to
 * the tab's status header layout.
 */
function ActivateNowControl({
  contractAddress,
  chainId,
  chainName,
  isActive,
  onActivated,
}: ActivateNowControlProps) {
  const {
    isConnected,
    isChainMismatch,
    isSwitchingChain,
    switchToTarget,
    isSimulating,
    simulationError,
    refetchSimulation,
    dataFee,
    isActivating,
    txHash,
    activate,
  } = useActivateProgram({
    address: contractAddress,
    targetChainId: chainId,
    // Skip the simulation when the program is already active — the
    // precompile would revert with `ProgramUpToDate` and the button is
    // disabled anyway.
    enabled: !isActive,
    onConfirmed: onActivated,
  });

  // Fee-discovery ran, produced no dataFee, and is not currently in flight —
  // treat this as "simulation failed" so the user gets a visible reason +
  // Retry instead of a button that stays silently disabled forever. Bounded
  // to the idle branch (connected, right chain, not already active) so the
  // other states can keep their own messaging.
  const showSimulationFailure =
    !isActive &&
    isConnected &&
    !isChainMismatch &&
    !isActivating &&
    !isSimulating &&
    dataFee == null &&
    simulationError != null;

  const txUrl = txHash ? explorerTxUrl(chainId, txHash) : null;
  const targetChainLabel = chainName ?? 'the contract network';

  // `dataFee == null` covers both "simulation still loading" and
  // "simulation failed" — either way, disable the idle button rather than
  // dead-end the user in an error toast. `activate()` still surfaces the
  // simulation error as a toast if the user manages to click through
  // (e.g. from a stale render).
  const cannotActivate = isActivating || dataFee == null;

  // Pick the button for the current state; the tx-hash link below renders
  // regardless of branch so a mid-tx wallet disconnect or chain switch
  // does not hide the reference to a transaction that is already in flight.
  let button: ReactNode;
  if (isActive) {
    button = (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              disabled
              className='bg-gray-800 text-gray-400 opacity-70 cursor-not-allowed flex items-center gap-2'
            >
              <Zap className='h-4 w-4' />
              Activate now
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Contract is already active</TooltipContent>
      </Tooltip>
    );
  } else if (!isConnected) {
    button = (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              disabled
              className='bg-gray-800 text-gray-400 opacity-70 cursor-not-allowed flex items-center gap-2'
            >
              <Zap className='h-4 w-4' />
              Activate now
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Connect your wallet to activate</TooltipContent>
      </Tooltip>
    );
  } else if (isChainMismatch) {
    button = (
      <Button
        onClick={switchToTarget}
        disabled={isSwitchingChain}
        className='bg-[#335CD7] hover:bg-[#2a4cb8] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed'
      >
        {isSwitchingChain ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <Zap className='h-4 w-4' />
        )}
        {isSwitchingChain
          ? 'Switching network…'
          : `Switch to ${targetChainLabel}`}
      </Button>
    );
  } else {
    button = (
      <Button
        onClick={activate}
        disabled={cannotActivate}
        className='bg-[#335CD7] hover:bg-[#2a4cb8] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed'
      >
        {isActivating ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <Zap className='h-4 w-4' />
        )}
        {isActivating ? 'Activating…' : 'Activate now'}
        {!isActivating && isSimulating && dataFee == null && (
          <Loader2 className='h-3 w-3 animate-spin' />
        )}
      </Button>
    );
  }

  return (
    <div className='flex flex-col items-end gap-1 max-w-xs'>
      {button}
      {showSimulationFailure && (
        <div className='flex items-start gap-2 text-[11px] text-red-300/90 mt-1'>
          <AlertTriangle className='h-3 w-3 shrink-0 mt-0.5' />
          <span className='flex-1 text-right'>
            Could not estimate the activation fee. Check your wallet has ETH
            on the correct network and retry.
          </span>
          <button
            type='button'
            onClick={() => refetchSimulation()}
            className='inline-flex items-center gap-1 text-[#2D99DD] hover:text-[#5ab2e5] shrink-0'
          >
            <RefreshCw className='h-3 w-3' />
            Retry
          </button>
        </div>
      )}
      {txHash && txUrl && (
        <a
          href={txUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='text-[11px] text-[#2D99DD] hover:text-[#5ab2e5] inline-flex items-center gap-1'
        >
          View on Arbiscan
          <ExternalLink className='h-3 w-3' />
        </a>
      )}
    </div>
  );
}

interface AutoActivationConfigProps {
  contractAddress: string;
  chainId: number;
  chainName: string | undefined;
  cmaAddress: `0x${string}`;
  onSaved: (() => void) | undefined;
}

const ZERO_WEI = BigInt(0);

/**
 * Interactive auto-activation config. Sources the "current" per-contract CMA
 * state (`autoActivate`, `maxActivationCost`, and the bidding fields we must
 * echo back on the atomic write) directly from the on-chain
 * `getUserContracts` view via {@link useUserCMAContract}, not from the
 * backend `Contract`. That eliminates the whole class of "backend indexer
 * lag lets one tab silently clobber the other tab's config" bugs — the
 * chain updates immediately on tx confirmation, and a `refetch()` from
 * the `onConfirmed` callback keeps the form baseline in lockstep.
 *
 * Delegates the actual write to {@link useConfigureAutoActivation}. Local
 * form state is initialised once from the on-chain read; after that the
 * user's edits are the truth until they save.
 */
function AutoActivationConfig({
  contractAddress,
  chainId,
  chainName,
  cmaAddress,
  onSaved,
}: AutoActivationConfigProps) {
  const {
    data: onChainConfig,
    isRegistered,
    minMaxBidAmount,
    isLoading: isCMAReadLoading,
    error: cmaReadError,
    refetch: refetchCMAConfig,
  } = useUserCMAContract({ chainId, cmaAddress, contractAddress });

  // Skeleton the config card until BOTH on-chain reads resolve — form
  // state needs `getUserContracts` for the baseline and Activation-first
  // flows need `minMaxBidAmount` as the `maxBid` seed for `insertContract`.
  // The hook's `isLoading` is now the combined state, so one gate covers
  // both. Any failure surfaces through the error path with a retry that
  // hits both reads.
  if (isCMAReadLoading) {
    return <AutoActivationConfigSkeleton />;
  }
  if (cmaReadError || minMaxBidAmount === undefined) {
    return (
      <AutoActivationConfigError
        message='Could not read the on-chain configuration.'
        onRetry={refetchCMAConfig}
      />
    );
  }

  return (
    <AutoActivationConfigForm
      contractAddress={contractAddress}
      chainId={chainId}
      chainName={chainName}
      cmaAddress={cmaAddress}
      isRegistered={isRegistered}
      onChainAutoActivate={onChainConfig?.autoActivate ?? false}
      onChainMaxActivationCost={onChainConfig?.maxActivationCost ?? ZERO_WEI}
      // Registered → echo the current `maxBid`. Not registered →
      // fall back to `minMaxBidAmount`, the CMA-enforced floor. `0n`
      // would revert with `InvalidBid()` even with `enabled = false`,
      // so this nominal value is the only safe seed for the
      // Activation-first insertContract path.
      onChainMaxBid={onChainConfig?.maxBid ?? minMaxBidAmount}
      onChainBiddingEnabled={onChainConfig?.enabled ?? false}
      refetchCMAConfig={refetchCMAConfig}
      onSaved={onSaved}
    />
  );
}

interface AutoActivationConfigFormProps {
  contractAddress: string;
  chainId: number;
  chainName: string | undefined;
  cmaAddress: `0x${string}`;
  isRegistered: boolean;
  onChainAutoActivate: boolean;
  onChainMaxActivationCost: bigint;
  onChainMaxBid: bigint;
  onChainBiddingEnabled: boolean;
  refetchCMAConfig: () => void;
  onSaved: (() => void) | undefined;
}

function AutoActivationConfigForm({
  contractAddress,
  chainId,
  chainName,
  cmaAddress,
  isRegistered,
  onChainAutoActivate,
  onChainMaxActivationCost,
  onChainMaxBid,
  onChainBiddingEnabled,
  refetchCMAConfig,
  onSaved,
}: AutoActivationConfigFormProps) {
  // Baseline seeded from the on-chain read. Form state is user-owned once
  // mounted; the baseline itself refetches after a successful save (see
  // `onConfirmed` below) so `isDirty` is compared against fresh chain
  // state, not the local snapshot pattern that COB-499's earlier commits
  // used against the backend props.
  const initialCostEth =
    onChainMaxActivationCost === ZERO_WEI
      ? ''
      : formatEther(onChainMaxActivationCost);

  const [enabled, setEnabled] = useState(onChainAutoActivate);
  const [costEth, setCostEth] = useState(initialCostEth);
  const [costError, setCostError] = useState<string | null>(null);

  const parsedCost = useMemo<bigint | null>(() => {
    if (!costEth.trim()) return ZERO_WEI;
    try {
      const wei = parseEther(costEth as `${number}`);
      if (wei < ZERO_WEI) return null;
      return wei;
    } catch {
      return null;
    }
  }, [costEth]);

  // `parsedCost === null` after the regex passed (non-empty, decimal-ish
  // input) means `parseEther` itself rejected it — usually because the
  // decimal has more than 18 places or is otherwise out of range. Surface
  // it explicitly so the disabled Save has a visible reason.
  const hasCostParseError = costEth.trim() !== '' && parsedCost == null;

  const isFormValid = parsedCost != null && (!enabled || parsedCost > ZERO_WEI);

  // `refetchCMAConfig()` fires from `onConfirmed`, but wagmi's refetch has
  // a network round-trip — for that window (typically a few hundred ms
  // but can stretch on a slow RPC), `onChainAutoActivate` /
  // `onChainMaxActivationCost` still reflect the pre-write state while
  // the form already shows the just-submitted values, so `isDirty`
  // computed naively would go true and re-enable Save. Snapshot the
  // submitted values on confirm and use them as the dirtiness baseline
  // until the chain read catches up.
  const submittedSnapshotRef = useRef<{
    enabled: boolean;
    maxActivationCost: bigint;
  } | null>(null);

  useEffect(() => {
    const snap = submittedSnapshotRef.current;
    if (snap == null) return;
    if (
      snap.enabled === onChainAutoActivate &&
      snap.maxActivationCost === onChainMaxActivationCost
    ) {
      submittedSnapshotRef.current = null;
    }
  }, [onChainAutoActivate, onChainMaxActivationCost]);

  const snapshot = submittedSnapshotRef.current;
  const baselineEnabled = snapshot?.enabled ?? onChainAutoActivate;
  const baselineMaxCost =
    snapshot?.maxActivationCost ?? onChainMaxActivationCost;
  const isDirty =
    enabled !== baselineEnabled ||
    (parsedCost != null && parsedCost !== baselineMaxCost);

  // Refs so `onConfirmed` (fires once via the hook's internal ref) reads
  // the values the user just submitted, not stale render-time closures.
  const enabledRef = useRef(enabled);
  const parsedCostRef = useRef(parsedCost);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    parsedCostRef.current = parsedCost;
  }, [parsedCost]);

  const {
    isConnected,
    isChainMismatch,
    isSwitchingChain,
    switchToTarget,
    isSaving,
    txHash,
    save,
    isSimulating,
    simulationError,
    refetchSimulation,
  } = useConfigureAutoActivation({
    contractAddress,
    targetChainId: chainId,
    cmaAddress,
    isRegistered,
    // Bidding fields sourced from the on-chain read, not from the
    // backend — this is the whole point of the CMA read: the atomic
    // write cannot silently clobber whatever the user set from the
    // Bidding tab, because we're echoing the authoritative chain
    // values back.
    currentMaxBid: onChainMaxBid,
    currentBiddingEnabled: onChainBiddingEnabled,
    autoActivate: enabled,
    maxActivationCost: parsedCost ?? ZERO_WEI,
    onConfirmed: () => {
      // Snapshot the just-submitted values as the dirtiness baseline
      // so Save stays disabled through the refetch round-trip. The
      // effect above clears the snapshot once the on-chain read
      // reflects the new values.
      submittedSnapshotRef.current = {
        enabled: enabledRef.current,
        maxActivationCost: parsedCostRef.current ?? ZERO_WEI,
      };
      refetchCMAConfig();
      onSaved?.();
    },
    // Skip simulate calls while the form is pristine — no point burning
    // RPC + a wagmi query key on args that are identical to what's
    // already on-chain.
    enabled: isDirty,
  });

  const txUrl = txHash ? explorerTxUrl(chainId, txHash) : null;
  const targetChainLabel = chainName ?? 'the contract network';

  const showSimulationFailure =
    isConnected &&
    !isChainMismatch &&
    !isSaving &&
    !isSimulating &&
    simulationError != null &&
    isDirty;

  const handleCostChange = (value: string) => {
    setCostEth(value);
    if (!value.trim()) {
      setCostError(null);
      return;
    }
    // Only allow decimal-looking values so a paste of "abc" doesn't
    // silently reset the button to enabled via the parsedCost null path.
    if (!/^[0-9]*\.?[0-9]*$/.test(value)) {
      setCostError('Enter a valid amount');
      return;
    }
    setCostError(null);
  };

  const saveButtonBaseClass =
    'bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed';

  let saveButton: ReactNode;
  if (!isConnected) {
    saveButton = (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button disabled className={saveButtonBaseClass}>
              <Save className='h-4 w-4' />
              Save
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Connect your wallet to save</TooltipContent>
      </Tooltip>
    );
  } else if (isChainMismatch) {
    saveButton = (
      <Button
        onClick={switchToTarget}
        disabled={isSwitchingChain}
        className={saveButtonBaseClass}
      >
        {isSwitchingChain ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <Save className='h-4 w-4' />
        )}
        {isSwitchingChain ? 'Switching network…' : `Switch to ${targetChainLabel}`}
      </Button>
    );
  } else {
    const cannotSave = isSaving || !isFormValid || !isDirty;
    saveButton = (
      <Button
        onClick={save}
        disabled={cannotSave}
        className={saveButtonBaseClass}
      >
        {isSaving ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <Save className='h-4 w-4' />
        )}
        {isSaving ? 'Saving…' : 'Save'}
      </Button>
    );
  }

  return (
    <div
      className='relative rounded-md p-4 overflow-hidden'
      style={{
        background:
          'linear-gradient(89.49deg, #3E71C6 0%, #5897B2 103.8%)',
      }}
    >
      {/* Noise texture overlay — mirrors AutomatedBiddingSection so both
          "configure an automated behavior" cards share the same surface. */}
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
          <p className='font-bold'>Auto-activation</p>
          <p className='text-sm text-blue-200'>
            Automatically re-activate this contract before it expires. Uses
            your Gas Tank balance to pay for the activation fee.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Switch
            id='auto-activate-switch'
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={isSaving}
            aria-label='Toggle auto-activation'
            className='data-[state=checked]:bg-white/90 data-[state=unchecked]:bg-white/25'
          />
          <Label
            htmlFor='auto-activate-switch'
            className='text-sm text-white cursor-pointer'
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
      </div>

      {/* Narrow (side-panel on phones): stack label above the input so the
          absolutely-positioned input never lands on top of the label — that
          was the mobile-overlap bug in the first iteration. On the container's
          @md/panel breakpoint (same one the hero uses), flip to inline: label
          left, input right. */}
      <div className='mt-4 flex flex-col @md/panel:flex-row @md/panel:items-center @md/panel:justify-between gap-2 @md/panel:gap-4 relative z-10'>
        <Label
          htmlFor='auto-activate-cost'
          className='font-bold text-white'
        >
          Max activation cost
        </Label>
        <div className='flex flex-col w-full @md/panel:w-auto @md/panel:max-w-[200px]'>
          <div className='relative'>
            <Input
              id='auto-activate-cost'
              type='text'
              inputMode='decimal'
              value={costEth}
              onChange={(e) => handleCostChange(e.target.value)}
              placeholder='Enter amount'
              disabled={isSaving}
              aria-invalid={
                Boolean(
                  costError ||
                    hasCostParseError ||
                    (enabled && parsedCost === ZERO_WEI)
                ) || undefined
              }
              // `cn` (twMerge) resolves Tailwind conflicts by rightmost-wins
              // rather than stylesheet order — critical here because the
              // base `bg-white border-none` would otherwise silently override
              // the `border-red-500` invalid state and the `bg-gray-700`
              // saving state.
              className={cn(
                'pr-12 border-none bg-white text-gray-500',
                (costError ||
                  hasCostParseError ||
                  (enabled && parsedCost === ZERO_WEI)) &&
                  'border border-red-500',
                isSaving &&
                  'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
              )}
            />
            <div className='absolute right-3 top-0 bottom-0 flex items-center pointer-events-none text-gray-500'>
              ETH
            </div>
          </div>
          {costError && (
            <div className='text-white text-xs italic text-left mt-1'>
              {costError}
            </div>
          )}
          {!costError && hasCostParseError && (
            <div className='text-white text-xs italic text-left mt-1'>
              Enter a valid ETH amount (max 18 decimal places).
            </div>
          )}
          {!costError &&
            !hasCostParseError &&
            enabled &&
            parsedCost === ZERO_WEI && (
              <div className='text-white text-xs italic text-left mt-1'>
                Max activation cost must be greater than 0 when
                auto-activation is enabled.
              </div>
            )}
        </div>
      </div>

      <div className='mt-5 flex items-center justify-end gap-3 flex-wrap relative z-10'>
        {txHash && txUrl && (
          <a
            href={txUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='text-[11px] text-white/90 hover:text-white inline-flex items-center gap-1 underline underline-offset-2'
          >
            View on Arbiscan
            <ExternalLink className='h-3 w-3' />
          </a>
        )}
        {saveButton}
      </div>

      {showSimulationFailure && (
        <div className='mt-3 flex items-start gap-2 text-[11px] text-white/90 relative z-10'>
          <AlertTriangle className='h-3 w-3 shrink-0 mt-0.5' />
          <span className='flex-1'>
            Could not simulate the save transaction. Check your wallet is on
            the correct network and retry.
          </span>
          <button
            type='button'
            onClick={() => refetchSimulation()}
            className='inline-flex items-center gap-1 text-white hover:text-white/80 shrink-0 underline underline-offset-2'
          >
            <RefreshCw className='h-3 w-3' />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

function AutoActivationConfigSkeleton() {
  return (
    <div
      className='rounded-md p-4 space-y-4 animate-pulse bg-[#3E71C6]/40'
      aria-busy='true'
      aria-live='polite'
    >
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div className='space-y-2 flex-1'>
          <div className='h-4 w-40 rounded bg-white/30' />
          <div className='h-3 w-56 rounded bg-white/20' />
        </div>
        <div className='h-6 w-20 rounded-full bg-white/30' />
      </div>
      <div className='h-10 w-full rounded bg-white/70' />
      <div className='flex justify-end'>
        <div className='h-8 w-20 rounded bg-white/30' />
      </div>
    </div>
  );
}

function AutoActivationConfigError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className='rounded-lg border border-red-500/40 bg-red-500/10 p-6'>
      <div className='flex items-start gap-2 text-sm text-red-200'>
        <AlertTriangle className='h-4 w-4 shrink-0 mt-0.5' />
        <div className='flex-1'>
          <p className='font-medium'>{message}</p>
          <p className='text-xs text-red-100/80 mt-1'>
            The auto-activation editor needs to read the current config
            directly from the CacheManagerAutomation contract before it can
            let you save.
          </p>
        </div>
        <button
          type='button'
          onClick={onRetry}
          className='inline-flex items-center gap-1 text-[#2D99DD] hover:text-[#5ab2e5] shrink-0 text-xs'
        >
          <RefreshCw className='h-3 w-3' />
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * Skeleton mirroring the three main blocks of {@link ActivationTab} — status
 * hero, auto-activation section (heading + card), and history table — so the
 * layout does not jump once the enriched contract detail arrives.
 */
function ActivationTabSkeleton({ readOnly }: { readOnly: boolean }) {
  return (
    <div className='animate-pulse' aria-busy='true' aria-live='polite'>
      <div className='rounded-lg border border-[#2C2E30] bg-black p-6 mb-6'>
        <div className='flex flex-col @md/panel:flex-row @md/panel:items-start @md/panel:justify-between gap-4 @md/panel:gap-6'>
          <div className='flex items-center gap-4'>
            <div className='h-3.5 w-3.5 rounded-full bg-gray-700' />
            <div className='space-y-2'>
              <div className='h-3 w-24 rounded bg-gray-800' />
              <div className='h-7 w-32 rounded bg-gray-700' />
              <div className='h-3 w-40 rounded bg-gray-800' />
            </div>
          </div>
          {!readOnly && <div className='h-9 w-32 rounded bg-gray-700' />}
        </div>
      </div>

      {!readOnly && (
        <>
          <div className='mb-3'>
            <div className='h-5 w-32 rounded bg-gray-700' />
          </div>
          <div className='rounded-md p-4 mb-8 bg-[#3E71C6]/40 space-y-4'>
            <div className='flex items-start justify-between gap-4 flex-wrap'>
              <div className='space-y-2 flex-1'>
                <div className='h-4 w-40 rounded bg-white/30' />
                <div className='h-3 w-56 rounded bg-white/20' />
              </div>
              <div className='h-6 w-20 rounded-full bg-white/30' />
            </div>
            <div className='h-10 w-full rounded bg-white/70' />
          </div>
        </>
      )}

      <div className='mb-4'>
        <div className='h-5 w-40 rounded bg-gray-700' />
      </div>
      <div className='space-y-2'>
        <div className='h-10 w-full rounded bg-[#121212]' />
        <div className='h-10 w-full rounded bg-[#121212]' />
        <div className='h-10 w-full rounded bg-[#121212]' />
      </div>
    </div>
  );
}
