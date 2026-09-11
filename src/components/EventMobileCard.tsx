'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import {
  formatTransactionHash,
  formatEventTimestamp,
  formatRelativeTime,
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

/**
 * One row of the mobile events list. Rendered inside a single bordered card
 * by the parent (rows separated by hairlines): event identity + metrics on
 * the left, event type + relative time on the right (one trailing edge).
 */
export default function EventMobileCard({ event, onSelect }: Props) {
  const [copied, setCopied] = React.useState(false);
  const bid = getBidAmountFromEventData(event.eventData, event.eventName);
  const size = getSizeFromEventData(event.eventData, event.eventName);
  const isDelete = event.eventName === 'DeleteBid';

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

  const isSelectable = Boolean(onSelect);
  const handleSelect = () => onSelect?.(event);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      onClick={isSelectable ? handleSelect : undefined}
      onKeyDown={isSelectable ? handleKeyDown : undefined}
      className={`w-full text-start px-[14px] py-3 flex items-start justify-between gap-3 outline-none transition-colors ${
        isSelectable
          ? 'cursor-pointer hover:bg-surface-2 focus-visible:bg-surface-2'
          : ''
      }`}
    >
      {/* Leading column: tx identity + metrics */}
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-1.5 min-w-0'>
          <span className='mono-addr !text-ink-2 text-[12px] truncate'>
            {formatTransactionHash(event.transactionHash)}
          </span>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleCopy}
            className='p-1 h-auto shrink-0 text-ink-3 hover:text-ink-1 hover:bg-transparent'
            aria-label='Copy transaction hash'
          >
            {copied ? (
              <span className='text-ok-text text-xs'>✓</span>
            ) : (
              <Copy className='w-3 h-3' />
            )}
          </Button>
        </div>
        <div className='mono-addr truncate mt-0.5'>
          {event.contractAddress}
        </div>
        <div className='flex items-center gap-2.5 mt-1.5 text-[11px] text-ink-2 num flex-wrap'>
          <span>
            block{' '}
            <span className='text-ink-1 font-medium'>
              {formatBlockNumber(event.blockNumber)}
            </span>
          </span>
          {bid ? (
            <span>
              bid <span className='text-ink-1 font-medium'>{bid}</span>
            </span>
          ) : null}
          {size ? (
            <span className='text-ink-1 font-medium'>{formatSize(size)}</span>
          ) : null}
        </div>
      </div>

      {/* Trailing column: type + time, one shared edge */}
      <div className='flex flex-col items-end gap-1.5 shrink-0'>
        <span className={`pill ${isDelete ? 'pill-crit' : 'pill-muted'}`}>
          <span className={`pill-dot ${isDelete ? 'bg-crit' : 'bg-ok'}`} />
          {formatEventType(event.eventName)}
        </span>
        <span
          className='text-[10.5px] text-ink-3 num text-end'
          title={formatEventTimestamp(event.blockTimestamp)}
        >
          {formatRelativeTime(event.blockTimestamp)}
        </span>
      </div>
    </div>
  );
}
