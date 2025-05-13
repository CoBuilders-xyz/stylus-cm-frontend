import React from 'react';
import { Contract, Alert } from '@/services/contractService';
import { formatEther } from 'viem';
import {
  formatSize,
  formatRiskLevel,
  getRiskBadgeVariant,
  formatRoundedEth,
} from '@/utils/formatting';
import { PlusCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface ContractInfoProps {
  contractData: Contract;
  onManageAlerts: () => void;
  isLoading?: boolean;
  viewType?: 'explore-contracts' | 'my-contracts';
}

export function ContractInfo({
  contractData,
  onManageAlerts,
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
                <TableRow key={index} className='hover:bg-transparent'>
                  <TableCell className='p-2 w-1/3'>
                    <div className='h-4 bg-gray-700 rounded w-24'></div>
                  </TableCell>
                  <TableCell className='p-2 w-2/3'>
                    <div className='h-4 bg-gray-700 rounded w-24'></div>
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
            <Badge
              variant={getRiskBadgeVariant(contractData.evictionRisk.riskLevel)}
              className='px-3 py-1 text-sm font-semibold w-fit'
            >
              {formatRiskLevel(contractData.evictionRisk.riskLevel)}
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='px-3 py-1 text-sm font-semibold w-fit'
            >
              N/A
            </Badge>
          )}
        </>
      ),
    },
    {
      label: 'Total Spent',
      content: (
        <span className='font-medium'>
          {formatRoundedEth(
            formatEther(BigInt(contractData.totalBidInvestment))
          ) + ' ETH'}
        </span>
      ),
    },
    {
      label: 'Size',
      content: (
        <span className='font-medium'>
          {formatSize(contractData.bytecode.size)}
        </span>
      ),
    },
  ];

  // Add alerts row only for my-contracts view
  if (viewType === 'my-contracts') {
    rows.push({
      label: 'Active Alerts',
      content: (
        <div className='flex items-center gap-2 flex-wrap'>
          {!contractData.alerts ||
          !contractData.alerts.some((alert) => alert.isActive) ? (
            <Button
              onClick={onManageAlerts}
              className='px-3 py-1 border border-dashed border-gray-600 text-gray-400 bg-transparent hover:bg-gray-800 rounded-md text-xs flex items-center gap-1'
            >
              <PlusCircle className='h-3 w-3' />
              Add alerts
            </Button>
          ) : (
            <>
              {contractData.alerts
                .filter((alert) => alert.isActive)
                .map((alert) => {
                  // Helper to format alert display text
                  const getAlertText = (alert: Alert) => {
                    switch (alert.type) {
                      case 'eviction':
                        return 'Eviction';
                      case 'noGas':
                        return 'No gas';
                      case 'lowGas':
                        return `Low gas: ${alert.value} ETH`;
                      case 'bidSafety':
                        return `Bid Safety: ${alert.value}%`;
                      default:
                        return alert.type;
                    }
                  };

                  return (
                    <div
                      key={alert.id}
                      className='px-3 py-2 text-white text-xs rounded-md inline-block bg-[#1A1A1A] border border-[#333]'
                    >
                      {getAlertText(alert)}
                    </div>
                  );
                })}
              <Button
                className='p-1 rounded-md bg-transparent border border-gray-700 hover:bg-gray-900'
                onClick={onManageAlerts}
              >
                <Edit className='h-4 w-4' />
              </Button>
            </>
          )}
        </div>
      ),
    });
  }

  return (
    <div className='mb-6'>
      <Table>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index} className='hover:bg-transparent'>
              <TableCell className='font-medium text-gray-400 w-1/3'>
                {row.label}
              </TableCell>
              <TableCell className='text-left w-2/3'>{row.content}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ContractInfo;
