'use client';

import { useBlockchainSelection } from '@/context/BlockchainSelectionProvider';
import { useSwitchChain } from 'wagmi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Globe } from 'lucide-react';

export default function BlockchainSelector() {
  const {
    selectedBlockchain,
    availableBlockchains,
    setSelectedBlockchain,
    isLoading,
  } = useBlockchainSelection();

  const { switchChain } = useSwitchChain();

  // Don't render if still loading or no blockchains available
  if (isLoading || availableBlockchains.length === 0) {
    return null;
  }

  const handleBlockchainSelect = (
    blockchain: (typeof availableBlockchains)[0]
  ) => {
    // Update the blockchain selection context
    setSelectedBlockchain(blockchain);

    // Switch to the corresponding wagmi chain
    if (switchChain) {
      switchChain({ chainId: blockchain.chainId });
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
          <Globe className='w-4 h-4' />
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
