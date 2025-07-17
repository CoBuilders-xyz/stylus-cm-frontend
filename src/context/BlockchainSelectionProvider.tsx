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
  isUserSelected: boolean; // Track if user explicitly selected a blockchain
  setIsUserSelected: (isSelected: boolean) => void;
}

// Create the context
const BlockchainSelectionContext = createContext<
  BlockchainSelectionContextType | undefined
>(undefined);

// LocalStorage key for storing the selected chain ID
const SELECTED_CHAIN_ID_KEY = 'selectedChainId';

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
  const [isUserSelected, setIsUserSelected] = useState(false);

  // Helper function to get stored chain ID from localStorage
  const getStoredChainId = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(SELECTED_CHAIN_ID_KEY);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  };

  // Helper function to store chain ID in localStorage
  const storeChainId = (chainId: number): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SELECTED_CHAIN_ID_KEY, chainId.toString());
    } catch (error) {
      console.warn('Failed to write to localStorage:', error);
    }
  };

  // Enhanced setSelectedBlockchain to track user selection and store in localStorage
  const handleSetSelectedBlockchain = (blockchain: Blockchain) => {
    setSelectedBlockchain(blockchain);
    setIsUserSelected(true);
    storeChainId(blockchain.chainId);
  };

  // Fetch available blockchains on mount
  useEffect(() => {
    const fetchBlockchains = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const service = new BlockchainService();
        const blockchains = await service.getBlockchains();

        setAvailableBlockchains(blockchains);

        // Priority order for selecting blockchain:
        // 1. Previously stored chainId from localStorage
        // 2. Default chainId from environment variable
        // 3. First available blockchain
        const storedChainId = getStoredChainId();
        let defaultBlockchain: Blockchain | undefined;

        if (storedChainId) {
          defaultBlockchain = blockchains.find(
            (b) => b.chainId === parseInt(storedChainId)
          );
          if (defaultBlockchain) {
            setIsUserSelected(true); // Mark as user selected since it was previously chosen
          }
        }

        // Fall back to environment default if no stored selection or stored selection not found
        if (!defaultBlockchain) {
          const defaultChainId = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID;
          defaultBlockchain = defaultChainId
            ? blockchains.find((b) => b.chainId === parseInt(defaultChainId))
            : blockchains[0];
        }

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
        setSelectedBlockchain: handleSetSelectedBlockchain,
        isLoading,
        error,
        isUserSelected,
        setIsUserSelected,
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
