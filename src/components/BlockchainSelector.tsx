'use client';

import { useBlockchainSelection } from '@/context/BlockchainSelectionProvider';
import { useSwitchChain, useAccount } from 'wagmi';
import { useEffect, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export default function BlockchainSelector() {
  const {
    selectedBlockchain,
    availableBlockchains,
    setSelectedBlockchain,
    isLoading,
  } = useBlockchainSelection();

  const { switchChain } = useSwitchChain();
  const { isConnected, chain } = useAccount();

  // Track if we initiated the chain switch to prevent loops
  const isInternalSwitch = useRef(false);

  // Sync wallet chain changes to UI selector
  useEffect(() => {
    if (isInternalSwitch.current || !isConnected || !chain?.id || isLoading) {
      return;
    }

    // Find matching blockchain for the current wallet chain
    const matchingBlockchain = availableBlockchains.find(
      (blockchain) => blockchain.chainId === chain.id
    );

    // Update selector if wallet chain is different from selected blockchain
    if (
      matchingBlockchain &&
      matchingBlockchain.id !== selectedBlockchain?.id
    ) {
      setSelectedBlockchain(matchingBlockchain);
    }
  }, [
    chain?.id,
    availableBlockchains,
    selectedBlockchain?.id,
    setSelectedBlockchain,
    isConnected,
    isLoading,
  ]);

  // Don't render if still loading or no blockchains available
  if (isLoading || availableBlockchains.length === 0) {
    return null;
  }

  const handleBlockchainSelect = (
    blockchain: (typeof availableBlockchains)[0]
  ) => {
    // Only switch if user selected a different blockchain
    if (blockchain.id === selectedBlockchain?.id) return;

    setSelectedBlockchain(blockchain);

    // Switch wallet chain if connected
    if (isConnected && switchChain) {
      isInternalSwitch.current = true;
      try {
        switchChain({ chainId: blockchain.chainId });
      } catch (error) {
        console.warn(`Failed to switch to chain ${blockchain.name}:`, error);
      } finally {
        // Reset flag after a short delay to allow chain switch to complete
        setTimeout(() => {
          isInternalSwitch.current = false;
        }, 1000);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className='border border-white rounded-[10px] p-2 flex items-center justify-center cursor-pointer hover:bg-gray-900 space-x-2'
          style={{ borderWidth: '1px' }}
          title='Select Blockchain'
        >
          <span className='text-xs'>
            {selectedBlockchain?.name || 'Select Chain'}
          </span>
          <ChevronDown className='w-3 h-3' />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-48 bg-black border-white text-white'
        align='end'
      >
        <DropdownMenuGroup>
          {availableBlockchains.map((blockchain) => (
            <DropdownMenuItem
              key={blockchain.id}
              onClick={() => handleBlockchainSelect(blockchain)}
              className={`cursor-pointer hover:bg-gray-800 ${
                selectedBlockchain?.id === blockchain.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className='flex items-center justify-between w-full'>
                <span>{blockchain.name}</span>
                {selectedBlockchain?.id === blockchain.id && (
                  <div className='w-2 h-2 bg-white rounded-full' />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
