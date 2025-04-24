import { useAuthentication } from '@/context/AuthenticationProvider';
import { ContractService } from '@/services/contractService';
import { useMemo } from 'react';

/**
 * Hook to access the ContractService
 * Automatically uses the authentication token from context
 * Returns null if not authenticated
 */
export function useContractService(): ContractService | null {
  const { accessToken, isAuthenticated } = useAuthentication();

  // Use memoization to ensure we don't create a new service instance on every render
  const contractService = useMemo(() => {
    if (!isAuthenticated || !accessToken) {
      return null;
    }

    return new ContractService(accessToken);
  }, [accessToken, isAuthenticated]);

  return contractService;
}
