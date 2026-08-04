'use client';

import React from 'react';
import { formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { formatRoundedEth, formatSize } from '@/utils/formatting';
import { Zap } from 'lucide-react';
import {
  ActivationInfo,
  activationDotClass,
  activationStatusLabel,
  activationSubLabel,
  activationTextClass,
} from '@/lib/activation';
import { Contract } from '@/services/contractService';
import ContractStateIndicator from '@/components/ContractStateIndicator';

interface Props {
  contract: Contract;
  viewType: 'my-contracts' | 'explore-contracts';
  /**
   * Effective activation info derived by the parent table from the persisted
   * `activationStatus` + on-chain `programTimeLeft`. Optional because some
   * callers (e.g. tests) may not provide it; the card hides the badge when
   * missing rather than rendering a dead placeholder.
   */
  activation?: ActivationInfo;
  isAuthenticated: boolean;
  onContractSelect?: (contractId: string, initialData?: Contract) => void;
  onAddContract?: (contract: Contract) => void;
  onActivate?: (contract: Contract) => void;
}

function truncateAddress(addr: string) {
  if (!addr) return '';
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

/**
 * One row of the mobile contract list. Rendered inside a single bordered
 * card by the parent (rows separated by hairlines) — layout is two columns
 * with one shared trailing edge: identity + metrics on the left, state on
 * the right. The whole row is tappable; the only inline actions are the
 * compact Activate / Add buttons when they actually apply.
 */
export default function ContractMobileCard({
  contract,
  viewType,
  activation,
  isAuthenticated,
  onContractSelect,
  onAddContract,
  onActivate,
}: Props) {
  const displayName =
    viewType === 'my-contracts'
      ? contract.name
      : contract.isSavedByUser
        ? contract.savedContractName
        : null;

  // Only show the Activate CTA when we have real activation data AND a handler
  // to run it. Without a handler the button would be dead.
  const canActivate =
    !!onActivate &&
    !!activation &&
    (activation.status === 'expiring' || activation.status === 'inactive');

  const showAdd =
    viewType === 'explore-contracts' &&
    isAuthenticated &&
    !!onAddContract &&
    !contract.isSavedByUser;

  const isSelectable = Boolean(onContractSelect);
  const handleSelect = () => onContractSelect?.(contract.id, contract);

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
      {/* Leading column: identity + metrics */}
      <div className='min-w-0 flex-1'>
        {displayName ? (
          <>
            <div className='text-[13px] font-medium text-ink-1 truncate'>
              {displayName}
            </div>
            <div className='mono-addr truncate mt-0.5'>
              {truncateAddress(contract.address)}
            </div>
          </>
        ) : (
          <div className='mono-addr !text-ink-2 text-[12px] truncate'>
            {truncateAddress(contract.address)}
          </div>
        )}

        <div className='flex items-center gap-2.5 mt-1.5 text-[11px] text-ink-2 num flex-wrap'>
          <span>
            bid{' '}
            <span className='text-ink-1 font-medium'>
              {contract.lastBid
                ? `${formatRoundedEth(
                    formatEther(BigInt(contract.lastBid))
                  )} ETH`
                : '—'}
            </span>
          </span>
          <span>
            eff{' '}
            <span className='text-ink-1 font-medium'>
              {contract.effectiveBid
                ? formatRoundedEth(formatEther(BigInt(contract.effectiveBid)))
                : '—'}
            </span>
          </span>
          <span className='text-ink-1 font-medium'>
            {formatSize(contract.bytecode.size)}
          </span>
        </div>

        {(canActivate && viewType === 'my-contracts') || showAdd ? (
          <div
            className='flex gap-2 mt-2'
            onClick={(e) => e.stopPropagation()}
          >
            {viewType === 'my-contracts' && canActivate && (
              <Button
                size='sm'
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate?.(contract);
                }}
                className='h-7 gap-1.5'
              >
                <Zap className='h-3 w-3' />
                Activate
              </Button>
            )}
            {showAdd && (
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation();
                  onAddContract?.(contract);
                }}
                className='h-7'
              >
                + Add
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {/* Trailing column: state, one shared edge */}
      <div className='flex max-w-[48%] shrink-0 flex-col items-end gap-1.5'>
        <ContractStateIndicator
          label={contract.bytecode.isCached ? 'Cached' : 'Not cached'}
          dotClassName={contract.bytecode.isCached ? 'bg-ok' : 'bg-ink-3'}
          labelClassName={
            contract.bytecode.isCached ? 'text-ok-text' : 'text-ink-2'
          }
          compact
          align='end'
        />
        {activation && (
          <ContractStateIndicator
            label={activationStatusLabel(activation)}
            description={activationSubLabel(activation)}
            dotClassName={activationDotClass(activation.status)}
            labelClassName={activationTextClass(activation.status)}
            compact
            align='end'
            descriptionClassName='whitespace-normal break-words'
          />
        )}
        {viewType === 'explore-contracts' && contract.isSavedByUser && (
          <span className='text-[10.5px] text-ink-3'>Added</span>
        )}
      </div>
    </div>
  );
}
