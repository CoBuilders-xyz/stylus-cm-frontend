'use client';

import { useState, useEffect } from 'react';
import BlockchainEventsTable from '@/components/BlockchainEventsTable';
import SidePanel from '@/components/SidePanel';
import { BlockchainEvent } from '@/types/blockchainEvents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  formatTransactionHash,
  formatContractAddress,
  formatEventTimestamp,
  formatRelativeTime,
  getEventTypeBadgeVariant,
  formatEventType,
  formatBlockNumber,
  getBidAmountFromEventData,
  getSizeFromEventData,
  copyToClipboard,
} from '@/utils/blockchainEventFormatting';
import { formatSize } from '@/utils/formatting';
import { Copy, ExternalLink, X } from 'lucide-react';

export default function BlockchainEventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<BlockchainEvent | null>(
    null
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState<{ [key: string]: boolean }>(
    {}
  );
  const panelWidth = '50%';

  // Set CSS variable for header height
  useEffect(() => {
    const setHeaderHeight = () => {
      const header = document.querySelector(
        'div[class*="bg-black text-white z-10 flex"]'
      );
      if (header) {
        document.documentElement.style.setProperty(
          '--header-height',
          `${header.clientHeight}px`
        );
      }
    };

    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);

    return () => {
      window.removeEventListener('resize', setHeaderHeight);
    };
  }, []);

  // Handler for event selection (view details)
  const handleEventSelect = (event: BlockchainEvent) => {
    setSelectedEvent(event);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedEvent(null);
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await copyToClipboard(text);
      setCopySuccess({ ...copySuccess, [field]: true });
      setTimeout(() => {
        setCopySuccess({ ...copySuccess, [field]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className='min-h-screen pt-18'>
      <div
        className={`transition-all duration-300 ease-in-out`}
        style={{ paddingRight: isPanelOpen ? panelWidth : '0' }}
      >
        <div className='p-10'>
          <BlockchainEventsTable onEventSelect={handleEventSelect} />
        </div>
      </div>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        width={panelWidth}
      >
        {isPanelOpen && selectedEvent && (
          <div className='p-6'>
            {/* Header */}
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center space-x-3'>
                <Badge
                  variant={getEventTypeBadgeVariant(selectedEvent.eventName)}
                  className='px-3 py-1 text-sm font-semibold'
                >
                  {formatEventType(selectedEvent.eventName)}
                </Badge>
                <h2 className='text-xl font-bold text-white'>Event Details</h2>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleClosePanel}
                className='p-2 hover:bg-gray-800'
              >
                <X className='w-5 h-5' />
              </Button>
            </div>

            {/* Event Details */}
            <ScrollArea className='h-[calc(100vh-200px)]'>
              <div className='space-y-6'>
                {/* Transaction Info */}
                <div className='bg-gray-900 rounded-lg p-4'>
                  <h3 className='text-lg font-semibold text-white mb-4'>
                    Transaction Information
                  </h3>

                  <div className='space-y-3'>
                    <div>
                      <label className='text-sm text-gray-400'>
                        Transaction Hash
                      </label>
                      <div className='flex items-center space-x-2 mt-1'>
                        <span className='font-mono text-sm text-white'>
                          {formatTransactionHash(
                            selectedEvent.transactionHash,
                            10,
                            10
                          )}
                        </span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            handleCopy(selectedEvent.transactionHash, 'tx')
                          }
                          className='p-1 h-auto hover:bg-gray-800'
                        >
                          {copySuccess.tx ? (
                            <span className='text-green-400 text-xs'>✓</span>
                          ) : (
                            <Copy className='w-3 h-3' />
                          )}
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            handleExternalLink(
                              `https://etherscan.io/tx/${selectedEvent.transactionHash}`
                            )
                          }
                          className='p-1 h-auto hover:bg-gray-800'
                        >
                          <ExternalLink className='w-3 h-3' />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className='text-sm text-gray-400'>
                        Block Number
                      </label>
                      <div className='text-white font-mono'>
                        {formatBlockNumber(selectedEvent.blockNumber)}
                      </div>
                    </div>

                    <div>
                      <label className='text-sm text-gray-400'>
                        Block Timestamp
                      </label>
                      <div className='text-white'>
                        <div>
                          {formatEventTimestamp(selectedEvent.blockTimestamp)}
                        </div>
                        <div className='text-xs text-gray-400'>
                          {formatRelativeTime(selectedEvent.blockTimestamp)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className='text-sm text-gray-400'>Log Index</label>
                      <div className='text-white font-mono'>
                        {selectedEvent.logIndex}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract Info */}
                <div className='bg-gray-900 rounded-lg p-4'>
                  <h3 className='text-lg font-semibold text-white mb-4'>
                    Contract Information
                  </h3>

                  <div className='space-y-3'>
                    <div>
                      <label className='text-sm text-gray-400'>
                        Contract Address
                      </label>
                      <div className='flex items-center space-x-2 mt-1'>
                        <span className='font-mono text-sm text-white'>
                          {formatContractAddress(
                            selectedEvent.contractAddress,
                            10,
                            10
                          )}
                        </span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            handleCopy(selectedEvent.contractAddress, 'address')
                          }
                          className='p-1 h-auto hover:bg-gray-800'
                        >
                          {copySuccess.address ? (
                            <span className='text-green-400 text-xs'>✓</span>
                          ) : (
                            <Copy className='w-3 h-3' />
                          )}
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            handleExternalLink(
                              `https://etherscan.io/address/${selectedEvent.contractAddress}`
                            )
                          }
                          className='p-1 h-auto hover:bg-gray-800'
                        >
                          <ExternalLink className='w-3 h-3' />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className='text-sm text-gray-400'>
                        Contract Name
                      </label>
                      <div className='text-white'>
                        {selectedEvent.contractName}
                      </div>
                    </div>

                    <div>
                      <label className='text-sm text-gray-400'>
                        Origin Address
                      </label>
                      <div className='flex items-center space-x-2 mt-1'>
                        <span className='font-mono text-sm text-white'>
                          {formatContractAddress(
                            selectedEvent.originAddress,
                            10,
                            10
                          )}
                        </span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            handleCopy(selectedEvent.originAddress, 'origin')
                          }
                          className='p-1 h-auto hover:bg-gray-800'
                        >
                          {copySuccess.origin ? (
                            <span className='text-green-400 text-xs'>✓</span>
                          ) : (
                            <Copy className='w-3 h-3' />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Data */}
                <div className='bg-gray-900 rounded-lg p-4'>
                  <h3 className='text-lg font-semibold text-white mb-4'>
                    Event Data
                  </h3>

                  <div className='space-y-3'>
                    <div>
                      <label className='text-sm text-gray-400'>
                        Event Name
                      </label>
                      <div className='text-white'>
                        {selectedEvent.eventName}
                      </div>
                    </div>

                    {getBidAmountFromEventData(selectedEvent.eventData) && (
                      <div>
                        <label className='text-sm text-gray-400'>
                          Bid Amount
                        </label>
                        <div className='text-white font-mono'>
                          {getBidAmountFromEventData(selectedEvent.eventData)}
                        </div>
                      </div>
                    )}

                    {getSizeFromEventData(selectedEvent.eventData) && (
                      <div>
                        <label className='text-sm text-gray-400'>Size</label>
                        <div className='text-white'>
                          {formatSize(
                            getSizeFromEventData(selectedEvent.eventData)
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className='text-sm text-gray-400'>
                        Event Type
                      </label>
                      <div className='flex items-center space-x-2 mt-1'>
                        <Badge
                          variant={
                            selectedEvent.isRealTime ? 'default' : 'secondary'
                          }
                          className='px-2 py-1 text-xs font-semibold'
                        >
                          {selectedEvent.isRealTime
                            ? 'Real-time'
                            : 'Historical'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className='text-sm text-gray-400'>
                        Blockchain
                      </label>
                      <div className='text-white'>
                        {selectedEvent.blockchainName}
                      </div>
                    </div>

                    <div>
                      <label className='text-sm text-gray-400'>
                        Raw Event Data
                      </label>
                      <div className='bg-black rounded p-3 mt-1'>
                        <pre className='text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto'>
                          {JSON.stringify(selectedEvent.eventData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
