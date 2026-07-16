'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { formatEther, parseEther } from 'viem';
import { AlertTriangle, ExternalLink, Loader2, RefreshCw, Save, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ActivationEvent,
  ActivationInfo,
  formatRelativeTime,
} from '@/lib/activation';
import ActivationBadge from '@/components/ActivationBadge';
import { formatDate } from '@/utils/formatting';
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

const truncate = (hash: string) =>
  hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;

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
    <div className='space-y-6'>
      {/* Status header — the badge is the same component the contracts
          table uses on each row, so the visual language stays consistent. */}
      <div
        className={`relative overflow-hidden rounded-lg border border-[#2C2E30] bg-gradient-to-br p-6 ${
          activation.status === 'active'
            ? 'from-green-500/5 to-transparent'
            : activation.status === 'expiring'
              ? 'from-amber-500/8 to-transparent'
              : activation.status === 'error'
                ? 'from-red-500/8 to-transparent'
                : activation.status === 'unknown'
                  ? 'from-gray-500/8 to-transparent'
                  : 'from-red-500/8 to-transparent'
        }`}
      >
        <div className='flex items-start justify-between gap-4 flex-wrap'>
          <div className='flex items-start gap-4'>
            <ActivationBadge info={activation} />
            {activation.lastActivatedAt && (
              <div className='text-xs text-gray-500 self-end'>
                Last activated {formatRelativeTime(activation.lastActivatedAt)}
              </div>
            )}
          </div>

          {canActivate && (
            <ActivateNowControl
              contractAddress={contractAddress as string}
              chainId={chainId as number}
              chainName={chainName}
              isActive={isActive}
              onActivated={onActivated}
            />
          )}
        </div>
      </div>

      {/* Auto-activation config — interactive when the parent supplies the
          CMA state, otherwise a read-only summary (explore view). */}
      {canConfigure ? (
        <AutoActivationConfig
          contractAddress={contractAddress as string}
          chainId={chainId as number}
          chainName={chainName}
          cmaAddress={cmaAddress as `0x${string}`}
          onSaved={onConfigSaved}
        />
      ) : !readOnly ? (
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
      ) : null}

      {/* Activation history — indexed from the CacheManagerAutomation
          `ActivationPerformed` and `ActivationError` events by the backend. */}
      <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
        <h3 className='text-lg font-medium mb-3'>Activation history</h3>
        {history.length === 0 ? (
          <p className='text-sm text-gray-400'>
            No activation events recorded for this contract yet.
          </p>
        ) : (
          <>
            {/* Narrow-container card stack */}
            <ul className='@lg/panel:hidden flex flex-col gap-2'>
              {history.map((evt) => {
                const url = explorerTxUrl(chainId, evt.txHash);
                return (
                  <li
                    key={evt.id}
                    className='rounded-md border border-[#1f1f1f] p-3 text-sm'
                  >
                    <div className='flex items-center justify-between gap-3 mb-2'>
                      <span
                        className={`inline-flex items-center gap-2 text-xs ${
                          evt.status === 'success'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            evt.status === 'success'
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <span>
                          {evt.status === 'success'
                            ? 'Activated'
                            : 'Failed'}
                        </span>
                      </span>
                      <span className='text-xs text-gray-400 whitespace-nowrap'>
                        {formatDate(evt.date)}
                      </span>
                    </div>
                    {evt.note && (
                      <div className='text-[11px] text-red-300/80 mb-2'>
                        {evt.note}
                      </div>
                    )}
                    {evt.status === 'success' && evt.valueConsumedEth && (
                      <div className='mb-2'>
                        <div className='text-[10px] uppercase tracking-wider text-gray-500'>
                          Spent
                        </div>
                        <div className='text-gray-200 tabular-nums text-xs'>
                          {evt.valueConsumedEth} ETH
                        </div>
                      </div>
                    )}
                    <div className='text-[10px] uppercase tracking-wider text-gray-500'>
                      Tx hash
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='font-mono text-xs text-[#2D99DD] hover:text-[#5ab2e5] inline-flex items-center gap-1'
                      >
                        {truncate(evt.txHash)}
                        <ExternalLink className='h-3 w-3' />
                      </a>
                    ) : (
                      <span className='font-mono text-xs text-gray-300'>
                        {truncate(evt.txHash)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Wide-container full table */}
            <div className='hidden @lg/panel:block -mx-6 px-6 overflow-x-auto'>
              <table className='min-w-[560px] w-full text-sm'>
                <thead>
                  <tr className='border-b border-[#2C2E30]'>
                    <th className='text-left py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                      Date
                    </th>
                    <th className='text-left py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                      Event
                    </th>
                    <th className='text-right py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                      Spent (ETH)
                    </th>
                    <th className='text-left py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                      Tx
                    </th>
                    <th className='text-left py-2 px-2 text-[11px] uppercase tracking-wider font-medium text-gray-500'>
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((evt) => {
                    const url = explorerTxUrl(chainId, evt.txHash);
                    return (
                      <tr
                        key={evt.id}
                        className='border-b border-[#1f1f1f] last:border-0 hover:bg-white/[0.02] transition-colors'
                      >
                        <td className='py-3 px-2 whitespace-nowrap text-gray-300'>
                          {formatDate(evt.date)}
                        </td>
                        <td className='py-3 px-2'>
                          <span
                            className={`inline-flex items-center gap-2 ${
                              evt.status === 'success'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                evt.status === 'success'
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`}
                            />
                            <span>
                              {evt.status === 'success'
                                ? 'Activated'
                                : 'Failed'}
                            </span>
                          </span>
                        </td>
                        <td className='py-3 px-2 text-right tabular-nums text-gray-300'>
                          {evt.status === 'success' && evt.valueConsumedEth
                            ? evt.valueConsumedEth
                            : '—'}
                        </td>
                        <td className='py-3 px-2 font-mono text-xs'>
                          {url ? (
                            <a
                              href={url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-[#2D99DD] hover:text-[#5ab2e5] inline-flex items-center gap-1'
                            >
                              {truncate(evt.txHash)}
                              <ExternalLink className='h-3 w-3' />
                            </a>
                          ) : (
                            truncate(evt.txHash)
                          )}
                        </td>
                        <td className='py-3 px-2 text-xs text-red-300/80 max-w-[220px] truncate'>
                          {evt.note ?? ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
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
    isLoading: isCMAReadLoading,
    error: cmaReadError,
    refetch: refetchCMAConfig,
  } = useUserCMAContract({ chainId, cmaAddress, contractAddress });

  // Skeleton the config card until the on-chain read resolves — form state
  // needs the on-chain values as its baseline, and initialising from
  // "unknown" and re-syncing later reintroduces the flicker we deliberately
  // avoid elsewhere.
  if (isCMAReadLoading) {
    return <AutoActivationConfigSkeleton />;
  }
  if (cmaReadError) {
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
      onChainMaxBid={onChainConfig?.maxBid ?? ZERO_WEI}
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

  let saveButton: ReactNode;
  if (!isConnected) {
    saveButton = (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button disabled className='bg-gray-800 text-gray-400 cursor-not-allowed'>
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
        className='bg-[#335CD7] hover:bg-[#2a4cb8] text-white flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed'
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
        className='bg-[#335CD7] hover:bg-[#2a4cb8] text-white flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed'
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
    <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div>
          <h3 className='text-lg font-medium'>Auto-activation</h3>
          <p className='text-gray-400 text-sm'>
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
          />
          <Label
            htmlFor='auto-activate-switch'
            className='text-sm text-gray-200 cursor-pointer'
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
      </div>

      <div className='mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <Label
            htmlFor='auto-activate-cost'
            className='text-[11px] uppercase tracking-wider text-gray-500'
          >
            Max activation cost (ETH)
          </Label>
          <Input
            id='auto-activate-cost'
            type='text'
            inputMode='decimal'
            value={costEth}
            onChange={(e) => handleCostChange(e.target.value)}
            placeholder='0.0'
            disabled={isSaving}
            className={`mt-1 bg-black border ${
              costError ||
              hasCostParseError ||
              (enabled && parsedCost === ZERO_WEI)
                ? 'border-red-500'
                : 'border-[#2C2E30]'
            } text-white`}
          />
          {costError && (
            <p className='text-red-400 text-xs mt-1'>{costError}</p>
          )}
          {!costError && hasCostParseError && (
            <p className='text-red-400 text-xs mt-1'>
              Enter a valid ETH amount (max 18 decimal places).
            </p>
          )}
          {!costError && !hasCostParseError && enabled && parsedCost === ZERO_WEI && (
            <p className='text-red-400 text-xs mt-1'>
              Max activation cost must be greater than 0 when auto-activation
              is enabled.
            </p>
          )}
        </div>
      </div>

      <div className='mt-5 flex items-center justify-end gap-3 flex-wrap'>
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
        {saveButton}
      </div>

      {showSimulationFailure && (
        <div className='mt-3 flex items-start gap-2 text-[11px] text-red-300/90'>
          <AlertTriangle className='h-3 w-3 shrink-0 mt-0.5' />
          <span className='flex-1'>
            Could not simulate the save transaction. Check your wallet is on
            the correct network and retry.
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
    </div>
  );
}

function AutoActivationConfigSkeleton() {
  return (
    <div
      className='rounded-lg border border-[#2C2E30] bg-black p-6 space-y-4 animate-pulse'
      aria-busy='true'
      aria-live='polite'
    >
      <div className='flex items-start justify-between gap-4 flex-wrap'>
        <div className='space-y-2'>
          <div className='h-5 w-40 rounded bg-gray-700' />
          <div className='h-3 w-56 rounded bg-gray-800' />
        </div>
        <div className='h-6 w-16 rounded-full bg-gray-700' />
      </div>
      <div className='h-3 w-40 rounded bg-gray-800' />
      <div className='h-10 w-full rounded bg-gray-800' />
      <div className='flex justify-end'>
        <div className='h-9 w-20 rounded bg-gray-700' />
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
 * header, auto-activation summary, and history — so the layout does not jump
 * once the enriched contract detail arrives.
 */
function ActivationTabSkeleton({ readOnly }: { readOnly: boolean }) {
  return (
    <div className='space-y-6 animate-pulse' aria-busy='true' aria-live='polite'>
      <div className='rounded-lg border border-[#2C2E30] bg-black p-6'>
        <div className='flex items-start justify-between gap-4 flex-wrap'>
          <div className='flex items-start gap-4'>
            <div className='h-3 w-3 rounded-full bg-gray-700 mt-1' />
            <div className='space-y-2'>
              <div className='h-4 w-24 rounded bg-gray-700' />
              <div className='h-3 w-40 rounded bg-gray-800' />
            </div>
          </div>
          {!readOnly && <div className='h-9 w-32 rounded bg-gray-700' />}
        </div>
      </div>

      {!readOnly && (
        <div className='rounded-lg border border-[#2C2E30] bg-black p-6 space-y-4'>
          <div className='flex items-start justify-between gap-4 flex-wrap'>
            <div className='space-y-2'>
              <div className='h-5 w-40 rounded bg-gray-700' />
              <div className='h-3 w-56 rounded bg-gray-800' />
            </div>
            <div className='h-6 w-20 rounded-full bg-gray-700' />
          </div>
          <div className='h-3 w-32 rounded bg-gray-800' />
          <div className='h-4 w-24 rounded bg-gray-700' />
        </div>
      )}

      <div className='rounded-lg border border-[#2C2E30] bg-black p-6 space-y-3'>
        <div className='h-5 w-40 rounded bg-gray-700' />
        <div className='h-4 w-full rounded bg-gray-800' />
        <div className='h-4 w-11/12 rounded bg-gray-800' />
        <div className='h-4 w-10/12 rounded bg-gray-800' />
      </div>
    </div>
  );
}
