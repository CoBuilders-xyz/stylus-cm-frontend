'use client';

import { useBlockchainSelection } from '@/context/BlockchainSelectionProvider';
import { useSwitchChain, useAccount } from 'wagmi';
import { useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { showErrorToast } from '@/components/Toast';
import { getNetworkSwitchErrorMessage } from '@/utils/walletErrors';

export default function BlockchainSelector() {
  const {
    selectedBlockchain,
    availableBlockchains,
    setSelectedBlockchain,
    isLoading,
  } = useBlockchainSelection();

  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { isConnected, chain } = useAccount();

  // Sync wallet chain changes to UI selector
  useEffect(() => {
    if (!isConnected || !chain?.id || isLoading) {
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

  const handleBlockchainSelect = async (
    blockchain: (typeof availableBlockchains)[0]
  ) => {
    // Only switch if user selected a different blockchain
    if (blockchain.id === selectedBlockchain?.id) return;

    if (!isConnected) {
      setSelectedBlockchain(blockchain);
      return;
    }

    try {
      // Keep the application on its current chain until the wallet confirms
      // the switch. A rejection must never leave UI state ahead of the wallet.
      await switchChainAsync({ chainId: blockchain.chainId });
      setSelectedBlockchain(blockchain);
    } catch (error) {
      console.warn(`Failed to switch to chain ${blockchain.name}`);
      showErrorToast({
        message: getNetworkSwitchErrorMessage(error, blockchain.name),
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className='h-8 px-[11px] border border-hairline bg-surface-1 rounded-lg flex items-center justify-center cursor-pointer text-ink-2 hover:text-ink-1 hover:border-hairline-strong gap-1.5'
          title='Select Blockchain'
        >
          <span className='text-xs'>
            {selectedBlockchain?.name || 'Select Chain'}
          </span>
          <ChevronDown className='w-3 h-3' />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-48 bg-surface-2 border-hairline-strong text-ink-1'
        align='end'
      >
        <DropdownMenuGroup>
          {availableBlockchains.map((blockchain) => (
            <DropdownMenuItem
              key={blockchain.id}
              onClick={() => handleBlockchainSelect(blockchain)}
              disabled={isSwitchingChain}
              className={`cursor-pointer hover:bg-surface-3 ${
                selectedBlockchain?.id === blockchain.id ? 'bg-surface-3' : ''
              }`}
            >
              <div className='flex items-center justify-between w-full'>
                <span>{blockchain.name}</span>
                {selectedBlockchain?.id === blockchain.id && (
                  <div className='w-2 h-2 bg-ink-1 rounded-full' />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
