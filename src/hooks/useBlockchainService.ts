import { useAuthentication } from '@/context/AuthenticationProvider';
import { BlockchainService } from '@/services/blockchainService';
import { Blockchain } from '@/services/contractService';
import { useMemo, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

/**
 * Results returned by useBlockchainService
 */
interface BlockchainServiceResult {
  service: BlockchainService | null;
  currentBlockchain: Blockchain | null;
  currentBlockchainId: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to access the BlockchainService
 * Automatically uses the authentication token from context
 * Also provides the current blockchain based on connected chain
 * Returns null if not authenticated
 */
export function useBlockchainService(): BlockchainServiceResult {
  const { accessToken, isAuthenticated } = useAuthentication();
  const { chain } = useAccount();
  const [currentBlockchain, setCurrentBlockchain] = useState<Blockchain | null>(
    null
  );
  const [currentBlockchainId, setCurrentBlockchainId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Use memoization to ensure we don't create a new service instance on every render
  const service = useMemo(() => {
    if (!isAuthenticated || !accessToken) {
      return null;
    }

    return new BlockchainService(accessToken);
  }, [accessToken, isAuthenticated]);

  // Effect to fetch current blockchain based on chain ID
  useEffect(() => {
    if (chain && chain.id && service) {
      setIsLoading(true);
      setError(null);

      service
        .getBlockchains()
        .then((blockchains) => {
          console.log('blockchains', blockchains);
          const matchingBlockchain = blockchains.find(
            (blockchain) => blockchain.chainId === chain.id
          );
          console.log('matchingBlockchain', matchingBlockchain);
          if (matchingBlockchain) {
            setCurrentBlockchain(matchingBlockchain);
            setCurrentBlockchainId(matchingBlockchain.id);
          } else {
            console.warn(
              `No matching blockchain found for chainId: ${chain.id}`
            );
            setCurrentBlockchain(null);
            setCurrentBlockchainId(null);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching blockchains:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setCurrentBlockchain(null);
          setCurrentBlockchainId(null);
          setIsLoading(false);
        });
    } else {
      setCurrentBlockchain(null);
      setCurrentBlockchainId(null);
    }
  }, [service, chain]);

  return {
    service,
    currentBlockchain,
    currentBlockchainId,
    isLoading,
    error,
  };
}
