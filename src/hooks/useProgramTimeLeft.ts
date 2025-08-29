'use client';

import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { ARB_WASM_ABI, ARB_WASM_PRECOMPILE } from '@/config/abis/arbWasm/arbWasm';

type TimeLeftState = 'ok' | 'expired' | 'unsupported';

function containsProgramExpired(err: unknown, depth = 0): boolean {
  if (!err || depth > 5) return false;
  const e = err as any;
  const parts: string[] = [];
  if (typeof e?.message === 'string') parts.push(e.message);
  if (typeof e?.shortMessage === 'string') parts.push(e.shortMessage);
  if (Array.isArray(e?.metaMessages)) parts.push(e.metaMessages.join('\n'));
  const combined = parts.join('\n');
  if (combined.includes('ProgramExpired')) return true;
  if (e?.cause) return containsProgramExpired(e.cause, depth + 1);
  return false;
}

function isExecutionReverted(err: unknown, depth = 0): boolean {
  if (!err || depth > 5) return false;
  const e = err as any;
  const parts: string[] = [];
  if (typeof e?.message === 'string') parts.push(e.message);
  if (typeof e?.shortMessage === 'string') parts.push(e.shortMessage);
  if (Array.isArray(e?.metaMessages)) parts.push(e.metaMessages.join('\n'));
  const combined = parts.join('\n');
  if (
    combined.includes('execution reverted') ||
    combined.includes('reverted') ||
    combined.includes('error code 3')
  )
    return true;
  if (e?.cause) return isExecutionReverted(e.cause, depth + 1);
  return false;
}

export function useProgramTimeLeft(address?: string) {
  const enabled = !!address && address.length === 42 && address.startsWith('0x');

  const { data, isLoading, error } = useReadContract({
    address: ARB_WASM_PRECOMPILE,
    abi: ARB_WASM_ABI,
    functionName: 'programTimeLeft',
    args: [address as `0x${string}`],
    query: { enabled, retry: false },
  });

  return useMemo(() => {
    if (!enabled) {
      return {
        isLoading: false,
        state: 'unsupported' as TimeLeftState,
        seconds: null as number | null,
      };
    }

    if (isLoading) {
      return { isLoading: true, state: 'unsupported' as TimeLeftState, seconds: null };
    }

    if (error) {
      // If the precompile reverts with ProgramExpired, treat as expired
      if (containsProgramExpired(error) || isExecutionReverted(error)) {
        return {
          isLoading: false,
          state: 'expired' as TimeLeftState,
          seconds: 0,
        };
      }
      return { isLoading: false, state: 'unsupported' as TimeLeftState, seconds: null };
    }

    if (typeof data === 'bigint') {
      if (data === BigInt(0)) {
        return { isLoading: false, state: 'expired' as TimeLeftState, seconds: 0 };
      }
      return { isLoading: false, state: 'ok' as TimeLeftState, seconds: Number(data) };
    }

    return { isLoading: false, state: 'unsupported' as TimeLeftState, seconds: null };
  }, [enabled, isLoading, error, data]);
}
