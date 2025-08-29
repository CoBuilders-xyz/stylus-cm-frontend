'use client';

import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { ARB_WASM_ABI, ARB_WASM_PRECOMPILE } from '@/config/abis/arbWasm/arbWasm';

type TimeLeftState = 'ok' | 'expired' | 'unsupported';

export function useProgramTimeLeft(address?: string) {
  const enabled = !!address && address.length === 42 && address.startsWith('0x');

  const { data, isLoading, error } = useReadContract({
    address: ARB_WASM_PRECOMPILE,
    abi: ARB_WASM_ABI,
    functionName: 'programTimeLeft',
    args: [address as `0x${string}`],
    query: { enabled },
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

