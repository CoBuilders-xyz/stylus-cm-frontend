import { useAuthentication } from '@/context/AuthenticationProvider';
import { ContractService } from '@/services/contractService';
import { useEffect, useMemo } from 'react';
import { useBlockchainService } from './useBlockchainService';

/**
 * Hook to access the ContractService
 * Automatically uses the authentication token from context and current blockchain ID
 * Returns null if not authenticated
 */
export function useContractService(): ContractService | null {
  const { accessToken, isAuthenticated } = useAuthentication();
  const { currentBlockchainId } = useBlockchainService();

  // Use memoization to ensure we don't create a new service instance on every render
  const contractService = useMemo(() => {
    if (!isAuthenticated || !accessToken) {
      return null;
    }
    // Create the service with the current blockchain ID
    return new ContractService(accessToken, currentBlockchainId);
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
