'use client';

import { useState, useEffect } from 'react';
import BlockchainEventsTable from '@/components/BlockchainEventsTable';
import SidePanel from '@/components/SidePanel';
import { BlockchainEvent } from '@/types/blockchainEvents';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  formatTransactionHash,
  formatContractAddress,
  formatEventTimestamp,
  formatRelativeTime,
  formatEventType,
  formatBlockNumber,
  getBidAmountFromEventData,
  getSizeFromEventData,
  getBytecodeHashFromEventData,
  copyToClipboard,
} from '@/utils/blockchainEventFormatting';
import { formatSize } from '@/utils/formatting';
import { Copy, Info, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
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
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const desktopPanelWidth = '50%';
  const panelWidth = isDesktop ? desktopPanelWidth : '100%';

  // Set CSS variable for header height
  useEffect(() => {
    const setHeaderHeight = () => {
      const header = document.querySelector('#app-header');
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
    <div
      className='flex-1 flex flex-col min-h-0'
      style={{ paddingTop: 'var(--app-chrome-h, 64px)' }}
    >
      <div
        className={`transition-all duration-300 ease-in-out flex-1 flex flex-col overflow-hidden`}
        style={{
          paddingRight: isDesktop && isPanelOpen ? desktopPanelWidth : '0',
        }}
      >
        <div className='page-gutter py-5 flex-1 flex flex-col overflow-hidden'>
          <BlockchainEventsTable onEventSelect={handleEventSelect} />
        </div>
      </div>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        width={panelWidth}
      >
        {isPanelOpen && selectedEvent && (
          <div className='text-ink-1 flex flex-col h-full bg-surface-1'>
            {/* Sticky Header */}
            <div className='flex-shrink-0 bg-surface-1 border-b border-hairline px-5 py-4'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center space-x-3'>
                  <span
                    className={`pill ${
                      selectedEvent.eventName === 'DeleteBid'
                        ? 'pill-crit'
                        : 'pill-muted'
                    }`}
                  >
                    <span
                      className={`pill-dot ${
                        selectedEvent.eventName === 'DeleteBid'
                          ? 'bg-crit'
                          : 'bg-ok'
                      }`}
                    />
                    {formatEventType(selectedEvent.eventName)}
                  </span>
                  <h2 className='text-[15px] font-semibold'>Event Details</h2>
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handleClosePanel}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className='flex-1'>
              <div className='p-4 sm:p-6 min-w-0'>
                {/* Transaction Information */}
                <div className='mb-6'>
                  <h3 className='text-[13.5px] font-semibold mb-2 text-ink-1'>
                    Transaction Information
                  </h3>
                  <Table className='table-fixed [&_td]:whitespace-normal'>
                    <TableBody>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='text-ink-3 w-1/3'>
                          Transaction Hash
                        </TableCell>
                        <TableCell className='text-start w-2/3 min-w-0'>
                          <div className='flex items-center gap-2 min-w-0'>
                            <span className='font-mono text-sm truncate min-w-0'>
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
                              className='p-1 h-auto text-ink-3 hover:text-ink-1 hover:bg-transparent'
                            >
                              {copySuccess.tx ? (
                                <span className='text-ok-text text-xs'>
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
                        <TableCell className='text-ink-3 w-1/3'>
                          Block Number
                        </TableCell>
                        <TableCell className='text-start w-2/3'>
                          <span className='font-mono'>
                            {formatBlockNumber(selectedEvent.blockNumber)}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='text-ink-3 w-1/3'>
                          Block Timestamp
                        </TableCell>
                        <TableCell className='text-start w-2/3'>
                          <div className='flex flex-col'>
                            <span>
                              {formatEventTimestamp(
                                selectedEvent.blockTimestamp
                              )}
                            </span>
                            <span className='text-xs text-ink-3'>
                              {formatRelativeTime(selectedEvent.blockTimestamp)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='text-ink-3 w-1/3'>
                          Log Index
                        </TableCell>
                        <TableCell className='text-start w-2/3'>
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
                  <h3 className='text-[13.5px] font-semibold mb-2 text-ink-1'>
                    Contract Information
                  </h3>
                  <Table className='table-fixed [&_td]:whitespace-normal'>
                    <TableBody>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='text-ink-3 w-1/3'>
                          Cache Manager Address
                        </TableCell>
                        <TableCell className='text-start w-2/3 min-w-0'>
                          <div className='flex items-center gap-2 min-w-0'>
                            <span className='font-mono text-sm truncate min-w-0'>
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
                              className='p-1 h-auto text-ink-3 hover:text-ink-1 hover:bg-transparent'
                            >
                              {copySuccess.address ? (
                                <span className='text-ok-text text-xs'>
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
                        <TableCell className='text-ink-3 w-1/3'>
                          Bidder Address
                        </TableCell>
                        <TableCell className='text-start w-2/3 min-w-0'>
                          <div className='flex items-center gap-2 min-w-0'>
                            <span className='font-mono text-sm truncate min-w-0'>
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
                              className='p-1 h-auto text-ink-3 hover:text-ink-1 hover:bg-transparent'
                            >
                              {copySuccess.origin ? (
                                <span className='text-ok-text text-xs'>
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
                  <h3 className='text-[13.5px] font-semibold mb-2 text-ink-1'>Event Data</h3>
                  <Table className='table-fixed [&_td]:whitespace-normal'>
                    <TableBody>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='text-ink-3 w-1/3'>
                          Event Name
                        </TableCell>
                        <TableCell className='text-start w-2/3'>
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
                          <TableCell className='text-ink-3 w-1/3'>
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
                          <TableCell className='text-start w-2/3'>
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
                          <TableCell className='text-ink-3 w-1/3'>
                            Size
                          </TableCell>
                          <TableCell className='text-start w-2/3'>
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
                          <TableCell className='text-ink-3 w-1/3'>
                            Bytecode Hash
                          </TableCell>
                          <TableCell className='text-start w-2/3 min-w-0'>
                            <div className='flex items-center gap-2 min-w-0'>
                              <span className='font-mono text-sm truncate min-w-0'>
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
                                className='p-1 h-auto text-ink-3 hover:text-ink-1 hover:bg-transparent'
                              >
                                {copySuccess.bytecode ? (
                                  <span className='text-ok-text text-xs'>
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
                        <TableCell className='text-ink-3 w-1/3'>
                          Blockchain
                        </TableCell>
                        <TableCell className='text-start w-2/3'>
                          <span className='font-medium'>
                            {selectedEvent.blockchainName}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow className='hover:bg-transparent'>
                        <TableCell className='text-ink-3 w-1/3'>
                          Raw Event Data
                        </TableCell>
                        <TableCell className='text-start w-2/3 min-w-0'>
                          <div className='bg-surface-2 rounded-lg p-3 border border-hairline min-w-0'>
                            <pre className='text-xs text-ink-2 whitespace-pre-wrap break-all overflow-x-hidden'>
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
