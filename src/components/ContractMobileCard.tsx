'use client';

import React from 'react';
import { formatEther } from 'viem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatRoundedEth,
  formatSize,
  formatRiskLevel,
  getRiskBadgeVariant,
} from '@/utils/formatting';
import { Zap, ChevronRight } from 'lucide-react';
import ActivationBadge from '@/components/ActivationBadge';
import { ActivationInfo } from '@/lib/activation';
import { Contract } from '@/services/contractService';

interface Props {
  contract: Contract;
  viewType: 'my-contracts' | 'explore-contracts';
  /**
   * Optional — until activation data is wired (COB-493/496) the card hides
   * the activation badge and the Activate CTA rather than rendering a dead
   * placeholder action.
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
      role='button'
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className='w-full text-left rounded-lg border border-[#2C2E30] bg-[#0F0F0F] hover:bg-[#161616] transition-colors p-4 flex flex-col gap-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#335CD7]'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          {displayName ? (
            <>
              <div className='text-base font-medium text-white truncate'>
                {displayName}
              </div>
              <div className='text-xs font-mono text-gray-500 truncate'>
                {truncateAddress(contract.address)}
              </div>
            </>
          ) : (
            <div className='text-sm font-mono text-white truncate'>
              {truncateAddress(contract.address)}
            </div>
          )}
        </div>
        <ChevronRight className='h-4 w-4 text-gray-500 shrink-0' />
      </div>

      <div className='flex items-center gap-2 flex-wrap'>
        {activation && <ActivationBadge info={activation} compact />}
        <Badge
          variant={contract.bytecode.isCached ? 'secondary' : 'outline'}
          className='px-2 py-0.5 text-[11px] font-medium'
        >
          {contract.bytecode.isCached ? 'Cached' : 'Not Cached'}
        </Badge>
        {contract.evictionRisk && (
          <Badge
            variant={getRiskBadgeVariant(contract.evictionRisk.riskLevel)}
            className='px-2 py-0.5 text-[11px] font-medium'
          >
            {formatRiskLevel(contract.evictionRisk.riskLevel)} risk
          </Badge>
        )}
      </div>

      <div className='grid grid-cols-3 gap-2 text-xs pt-1'>
        <div>
          <div className='text-[10px] uppercase tracking-wider text-gray-500'>
            Bid
          </div>
          <div className='text-white tabular-nums'>
            {contract.lastBid
              ? `${formatRoundedEth(formatEther(BigInt(contract.lastBid)))} ETH`
              : '—'}
          </div>
        </div>
        <div>
          <div className='text-[10px] uppercase tracking-wider text-gray-500'>
            Effective
          </div>
          <div className='text-white tabular-nums'>
            {contract.effectiveBid
              ? `${formatRoundedEth(
                  formatEther(BigInt(contract.effectiveBid))
                )} ETH`
              : '—'}
          </div>
        </div>
        <div>
          <div className='text-[10px] uppercase tracking-wider text-gray-500'>
            Size
          </div>
          <div className='text-white tabular-nums'>
            {formatSize(contract.bytecode.size)}
          </div>
        </div>
      </div>

      {(viewType === 'my-contracts' && canActivate) ||
      (viewType === 'explore-contracts' &&
        isAuthenticated &&
        !contract.isSavedByUser) ? (
        <div
          className='flex gap-2 pt-1'
          onClick={(e) => e.stopPropagation()}
        >
          {viewType === 'my-contracts' && canActivate && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onActivate?.(contract);
              }}
              className='flex-1 h-9 text-xs bg-[#335CD7] hover:bg-[#2a4cb8] text-white inline-flex items-center justify-center gap-1.5'
            >
              <Zap className='h-3.5 w-3.5' />
              Activate
            </Button>
          )}
          {viewType === 'explore-contracts' &&
            isAuthenticated &&
            !contract.isSavedByUser && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddContract?.(contract);
                }}
                className='flex-1 h-9 text-xs bg-black border border-white text-white inline-flex items-center justify-center gap-1.5'
              >
                + Add to my contracts
              </Button>
            )}
        </div>
      ) : viewType === 'explore-contracts' && contract.isSavedByUser ? (
        <Badge
          variant='secondary'
          className='self-start px-2 py-0.5 text-[11px] font-medium'
        >
          Added
        </Badge>
      ) : null}
    </div>
  );
}
