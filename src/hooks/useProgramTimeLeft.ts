import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { isAddress } from 'viem';
import {
  ARB_WASM_ABI,
  ARB_WASM_PRECOMPILE,
} from '@/config/abis/arbWasm/arbWasm';

/**
 * Multicalls `ArbWasm.programTimeLeft(address)` for every address in
 * `addresses` against `chainId`. wagmi batches the reads through Multicall3
 * when the configured transport supports it, so this hook costs ≤ 1 RPC call
 * per render.
 *
 * Drop this in favour of the backend-supplied `programTimeLeft` field once
 * COB-490 ships — the consumer signature already accepts `number | null` so
 * the switch is a single-line change at the call site.
 *
 * @returns A map keyed by lowercased contract address. Values are seconds
 *          remaining (`number`), `0` when the program has expired, or `null`
 *          when the precompile reverted (e.g. `ProgramNotActivated`) or the
 *          chain doesn't have an ArbWasm precompile.
 */
export function useProgramTimeLeft(
  addresses: string[] | undefined,
  chainId: number | undefined
): {
  data: Record<string, number | null>;
  isLoading: boolean;
} {
  const validAddresses = useMemo(
    () =>
      (addresses ?? []).filter((a): a is `0x${string}` =>
        typeof a === 'string' && isAddress(a)
      ),
    [addresses]
  );

  const { data, isLoading } = useReadContracts({
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
    const out: Record<string, number | null> = {};
    validAddresses.forEach((address, i) => {
      const entry = data?.[i];
      if (!entry || entry.status !== 'success') {
        out[address.toLowerCase()] = null;
        return;
      }
      const seconds = Number(entry.result as bigint);
      out[address.toLowerCase()] = Number.isFinite(seconds) ? seconds : null;
    });
    return out;
  }, [data, validAddresses]);

  return { data: result, isLoading };
}
