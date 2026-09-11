import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { isAddress } from 'viem';
import {
  ARB_WASM_ABI,
  ARB_WASM_PRECOMPILE,
} from '@/config/abis/arbWasm/arbWasm';

/**
 * Why a `programTimeLeft` read came back as "no active program". Surfaced so
 * the UI can distinguish "never activated" from "expired" from "needs Stylus
 * version upgrade" — the action the user has to take is the same
 * (`activateProgram`), but the framing in the badge sublabel differs.
 */
export type ProgramReason = 'never_activated' | 'expired' | 'needs_upgrade';

/**
 * Per-address result from the multicall.
 *
 * - `seconds > 0`: program is active with that many seconds remaining.
 * - `seconds === 0`: precompile responded but there's no executable program
 *   (revert or genuine 0). When the revert is recognised, `reason` describes
 *   which precompile error was hit.
 * - `seconds === null`: no answer yet (loading, no chainId, RPC error) — the
 *   caller should treat this as "unknown", not "inactive".
 */
export interface ProgramTimeLeftReading {
  seconds: number | null;
  reason?: ProgramReason;
}

const REASON_BY_ERROR_NAME: Record<string, ProgramReason> = {
  ProgramNotActivated: 'never_activated',
  ProgramExpired: 'expired',
  ProgramNeedsUpgrade: 'needs_upgrade',
};

/**
 * Walks the viem error cause/data chain looking for a recognised
 * `errorName`. Falls back to a substring match on the error message, which
 * covers RPCs that return the error as a string instead of decoded data.
 */
function decodeProgramReason(error: unknown): ProgramReason | undefined {
  if (!error || typeof error !== 'object') return undefined;
  type ViemErrLike = {
    data?: { errorName?: string };
    errorName?: string;
    cause?: unknown;
    message?: string;
    shortMessage?: string;
  };
  let cur: ViemErrLike | undefined = error as ViemErrLike;
  for (let i = 0; i < 6 && cur; i++) {
    const name = cur.data?.errorName ?? cur.errorName;
    if (name && REASON_BY_ERROR_NAME[name]) return REASON_BY_ERROR_NAME[name];
    cur = cur.cause as ViemErrLike | undefined;
  }
  const top = error as ViemErrLike;
  const msg = top.shortMessage ?? top.message ?? '';
  for (const [errName, reason] of Object.entries(REASON_BY_ERROR_NAME)) {
    if (msg.includes(errName)) return reason;
  }
  return undefined;
}

/**
 * Multicalls `ArbWasm.programTimeLeft(address)` for every address in
 * `addresses` against `chainId`. wagmi batches the reads through Multicall3
 * when the configured transport supports it, so this hook costs ≤ 1 RPC call
 * per render.
 *
 * **Multicall3 requirement**: the batching collapses to a single
 * `eth_call` only when the target chain has `multicall3` defined in its
 * viem chain config (true for Arbitrum, Arbitrum Sepolia, and every chain
 * exported from `viem/chains` today). If you add a custom chain via
 * `RainbowKitProvider`/`getDefaultConfig` without a `multicall3` contracts
 * entry, this hook silently falls back to N separate `eth_call`s. Always
 * include `multicall3` in custom chain definitions.
 *
 * Drop this in favour of the backend-supplied `programTimeLeft` field once
 * COB-490 ships — list endpoints will return the seconds directly, and this
 * hook (plus the consumer's fallback merge) collapses to a single line.
 */
export function useProgramTimeLeft(
  addresses: string[] | undefined,
  chainId: number | undefined
): {
  data: Record<string, ProgramTimeLeftReading>;
  isLoading: boolean;
  /**
   * Force a fresh read. `useReadContracts` caches with a `staleTime` of one
   * minute (see below), so callers that trigger an on-chain state change
   * (e.g. `activateProgram`) need to call this to unstick the read before
   * the next auto-refresh.
   */
  refetch: () => void;
} {
  const validAddresses = useMemo(
    () =>
      (addresses ?? []).filter((a): a is `0x${string}` =>
        typeof a === 'string' && isAddress(a)
      ),
    [addresses]
  );

  const { data, isLoading, refetch } = useReadContracts({
    contracts: validAddresses.map((address) => ({
      address: ARB_WASM_PRECOMPILE,
      abi: ARB_WASM_ABI,
      functionName: 'programTimeLeft' as const,
      args: [address] as const,
      chainId,
    })),
    query: {
      enabled: validAddresses.length > 0 && chainId !== undefined,
      // programTimeLeft moves by ~1 per second on chain; one fetch per page
      // is plenty for the table view.
      staleTime: 60_000,
    },
  });

  const result = useMemo(() => {
    const out: Record<string, ProgramTimeLeftReading> = {};
    validAddresses.forEach((address, i) => {
      const key = address.toLowerCase();
      if (!data) {
        out[key] = { seconds: null };
        return;
      }
      const entry = data[i];
      if (!entry) {
        out[key] = { seconds: null };
        return;
      }
      if (entry.status !== 'success') {
        // A per-entry failure can be either an ArbWasm typed revert
        // (`ProgramNotActivated`, etc — definitively "no active program")
        // OR a transport/multicall/chain-level failure. Only collapse to
        // "inactive" when we can decode a known precompile reason; leave
        // unrecognised failures as `null` so they read as "unknown"
        // instead of silently flipping the row to inactive on a flaky RPC.
        const reason = decodeProgramReason(entry.error);
        out[key] = { seconds: reason ? 0 : null, reason };
        return;
      }
      // Defensive: a success without a bigint result is a viem/RPC quirk,
      // not "no active program" — treat it as unknown rather than inactive.
      if (typeof entry.result !== 'bigint') {
        out[key] = { seconds: null };
        return;
      }
      const seconds = Number(entry.result);
      out[key] = { seconds: Number.isFinite(seconds) ? seconds : null };
    });
    return out;
  }, [data, validAddresses]);

  // Pass wagmi's memoised refetch reference straight through so downstream
  // effects can list it in their dependency array without re-firing every
  // render — wrapping it in an arrow would allocate a fresh function each
  // time and destabilise those deps.
  return { data: result, isLoading, refetch };
}
