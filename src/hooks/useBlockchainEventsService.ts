import { BlockchainEventsService } from '@/services/blockchainEventsService';
import { useEffect, useMemo } from 'react';
import { useBlockchainService } from './useBlockchainService';

/**
 * Hook to access the BlockchainEventsService
 * Automatically uses the current blockchain ID
 * No authentication required - this is a public endpoint
 */
export function useBlockchainEventsService(): BlockchainEventsService {
  const { currentBlockchainId } = useBlockchainService(false); // Allow unauthenticated access for blockchain ID

  // Use memoization to ensure we don't create a new service instance on every render
  const blockchainEventsService = useMemo(() => {
    return new BlockchainEventsService(currentBlockchainId);
  }, [currentBlockchainId]);

  // Update the blockchain ID if it changes after service creation
  useEffect(() => {
    if (
      blockchainEventsService &&
      currentBlockchainId !== blockchainEventsService.getCurrentBlockchainId()
    ) {
      blockchainEventsService.setCurrentBlockchainId(currentBlockchainId);
    }
  }, [blockchainEventsService, currentBlockchainId]);

  return blockchainEventsService;
}
