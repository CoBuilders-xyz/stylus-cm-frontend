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

// Default blockchain configuration - Arbitrum Sepolia
// This is used when no wallet is connected to allow non-auth routes to function
const DEFAULT_CHAIN_ID = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID; // Arbitrum Sepolia

/**
 * Hook to access the BlockchainService
 * Automatically uses the authentication token from context
 * Also provides the current blockchain based on connected chain
 *
 * **Default Blockchain Strategy:**
 * When no wallet is connected (chain is undefined), this hook will automatically
 * use Arbitrum Sepolia (chainId: 421614) as the default blockchain. This allows:
 * - Non-authenticated routes to display blockchain data immediately
 * - Better UX for users who haven't connected their wallet yet
 * - Seamless transition when wallet connects with a different chain
 *
 * **Fallback Strategy:**
 * If the default blockchain is not available, it will use the first available
 * blockchain from the API response.
 *
 * @param requireAuth If true, the service will only be created if the user is authenticated
 * If false, the service will be created without authentication for non-authenticated endpoints
 */
export function useBlockchainService(
  requireAuth: boolean = true
): BlockchainServiceResult {
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
    if (requireAuth && (!isAuthenticated || !accessToken)) {
      return null;
    }

    // If authentication is not required or user is authenticated, create service
    return new BlockchainService(accessToken);
  }, [accessToken, isAuthenticated, requireAuth]);

  // Effect to fetch current blockchain based on chain ID or set default
  useEffect(() => {
    if (!service) {
      setCurrentBlockchain(null);
      setCurrentBlockchainId(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Determine which chain ID to use
    const targetChainId = chain?.id || DEFAULT_CHAIN_ID;

    service
      .getBlockchains()
      .then((blockchains) => {
        const matchingBlockchain = blockchains.find(
          (blockchain) => blockchain.chainId === targetChainId
        );

        if (matchingBlockchain) {
          setCurrentBlockchain(matchingBlockchain);
          setCurrentBlockchainId(matchingBlockchain.id);

          if (!chain?.id) {
            console.log(
              `Using default blockchain: ${matchingBlockchain.name} (chainId: ${matchingBlockchain.chainId})`
            );
          }
        } else {
          // If target chain not found, try to fallback to the first available blockchain
          const fallbackBlockchain = blockchains[0];
          if (fallbackBlockchain) {
            setCurrentBlockchain(fallbackBlockchain);
            setCurrentBlockchainId(fallbackBlockchain.id);
            console.warn(
              `No matching blockchain found for chainId: ${targetChainId}. Using fallback: ${fallbackBlockchain.name}`
            );
          } else {
            console.warn(`No blockchains available. chainId: ${targetChainId}`);
            setCurrentBlockchain(null);
            setCurrentBlockchainId(null);
          }
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
  }, [service, chain?.id]);

  return {
    service,
    currentBlockchain,
    currentBlockchainId,
    isLoading,
    error,
  };
}
