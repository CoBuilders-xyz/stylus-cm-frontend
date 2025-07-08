import { useAuthentication } from '@/context/AuthenticationProvider';
import { ContractService } from '@/services/contractService';
import { useEffect, useMemo } from 'react';
import { useBlockchainService } from './useBlockchainService';

/**
 * Hook to access the ContractService
 * Automatically uses the authentication token from context and current blockchain ID
 * Returns a service instance even when not authenticated (for public endpoints like explore)
 * Uses blockchain service without authentication requirement to get blockchain ID for both auth and non-auth users
 */
export function useContractService(): ContractService {
  const { accessToken, isAuthenticated } = useAuthentication();
  const { currentBlockchainId } = useBlockchainService(false); // Allow unauthenticated access for blockchain ID

  // Use memoization to ensure we don't create a new service instance on every render
  const contractService = useMemo(() => {
    // Pass accessToken if authenticated, otherwise null for anonymous access
    const token = isAuthenticated ? accessToken : null;
    return new ContractService(token, currentBlockchainId);
  }, [accessToken, isAuthenticated, currentBlockchainId]);

  // Update the blockchain ID if it changes after service creation
  useEffect(() => {
    if (
      contractService &&
      currentBlockchainId !== contractService.getCurrentBlockchainId()
    ) {
      contractService.setCurrentBlockchainId(currentBlockchainId);
    }
  }, [contractService, currentBlockchainId]);

  return contractService;
}
