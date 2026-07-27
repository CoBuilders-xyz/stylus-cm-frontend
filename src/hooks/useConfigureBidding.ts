import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isAddress, type Abi } from 'viem';
import {
  useAccount,
  useChainId,
  usePublicClient,
  useSimulateContract,
  useSwitchChain,
} from 'wagmi';
import cacheManagerAutomationAbi from '@/config/abis/cacheManagerAutomation/CacheManagerAutomation.json';
import { showErrorToast, showSuccessToast } from '@/components/Toast';
import { TransactionStatus, useWeb3 } from '@/hooks/useWeb3';

/**
 * Best-effort decode of the on-chain error surfaced by a viem
 * `simulateContract` rejection. Viem wraps CMA reverts in
 * `ContractFunctionExecutionError`; we pull the error name (e.g.
 * `InvalidBid`) or the short message so the user sees the actual CMA
 * failure reason instead of a generic "would revert".
 */
function extractRevertReason(err: unknown): string | null {
  if (err == null || typeof err !== 'object') return null;
  const anyErr = err as {
    cause?: { data?: { errorName?: string }; errorName?: string };
    shortMessage?: string;
    message?: string;
  };
  const errorName =
    anyErr.cause?.data?.errorName ??
    anyErr.cause?.errorName ??
    undefined;
  if (typeof errorName === 'string' && errorName.length > 0) {
    return errorName;
  }
  const short = anyErr.shortMessage;
  if (typeof short === 'string' && short.length > 0) {
    return short;
  }
  return null;
}

export interface UseConfigureBiddingParams {
  /** WASM contract whose CMA bidding config is being edited. */
  contractAddress: string | undefined;
  /** Chain the write must happen on. */
  targetChainId: number | undefined;
  /** CMA contract address on that chain (`Blockchain.cacheManagerAutomationAddress`). */
  cmaAddress: `0x${string}` | undefined;
  /**
   * Additional gate on top of the standard "address + chain + wallet OK"
   * checks. Callers set this to `false` while the form is pristine so we
   * don't spam simulate calls with args that will always succeed.
   */
  enabled?: boolean;
  /**
   * Whether the contract is already registered in the CMA. Drives the choice
   * of `insertContract` (first-time add, payable) vs `updateContract`
   * (nonpayable). The caller derives this from the on-chain CMA read via
   * `useUserCMAContract` (`cmaRecord != null`).
   */
  isRegistered: boolean;
  /**
   * Current activation-side values to preserve. `updateContract` /
   * `insertContract` write all five CMA fields atomically; if we don't
   * echo the live values back, we silently overwrite the user's
   * auto-activation config set from the Activation tab. Fresh
   * `insertContract` seeds `(false, 0n)` because there's nothing on-chain
   * to preserve — mirror of the activation-side "seed `maxBid` with
   * `minMaxBidAmount`" pattern.
   */
  currentAutoActivate: boolean;
  currentMaxActivationCost: bigint;
  /** New bidding values the user wants to persist. */
  maxBid: bigint;
  biddingEnabled: boolean;
  /**
   * ETH value forwarded with the write, in wei. Only meaningful when
   * `!isRegistered`: `insertContract` is payable and this becomes the
   * initial CMA funding. When `isRegistered`, `updateContract` is
   * nonpayable and the hook hardcodes value to `BigInt(0)` regardless
   * of this param.
   */
  insertFundingValue?: bigint;
  /**
   * Fires once the tx is confirmed on-chain, after the success toast.
   * Use it to refetch the CMA record + gas-tank balance so both tabs
   * reflect the just-persisted config.
   */
  onConfirmed?: () => void;
}

/**
 * Optional per-call overrides for the two bidding fields — used by the
 * toggle path, which writes the previously-persisted `maxBid` (ignoring
 * any unsaved form edits) and the flipped `biddingEnabled` (not the
 * hook-level value, which reflects the state before the flip). Passing
 * both overrides sidesteps two problems the plain `save()` path
 * inherits from React batching: (a) `setState(x)` followed by `save()`
 * in the same tick reads the stale `x` from the current-render closure,
 * (b) the declarative simulate hasn't re-resolved for the new args yet.
 */
export interface SaveOverrides {
  maxBid?: bigint;
  biddingEnabled?: boolean;
}

export interface UseConfigureBiddingResult {
  isConnected: boolean;
  isChainMismatch: boolean;
  isSwitchingChain: boolean;
  switchToTarget: () => void;
  isSimulating: boolean;
  simulationError: Error | null;
  refetchSimulation: () => void;
  isSaving: boolean;
  isConfirmed: boolean;
  txHash: `0x${string}` | undefined;
  save: (overrides?: SaveOverrides) => void;
  reset: () => void;
}

/**
 * Encapsulates the on-chain "configure bidding" flow on the
 * CacheManagerAutomation contract: pick `insertContract` vs
 * `updateContract`, simulate to catch reverts (`InvalidBid`,
 * `ContractAlreadyExists`, `ExceedsMaxUserFunds`, etc.) before the wallet
 * prompt, guard against wallet/chain mismatches, and translate wallet
 * errors into toasts. Shares its shape with `useConfigureAutoActivation`
 * so the two hooks feel like siblings from the tab's side — the Set /
 * Update call sites use `save()` verbatim like activation does; only
 * the toggle path passes `SaveOverrides` (see the interface for why).
 *
 * The write is atomic on all five CMA fields — the caller is responsible
 * for echoing `currentAutoActivate` / `currentMaxActivationCost` back so
 * we don't clobber the user's activation config. See COB-499 / COB-504.
 *
 * When `save()` is called with args that differ from the args the
 * declarative `useSimulateContract` most recently resolved for — either
 * because the caller passed overrides (toggle path) or because form
 * state changed in the same tick — the hook runs an imperative
 * `publicClient.simulateContract` before writing. This preserves the
 * "wallet never prompts a doomed tx" guarantee across all three call
 * sites (Set / Update / Toggle).
 */
export function useConfigureBidding({
  contractAddress,
  targetChainId,
  cmaAddress,
  isRegistered,
  currentAutoActivate,
  currentMaxActivationCost,
  maxBid,
  biddingEnabled,
  insertFundingValue,
  onConfirmed,
  enabled = true,
}: UseConfigureBiddingParams): UseConfigureBiddingResult {
  const { address: userAddress, isConnected } = useAccount();
  const walletChainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: targetChainId });
  const isChainMismatch =
    isConnected && targetChainId != null && walletChainId !== targetChainId;

  const isValidAddress =
    typeof contractAddress === 'string' && isAddress(contractAddress);

  const {
    writeContract,
    status,
    txHash,
    error: writeError,
    reset,
  } = useWeb3();

  const isSaving =
    status === TransactionStatus.PREPARING ||
    status === TransactionStatus.PENDING;
  const isConfirmed = status === TransactionStatus.SUCCESS;

  const functionName = isRegistered ? 'updateContract' : 'insertContract';
  // `updateContract` is nonpayable — force value to 0 regardless of what the
  // caller passed. `insertContract` is payable and forwards the caller's
  // funding amount (defaults to 0 = "no additional funding this tx").
  const writeValue = isRegistered ? BigInt(0) : insertFundingValue ?? BigInt(0);

  // Args for the declarative simulate — reflect the hook-level form state.
  // The write path derives its args from these plus any per-call overrides
  // passed to `save()`.
  const args = useMemo(() => {
    if (!isValidAddress) return undefined;
    return [
      contractAddress as `0x${string}`,
      maxBid,
      biddingEnabled,
      currentAutoActivate,
      currentMaxActivationCost,
    ] as const;
  }, [
    biddingEnabled,
    contractAddress,
    currentAutoActivate,
    currentMaxActivationCost,
    isValidAddress,
    maxBid,
  ]);

  const {
    data: simData,
    error: simulationError,
    isLoading: isSimulating,
    refetch: refetchSimulation,
  } = useSimulateContract({
    address: cmaAddress,
    abi: cacheManagerAutomationAbi.abi as Abi,
    functionName,
    args: args as readonly unknown[] | undefined,
    value: writeValue,
    chainId: targetChainId,
    account: userAddress,
    query: {
      enabled:
        enabled &&
        isConnected &&
        isValidAddress &&
        !isChainMismatch &&
        !isSaving &&
        !isConfirmed &&
        targetChainId != null &&
        cmaAddress != null,
    },
  });

  // Snapshot the full simulate identity — args tuple + value + functionName
  // — that the declarative simulate has already resolved for. Comparing
  // only `args` would let a same-tick funding-value edit (writeValue
  // changes, args unchanged) or an insert→update transition (functionName
  // flips) falsely match a stale snapshot, green-lighting an unsimulated
  // write.
  const lastSimulatedKeyRef = useRef<{
    args: readonly unknown[];
    value: bigint;
    functionName: string;
  } | null>(null);
  useEffect(() => {
    if (isSimulating) return;
    if (args == null) return;
    if (simData === undefined && simulationError == null) return;
    lastSimulatedKeyRef.current = {
      args: args as unknown as readonly unknown[],
      value: writeValue,
      functionName,
    };
  }, [args, functionName, isSimulating, simData, simulationError, writeValue]);

  const switchToTarget = useCallback(() => {
    if (targetChainId == null) {
      showErrorToast({
        message: 'Target network is not set yet. Try again in a moment.',
      });
      return;
    }
    switchChain({ chainId: targetChainId });
  }, [switchChain, targetChainId]);

  // Retry from the wallet-error toast should replay the exact overrides
  // used on the failing attempt — otherwise a rejected/underfunded
  // toggle would silently retry with the hook-level (pre-flip) values.
  const lastOverridesRef = useRef<SaveOverrides | undefined>(undefined);

  // Guards against a re-entrant `save()` during the imperative simulate
  // await. `isSaving` (from `useWeb3`) only turns true once
  // `writeContract` is invoked, so a second click landing while the
  // first save is still awaiting the preflight sim would race to two
  // wallet prompts. Ref for the synchronous re-entry check inside
  // `save()`; state so the UI can disable the button during preflight.
  const isPreflightingRef = useRef(false);
  const [isPreflighting, setIsPreflighting] = useState(false);

  const save = useCallback(
    async (overrides?: SaveOverrides) => {
      // NB: no `enabled` gate here. `enabled` disables the declarative
      // simulate query for pristine forms, but `save()` still has to
      // work for the toggle path — pristine input + click Disable is
      // valid and its safety comes from the imperative-simulate branch
      // below, not from the declarative one.
      if (isPreflightingRef.current) {
        return;
      }
      lastOverridesRef.current = overrides;

      if (!isConnected) {
        showErrorToast({
          message: 'Connect your wallet to save this configuration.',
        });
        return;
      }
      if (isChainMismatch) {
        switchToTarget();
        return;
      }
      if (!isValidAddress || cmaAddress == null || args == null) {
        showErrorToast({
          message: 'Configuration is not ready yet. Try again in a moment.',
        });
        return;
      }

      // Compose the args actually going to the wire. Overrides win over
      // the hook-level form state — see `SaveOverrides` for the toggle
      // rationale.
      const effectiveMaxBid = overrides?.maxBid ?? maxBid;
      const effectiveBiddingEnabled =
        overrides?.biddingEnabled ?? biddingEnabled;
      const writeArgs: readonly unknown[] = [
        contractAddress as `0x${string}`,
        effectiveMaxBid,
        effectiveBiddingEnabled,
        currentAutoActivate,
        currentMaxActivationCost,
      ];

      // Are the write's full simulate identity (args + value +
      // functionName) identical to what the declarative simulate last
      // resolved for? If yes (typical Set/Update path with no overrides
      // and no same-tick edits), the declarative `simulationError` is
      // authoritative. Otherwise run an imperative simulate before
      // writing.
      const last = lastSimulatedKeyRef.current;
      const keyMatch =
        last != null &&
        last.value === writeValue &&
        last.functionName === functionName &&
        last.args.length === writeArgs.length &&
        last.args.every((v, i) => v === writeArgs[i]);

      if (keyMatch) {
        if (simulationError != null) {
          showErrorToast({
            message:
              'Cannot save: the transaction would revert. Fix the config and retry.',
          });
          return;
        }
        if (isSimulating) {
          showErrorToast({
            message:
              'Still validating the configuration. Try again in a moment.',
          });
          return;
        }
      } else {
        if (publicClient == null) {
          showErrorToast({
            message: 'RPC client not ready. Try again in a moment.',
          });
          return;
        }
        isPreflightingRef.current = true;
        setIsPreflighting(true);
        try {
          await publicClient.simulateContract({
            address: cmaAddress,
            abi: cacheManagerAutomationAbi.abi as Abi,
            functionName,
            args: writeArgs,
            value: writeValue,
            account: userAddress,
          });
        } catch (err) {
          // Preserve viem's decoded revert reason so the user sees the
          // actual CMA error (`InvalidBid()`, `ContractAlreadyExists()`,
          // etc.) instead of a generic "would revert".
          const reason = extractRevertReason(err);
          showErrorToast({
            message: reason
              ? `Cannot save: ${reason}. Fix the config and retry.`
              : 'Cannot save: the transaction would revert. Fix the config and retry.',
          });
          return;
        } finally {
          isPreflightingRef.current = false;
          setIsPreflighting(false);
        }
      }

      writeContract({
        address: cmaAddress,
        abi: cacheManagerAutomationAbi.abi as Abi,
        functionName,
        args: writeArgs,
        value: writeValue,
        chainId: targetChainId,
      });
    },
    [
      args,
      biddingEnabled,
      cmaAddress,
      contractAddress,
      currentAutoActivate,
      currentMaxActivationCost,
      functionName,
      isChainMismatch,
      isConnected,
      isSimulating,
      isValidAddress,
      maxBid,
      publicClient,
      simulationError,
      switchToTarget,
      targetChainId,
      userAddress,
      writeContract,
      writeValue,
    ]
  );

  // Same ref-based guards as `useConfigureAutoActivation` — parent may
  // pass an inline `onConfirmed`, and the retry surface on the error
  // toast needs to always reach the freshest `save` closure.
  const onConfirmedRef = useRef(onConfirmed);
  useEffect(() => {
    onConfirmedRef.current = onConfirmed;
  }, [onConfirmed]);

  const saveRef = useRef<(overrides?: SaveOverrides) => void>(() => {});
  useEffect(() => {
    saveRef.current = (overrides?: SaveOverrides) => {
      void save(overrides);
    };
  }, [save]);

  const hasFiredConfirmationRef = useRef(false);
  useEffect(() => {
    if (isConfirmed) {
      if (hasFiredConfirmationRef.current) return;
      hasFiredConfirmationRef.current = true;
      showSuccessToast({ message: 'Bidding config saved.' });
      onConfirmedRef.current?.();
      // Return the useWeb3 state machine to IDLE — otherwise `status`
      // stays `SUCCESS` for the rest of the session, `isConfirmed`
      // remains true, and the declarative simulate query stays
      // permanently disabled (see the `!isConfirmed` gate above).
      // Subsequent saves would fall back to the imperative path only
      // and the inline retry banner would never re-populate.
      reset();
    } else {
      hasFiredConfirmationRef.current = false;
    }
  }, [isConfirmed, reset]);

  useEffect(() => {
    if (!writeError) return;
    const message = writeError.message ?? '';
    const lower = message.toLowerCase();
    let display = 'Save failed. Please try again.';
    if (
      lower.includes('user rejected') ||
      lower.includes('user denied') ||
      lower.includes('rejected the request')
    ) {
      display = 'Save cancelled in wallet.';
    } else if (
      lower.includes('insufficient funds') ||
      lower.includes('insufficient balance') ||
      lower.includes('exceeds the balance')
    ) {
      display = 'Insufficient ETH to cover the gas fee.';
    } else if (lower.includes('network fee is extremely high')) {
      display = message;
    }
    showErrorToast({
      message: display,
      onRetry: () => saveRef.current(lastOverridesRef.current),
    });
    reset();
  }, [writeError, reset]);

  const refetchSimulationStable = useCallback(() => {
    refetchSimulation();
  }, [refetchSimulation]);

  const saveStable = useCallback(
    (overrides?: SaveOverrides) => {
      void save(overrides);
    },
    [save]
  );

  return {
    isConnected,
    isChainMismatch,
    isSwitchingChain,
    switchToTarget,
    isSimulating,
    simulationError: simulationError ?? null,
    refetchSimulation: refetchSimulationStable,
    // Fold preflight into `isSaving` so a single flag disables the UI
    // across both the imperative sim await and the write phase — no
    // caller has to know the internal state split.
    isSaving: isSaving || isPreflighting,
    isConfirmed,
    txHash,
    save: saveStable,
    reset,
  };
}
