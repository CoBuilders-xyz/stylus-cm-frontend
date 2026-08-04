'use client';

import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Alert } from '@/services/contractService';
import { AlertType } from '@/types/alerts';

export type AlertCategory = 'cache' | 'activation';

const ACTIVATION_ALERT_TYPES = new Set<AlertType>([
  AlertType.APPROACHING_EXPIRATION,
  AlertType.EXPIRED,
  AlertType.REACTIVATION_SUCCEEDED,
  AlertType.REACTIVATION_FAILED,
]);

export const alertCategory = (alert: Alert): AlertCategory =>
  ACTIVATION_ALERT_TYPES.has(alert.type) ? 'activation' : 'cache';

export const alertLabel = (alert: Alert): string => {
  switch (alert.type) {
    case AlertType.EVICTION:
      return 'Eviction';
    case AlertType.NO_GAS:
      return 'No gas';
    case AlertType.LOW_GAS:
      return `Low gas · ${alert.value} ETH`;
    case AlertType.BID_SAFETY:
      return `Bid safety · ${alert.value}%`;
    case AlertType.APPROACHING_EXPIRATION:
      return `Expiration · ${alert.value} days`;
    case AlertType.EXPIRED:
      return 'Expired';
    case AlertType.REACTIVATION_SUCCEEDED:
      return 'Reactivation succeeded';
    case AlertType.REACTIVATION_FAILED:
      return 'Reactivation failed';
    default:
      return alert.type;
  }
};

const activeAlertsFor = (alerts: Alert[] | undefined, category: AlertCategory) =>
  (alerts ?? []).filter(
    (alert) => alert.isActive && alertCategory(alert) === category
  );

function AlertGroup({
  category,
  alerts,
  showHeader = true,
  boxed = false,
}: {
  category: AlertCategory;
  alerts: Alert[] | undefined;
  showHeader?: boolean;
  boxed?: boolean;
}) {
  const activeAlerts = activeAlertsFor(alerts, category);
  const title = category === 'cache' ? 'Cache alerts' : 'Activation alerts';

  return (
    <div
      className={`min-w-0 ${
        boxed
          ? 'rounded-[10px] border border-hairline bg-surface-1 p-4'
          : ''
      }`}
    >
      {showHeader ? (
        <div className='flex items-center justify-between gap-3 mb-2'>
          <h4 className='tile-label'>{title}</h4>
          <span className='text-[11px] text-ink-3 num'>
            {activeAlerts.length} active
          </span>
        </div>
      ) : null}
      {activeAlerts.length > 0 ? (
        <div className='flex flex-wrap gap-1.5'>
          {activeAlerts.map((alert) => (
            <span key={alert.id} className='pill pill-muted'>
              {alertLabel(alert)}
            </span>
          ))}
        </div>
      ) : (
        <p className='text-[12px] text-ink-3'>No alerts enabled</p>
      )}
    </div>
  );
}

export function ContractAlertsOverview({
  alerts,
  onManageAlerts,
}: {
  alerts: Alert[] | undefined;
  onManageAlerts: () => void;
}) {
  return (
    <section className='mb-6' aria-labelledby='contract-alerts-title'>
      <div className='flex items-center justify-between gap-3 mb-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <BellRing className='h-4 w-4 text-ink-2 shrink-0' aria-hidden />
          <h3 id='contract-alerts-title' className='card-title'>
            Alerts
          </h3>
        </div>
        <Button variant='outline' size='sm' onClick={onManageAlerts}>
          Manage alerts
        </Button>
      </div>
      <div className='grid gap-3 @md/panel:grid-cols-2'>
        <AlertGroup category='cache' alerts={alerts} boxed />
        <AlertGroup category='activation' alerts={alerts} boxed />
      </div>
    </section>
  );
}
