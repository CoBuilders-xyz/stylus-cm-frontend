import React from 'react';
import { formatEther } from 'viem';
import { Contract } from '@/services/contractService';
import {
  formatSize,
  formatRiskLevel,
  formatRoundedEth,
} from '@/utils/formatting';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

// Styling-only mapping: eviction-risk level -> status pill class.
const riskPillClass = (risk?: string | null): string => {
  switch (risk?.toLowerCase()) {
    case 'high':
      return 'pill pill-crit';
    case 'medium':
      return 'pill pill-warn';
    case 'low':
      return 'pill pill-ok';
    default:
      return 'pill pill-muted';
  }
};

interface ContractInfoProps {
  contractData: Contract;
  isLoading?: boolean;
  viewType?: 'explore-contracts' | 'my-contracts';
}

export function ContractInfo({
  contractData,
  isLoading = false,
  viewType = 'my-contracts',
}: ContractInfoProps) {
  if (isLoading) {
    return (
      <div className='mb-6'>
        <Table>
          <TableBody>
            {Array(viewType === 'my-contracts' ? 4 : 3)
              .fill(0)
              .map((_, index) => (
                <TableRow key={index} className='hover:bg-transparent border-hairline'>
                  <TableCell className='p-2 w-1/3'>
                    <div className='h-4 bg-surface-3 rounded w-24'></div>
                  </TableCell>
                  <TableCell className='p-2 w-2/3'>
                    <div className='h-4 bg-surface-3 rounded w-24 ms-auto'></div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Define rows to display
  const rows = [
    {
      label: 'Eviction Risk',
      content: (
        <>
          {contractData.evictionRisk ? (
            <span
              className={riskPillClass(contractData.evictionRisk.riskLevel)}
            >
              <i className='pill-dot' aria-hidden />
              {formatRiskLevel(contractData.evictionRisk.riskLevel)}
            </span>
          ) : (
            <span className='pill pill-muted'>N/A</span>
          )}
        </>
      ),
    },
    {
      label: 'Total Spent',
      content: (
        <span className='font-medium text-ink-1 num'>
          {formatRoundedEth(
            formatEther(BigInt(contractData.totalBidInvestment))
          ) + ' ETH'}
        </span>
      ),
    },
    {
      label: 'Size',
      content: (
        <span className='font-medium text-ink-1 num'>
          {formatSize(contractData.bytecode.size)}
        </span>
      ),
    },
  ];

  return (
    <div className='mb-6'>
      <Table>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index} className='hover:bg-transparent border-hairline'>
              <TableCell className='py-2.5 px-0 text-[13px] text-ink-3 w-1/3'>
                {row.label}
              </TableCell>
              <TableCell className='py-2.5 px-0 text-end text-[13px] w-2/3'>
                {row.content}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ContractInfo;
