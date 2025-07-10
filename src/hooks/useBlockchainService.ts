import { useAuthentication } from '@/context/AuthenticationProvider';
import { useBlockchainSelection } from '@/context/BlockchainSelectionProvider';
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
 * **Updated Blockchain Strategy:**
 * 1. If user has explicitly selected a blockchain via UI, use that selection
 * 2. Otherwise, when wallet is connected, uses the chain from the wallet
 * 3. When wallet is not connected, uses the blockchain selected via BlockchainSelectionProvider
 * 4. Falls back to default chain if none available
 *
 * **Fallback Strategy:**
 * If no blockchain is available from either source, it will use the first available
 * blockchain from the API response.
 *
 * @param requireAuth If true, the service will only be created if the user is authenticated
 * If false, the service will be created without authentication for non-authenticated endpoints
 */
export function useBlockchainService(
  requireAuth: boolean = true
): BlockchainServiceResult {
  const { accessToken, isAuthenticated } = useAuthentication();
  const { selectedBlockchain, isUserSelected } = useBlockchainSelection();
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

  // Effect to fetch current blockchain based on chain ID or use selected blockchain
  useEffect(() => {
    if (!service) {
      setCurrentBlockchain(null);
      setCurrentBlockchainId(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Updated priority logic:
    // 1. If user explicitly selected a blockchain via UI, prioritize that
    // 2. Otherwise use: connected wallet chain > user selected blockchain > default
    const targetChainId =
      isUserSelected && selectedBlockchain
        ? selectedBlockchain.chainId
        : chain?.id || selectedBlockchain?.chainId || DEFAULT_CHAIN_ID;

    service
      .getBlockchains()
      .then((blockchains) => {
        let matchingBlockchain = blockchains.find(
          (blockchain) => blockchain.chainId === targetChainId
        );

        // If user explicitly selected a blockchain, use it directly
        if (isUserSelected && selectedBlockchain) {
          matchingBlockchain = selectedBlockchain;
        }
        // If wallet is not connected and we have a selectedBlockchain, use it directly
        else if (!chain?.id && selectedBlockchain) {
          matchingBlockchain = selectedBlockchain;
        }

        if (matchingBlockchain) {
          setCurrentBlockchain(matchingBlockchain);
          setCurrentBlockchainId(matchingBlockchain.id);

          if (isUserSelected && selectedBlockchain) {
            console.log(
              `Using user-selected blockchain: ${matchingBlockchain.name} (chainId: ${matchingBlockchain.chainId})`
            );
          } else if (!chain?.id && selectedBlockchain) {
            console.log(
              `Using context-selected blockchain: ${matchingBlockchain.name} (chainId: ${matchingBlockchain.chainId})`
            );
          } else if (!chain?.id) {
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
  }, [service, chain?.id, selectedBlockchain, isUserSelected]);

  return {
    service,
    currentBlockchain,
    currentBlockchainId,
    isLoading,
    error,
  };
}
