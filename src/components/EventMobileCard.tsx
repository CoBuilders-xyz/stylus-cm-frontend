'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import {
  formatTransactionHash,
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
import { BlockchainEvent } from '@/types/blockchainEvents';

interface Props {
  event: BlockchainEvent;
  onSelect?: (event: BlockchainEvent) => void;
}

export default function EventMobileCard({ event, onSelect }: Props) {
  const [copied, setCopied] = React.useState(false);
  const bid = getBidAmountFromEventData(event.eventData, event.eventName);
  const size = getSizeFromEventData(event.eventData, event.eventName);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await copyToClipboard(event.transactionHash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — the desktop button silently ignores too
    }
  };

  return (
    <button
      type='button'
      onClick={() => onSelect?.(event)}
      className='w-full text-left rounded-lg border border-[#2C2E30] bg-[#0F0F0F] hover:bg-[#161616] transition-colors p-4 flex flex-col gap-3'
    >
      <div className='flex items-center justify-between gap-2'>
        <Badge
          variant={getEventTypeBadgeVariant(event.eventName)}
          className='px-2 py-0.5 text-[11px] font-semibold w-fit'
        >
          {formatEventType(event.eventName)}
        </Badge>
        <div className='text-[11px] text-gray-500 text-right'>
          <div>{formatEventTimestamp(event.blockTimestamp)}</div>
          <div className='text-gray-600'>
            {formatRelativeTime(event.blockTimestamp)}
          </div>
        </div>
      </div>

      <div>
        <div className='text-[10px] uppercase tracking-wider text-gray-500'>
          Contract
        </div>
        <div className='text-sm font-mono text-white truncate'>
          {event.contractAddress}
        </div>
      </div>

      <div className='flex items-center gap-2 min-w-0'>
        <div className='min-w-0 flex-1'>
          <div className='text-[10px] uppercase tracking-wider text-gray-500'>
            Tx hash
          </div>
          <div className='text-sm font-mono text-white truncate'>
            {formatTransactionHash(event.transactionHash)}
          </div>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleCopy}
          className='p-1 h-auto shrink-0 hover:bg-gray-800'
          aria-label='Copy transaction hash'
        >
          {copied ? (
            <span className='text-green-400 text-xs'>✓</span>
          ) : (
            <Copy className='w-3.5 h-3.5' />
          )}
        </Button>
      </div>

      <div className='grid grid-cols-3 gap-2 text-xs pt-1'>
        <div>
          <div className='text-[10px] uppercase tracking-wider text-gray-500'>
            Block
          </div>
          <div className='text-white tabular-nums'>
            {formatBlockNumber(event.blockNumber)}
          </div>
        </div>
        <div>
          <div className='text-[10px] uppercase tracking-wider text-gray-500'>
            Bid
          </div>
          <div className='text-white tabular-nums truncate'>
            {bid || '—'}
          </div>
        </div>
        <div>
          <div className='text-[10px] uppercase tracking-wider text-gray-500'>
            Size
          </div>
          <div className='text-white tabular-nums'>
            {size ? formatSize(size) : '—'}
          </div>
        </div>
      </div>
    </button>
  );
}
