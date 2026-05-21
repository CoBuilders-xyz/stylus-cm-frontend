import React from 'react';
import { formatEther } from 'viem';
import { Contract } from '@/services/contractService';
import type { Alert as ContractAlert } from '@/services/contractService';
import { AlertType } from '@/types/alerts';
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
import { useIsMobile } from '@/hooks/useIsMobile';

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
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className='mb-6'>
        <div className='space-y-3'>
          {Array(viewType === 'my-contracts' ? 4 : 3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className='animate-pulse bg-gray-800 rounded p-3'>
                <div className='h-4 bg-gray-700 rounded w-1/4 mb-2'></div>
                <div className='h-4 bg-gray-700 rounded w-1/2'></div>
              </div>
            ))}
        </div>
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
                  const getAlertText = (alert: ContractAlert) => {
                    switch (alert.type) {
                      case AlertType.EVICTION:
                        return 'Eviction';
                      case AlertType.NO_GAS:
                        return 'No gas';
                      case AlertType.LOW_GAS:
                        return `Low gas: ${alert.value} ETH`;
                      case AlertType.BID_SAFETY:
                        return `Bid Safety: ${alert.value}%`;
                      default:
                        return alert.type;
                    }
                  };

                  return (
                    <div
                      key={alert.id}
                      className='px-2 sm:px-3 py-1 sm:py-2 text-white text-xs rounded-md inline-block bg-[#1A1A1A] border border-[#333]'
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

  // Mobile layout - stack items vertically
  if (isMobile) {
    return (
      <div className='mb-6 space-y-3'>
        {rows.map((row, index) => (
          <div key={index} className='bg-gray-900/30 rounded-lg p-3'>
            <span className='text-gray-400 text-sm block mb-1'>{row.label}</span>
            <div>{row.content}</div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop layout - table
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
