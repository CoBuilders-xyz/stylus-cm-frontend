'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BlockchainService } from '@/services/blockchainService';
import { Blockchain } from '@/services/contractService';

// Define the shape of the context data
interface BlockchainSelectionContextType {
  selectedBlockchain: Blockchain | null;
  availableBlockchains: Blockchain[];
  setSelectedBlockchain: (blockchain: Blockchain) => void;
  isLoading: boolean;
  error: Error | null;
}

// Create the context
const BlockchainSelectionContext = createContext<
  BlockchainSelectionContextType | undefined
>(undefined);

// Create a provider component
export const BlockchainSelectionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [selectedBlockchain, setSelectedBlockchain] =
    useState<Blockchain | null>(null);
  const [availableBlockchains, setAvailableBlockchains] = useState<
    Blockchain[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch available blockchains on mount
  useEffect(() => {
    const fetchBlockchains = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const service = new BlockchainService();
        const blockchains = await service.getBlockchains();

        setAvailableBlockchains(blockchains);

        // Set default blockchain (first one or based on env variable)
        const defaultChainId = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID;
        const defaultBlockchain = defaultChainId
          ? blockchains.find((b) => b.chainId === parseInt(defaultChainId))
          : blockchains[0];

        if (defaultBlockchain) {
          setSelectedBlockchain(defaultBlockchain);
        } else if (blockchains.length > 0) {
          setSelectedBlockchain(blockchains[0]);
        }
      } catch (err) {
        console.error('Error fetching blockchains:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlockchains();
  }, []);

  return (
    <BlockchainSelectionContext.Provider
      value={{
        selectedBlockchain,
        availableBlockchains,
        setSelectedBlockchain,
        isLoading,
        error,
      }}
    >
      {children}
    </BlockchainSelectionContext.Provider>
  );
};

// Custom hook to use the blockchain selection context
export const useBlockchainSelection = (): BlockchainSelectionContextType => {
  const context = useContext(BlockchainSelectionContext);
  if (context === undefined) {
    throw new Error(
      'useBlockchainSelection must be used within a BlockchainSelectionProvider'
    );
  }
  return context;
};
