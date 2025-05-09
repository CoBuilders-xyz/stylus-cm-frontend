import { useAuthentication } from '@/context/AuthenticationProvider';
import { AlertService } from '@/services/alertService';
import { useMemo } from 'react';

/**
 * Hook to access the AlertService
 * Automatically uses the authentication token from context
 * Returns null if not authenticated
 */
export function useAlertService(): AlertService | null {
  const { accessToken, isAuthenticated } = useAuthentication();

  // Use memoization to ensure we don't create a new service instance on every render
  const alertService = useMemo(() => {
    if (!isAuthenticated || !accessToken) {
      return null;
    }

    // Create the service with the current access token
    return new AlertService(accessToken);
  }, [accessToken, isAuthenticated]);

  return alertService;
}
