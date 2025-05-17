import { useCallback } from 'react';

// Define a custom event for contract updates
export const CONTRACT_UPDATED_EVENT = 'contract-updated';

/**
 * A hook to trigger contract list updates across components
 * Provides methods to signal when contracts are updated and a way to listen for updates
 */
export function useContractsUpdater() {
  /**
   * Signal that a contract has been updated and the contract list should be reloaded
   * @param contractId ID of the updated contract
   * @param updateType Type of update that occurred
   */
  const signalContractUpdated = useCallback(
    (contractId: string, updateType: 'name' | 'bid' | 'deleted' = 'name') => {
      // Create and dispatch a custom event that other components can listen for
      const event = new CustomEvent(CONTRACT_UPDATED_EVENT, {
        detail: { contractId, updateType, timestamp: Date.now() },
      });
      window.dispatchEvent(event);
      console.log(`Contract update signaled: ${updateType} for ${contractId}`);
    },
    []
  );

  return {
    signalContractUpdated,
  };
}

/**
 * Add a listener for contract update events
 * @param callback Function to call when a contract is updated
 */
export function addContractUpdateListener(
  callback: (contractId: string, updateType: string) => void
) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail.contractId, customEvent.detail.updateType);
  };

  window.addEventListener(CONTRACT_UPDATED_EVENT, handler);

  // Return a cleanup function to remove the listener
  return () => {
    window.removeEventListener(CONTRACT_UPDATED_EVENT, handler);
  };
}
