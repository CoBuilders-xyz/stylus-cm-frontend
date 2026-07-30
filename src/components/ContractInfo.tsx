import React from 'react';
import { formatEther } from 'viem';
import { Contract } from '@/services/contractService';
import type { Alert as ContractAlert } from '@/services/contractService';
import { AlertType } from '@/types/alerts';
import {
  formatSize,
  formatRiskLevel,
  formatRoundedEth,
} from '@/utils/formatting';
import { PlusCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  // Add alerts row only for my-contracts view
  if (viewType === 'my-contracts') {
    rows.push({
      label: 'Active Alerts',
      content: (
        <div className='flex items-center justify-end gap-2 flex-wrap'>
          {!contractData.alerts ||
          !contractData.alerts.some((alert) => alert.isActive) ? (
            <Button
              variant='outline'
              size='sm'
              onClick={onManageAlerts}
              className='border-dashed text-ink-3 hover:text-ink-1 gap-1'
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
                      case AlertType.APPROACHING_EXPIRATION:
                        return `Approaching Expiration: ${alert.value} days`;
                      case AlertType.EXPIRED:
                        return 'Expired';
                      case AlertType.REACTIVATION_SUCCEEDED:
                        return 'Reactivation Succeeded';
                      case AlertType.REACTIVATION_FAILED:
                        return 'Reactivation Failed';
                      default:
                        return alert.type;
                    }
                  };

                  return (
                    <span
                      key={alert.id}
                      className={`pill ${
                        alert.type === AlertType.REACTIVATION_FAILED
                          ? 'pill-crit'
                          : 'pill-muted'
                      }`}
                    >
                      {alert.type === AlertType.REACTIVATION_FAILED && (
                        <i className='pill-dot' aria-hidden />
                      )}
                      {getAlertText(alert)}
                    </span>
                  );
                })}
              <Button
                variant='outline'
                size='icon'
                className='size-7'
                onClick={onManageAlerts}
              >
                <Edit className='h-3.5 w-3.5' />
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
