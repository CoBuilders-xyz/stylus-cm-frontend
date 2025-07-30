'use client';

import { useState, useEffect } from 'react';
import BlockchainEventsTable from '@/components/BlockchainEventsTable';
import SidePanel from '@/components/SidePanel';
import { BlockchainEvent } from '@/types/blockchainEvents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
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
  getBytecodeHashFromEventData,
  copyToClipboard,
} from '@/utils/blockchainEventFormatting';
import { formatSize } from '@/utils/formatting';
import { Copy, Info, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

  return (
    <div className='h-[calc(100vh-72px)] pt-18 flex flex-col'>
      <div
        className={`transition-all duration-300 ease-in-out flex-1 flex flex-col overflow-hidden`}
        style={{ paddingRight: isPanelOpen ? panelWidth : '0' }}
      >
        <div className='p-10 flex-1 flex flex-col overflow-hidden'>
          <BlockchainEventsTable onEventSelect={handleEventSelect} />
        </div>
      </div>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        width={panelWidth}
      >
        {isPanelOpen && selectedEvent && (
          <div className='text-white flex flex-col h-full bg-[#1A1919]'>
            {/* Sticky Header */}
            <div className='flex-shrink-0 bg-[#1A1919] p-6'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center space-x-3'>
                  <Badge
                    variant={getEventTypeBadgeVariant(selectedEvent.eventName)}
                    className='px-3 py-1 text-sm font-semibold'
                  >
                    {formatEventType(selectedEvent.eventName)}
                  </Badge>
                  <h2 className='text-xl font-bold'>Event Details</h2>
                </div>
                <Button
                  className='rounded-md border border-white hover:bg-gray-900'
                  onClick={handleClosePanel}
                >
                  <X className='h-5 w-5' />
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className='flex-1'>
              <div className='p-6'>
                {/* Transaction Information */}
                <div className='mb-6'>
                  <h3 className='text-lg font-semibold mb-4'>
                    Transaction Information
                  </h3>
                  <Table>
                    <TableBody>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='font-medium text-gray-400 w-1/3'>
                          Transaction Hash
                        </TableCell>
                        <TableCell className='text-left w-2/3'>
                          <div className='flex items-center space-x-2'>
                            <span className='font-mono text-sm'>
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
                                <span className='text-green-400 text-xs'>
                                  ✓
                                </span>
                              ) : (
                                <Copy className='w-3 h-3' />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='font-medium text-gray-400 w-1/3'>
                          Block Number
                        </TableCell>
                        <TableCell className='text-left w-2/3'>
                          <span className='font-mono'>
                            {formatBlockNumber(selectedEvent.blockNumber)}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='font-medium text-gray-400 w-1/3'>
                          Block Timestamp
                        </TableCell>
                        <TableCell className='text-left w-2/3'>
                          <div className='flex flex-col'>
                            <span>
                              {formatEventTimestamp(
                                selectedEvent.blockTimestamp
                              )}
                            </span>
                            <span className='text-xs text-gray-400'>
                              {formatRelativeTime(selectedEvent.blockTimestamp)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='font-medium text-gray-400 w-1/3'>
                          Log Index
                        </TableCell>
                        <TableCell className='text-left w-2/3'>
                          <span className='font-mono'>
                            {selectedEvent.logIndex}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Contract Information */}
                <div className='mb-6'>
                  <h3 className='text-lg font-semibold mb-4'>
                    Contract Information
                  </h3>
                  <Table>
                    <TableBody>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='font-medium text-gray-400 w-1/3'>
                          Cache Manager Address
                        </TableCell>
                        <TableCell className='text-left w-2/3'>
                          <div className='flex items-center space-x-2'>
                            <span className='font-mono text-sm'>
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
                                handleCopy(
                                  selectedEvent.contractAddress,
                                  'address'
                                )
                              }
                              className='p-1 h-auto hover:bg-gray-800'
                            >
                              {copySuccess.address ? (
                                <span className='text-green-400 text-xs'>
                                  ✓
                                </span>
                              ) : (
                                <Copy className='w-3 h-3' />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='font-medium text-gray-400 w-1/3'>
                          Bidder Address
                        </TableCell>
                        <TableCell className='text-left w-2/3'>
                          <div className='flex items-center space-x-2'>
                            <span className='font-mono text-sm'>
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
                                handleCopy(
                                  selectedEvent.originAddress,
                                  'origin'
                                )
                              }
                              className='p-1 h-auto hover:bg-gray-800'
                            >
                              {copySuccess.origin ? (
                                <span className='text-green-400 text-xs'>
                                  ✓
                                </span>
                              ) : (
                                <Copy className='w-3 h-3' />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Event Data */}
                <div className='mb-6'>
                  <h3 className='text-lg font-semibold mb-4'>Event Data</h3>
                  <Table>
                    <TableBody>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='font-medium text-gray-400 w-1/3'>
                          Event Name
                        </TableCell>
                        <TableCell className='text-left w-2/3'>
                          <span className='font-medium'>
                            {selectedEvent.eventName}
                          </span>
                        </TableCell>
                      </TableRow>
                      {getBidAmountFromEventData(
                        selectedEvent.eventData,
                        selectedEvent.eventName
                      ) && (
                        <TableRow className='hover:bg-transparent'>
                          <TableCell className='font-medium text-gray-400 w-1/3'>
                            <div className='flex items-center gap-2'>
                              Bid Amount
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className='w-4 h-4 cursor-help' />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className='max-w-xs'>
                                      <strong>
                                        Event Bid Amount includes time decay.
                                      </strong>
                                      <br />
                                      It&apos;s calculated as:
                                      <br />
                                      <code>
                                        bidAmount + (decayRate ×
                                        biddingTimestamp)
                                      </code>
                                      <br />
                                      This may differ from the actual amount
                                      paid.
                                      <br />
                                      For accurate values, refer to the contract
                                      tables.
                                    </p>{' '}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell className='text-left w-2/3'>
                            <span className='font-mono text-sm'>
                              {getBidAmountFromEventData(
                                selectedEvent.eventData,
                                selectedEvent.eventName
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      )}
                      {getSizeFromEventData(
                        selectedEvent.eventData,
                        selectedEvent.eventName
                      ) && (
                        <TableRow className='hover:bg-transparent'>
                          <TableCell className='font-medium text-gray-400 w-1/3'>
                            Size
                          </TableCell>
                          <TableCell className='text-left w-2/3'>
                            <span className='font-medium'>
                              {formatSize(
                                getSizeFromEventData(
                                  selectedEvent.eventData,
                                  selectedEvent.eventName
                                )
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      )}
                      {getBytecodeHashFromEventData(
                        selectedEvent.eventData
                      ) && (
                        <TableRow className='hover:bg-transparent'>
                          <TableCell className='font-medium text-gray-400 w-1/3'>
                            Bytecode Hash
                          </TableCell>
                          <TableCell className='text-left w-2/3'>
                            <div className='flex items-center space-x-2'>
                              <span className='font-mono text-sm'>
                                {formatContractAddress(
                                  getBytecodeHashFromEventData(
                                    selectedEvent.eventData
                                  ),
                                  10,
                                  10
                                )}
                              </span>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  handleCopy(
                                    getBytecodeHashFromEventData(
                                      selectedEvent.eventData
                                    ),
                                    'bytecode'
                                  )
                                }
                                className='p-1 h-auto hover:bg-gray-800'
                              >
                                {copySuccess.bytecode ? (
                                  <span className='text-green-400 text-xs'>
                                    ✓
                                  </span>
                                ) : (
                                  <Copy className='w-3 h-3' />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='font-medium text-gray-400 w-1/3'>
                          Blockchain
                        </TableCell>
                        <TableCell className='text-left w-2/3'>
                          <span className='font-medium'>
                            {selectedEvent.blockchainName}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='font-medium text-gray-400 w-1/3'>
                          Raw Event Data
                        </TableCell>
                        <TableCell className='text-left w-2/3'>
                          <div className='bg-black rounded p-3 border border-gray-700'>
                            <pre className='text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto'>
                              {JSON.stringify(selectedEvent.eventData, null, 2)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
