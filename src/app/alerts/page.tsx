'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Bell, Cpu, Database, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  mockAlertSubscriptions,
  PROTOTYPE_ALERT_PREFERENCES_TOAST,
  type MockAlertChannelConfig,
  type MockAlertSubscriptions,
} from '@/lib/prototype-mocks';

type CategoryKey = 'activation' | 'cache' | 'system';

const CATEGORIES: {
  key: CategoryKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'activation',
    label: 'Activation',
    description: 'Program activation lifecycle.',
    icon: ShieldAlert,
  },
  {
    key: 'cache',
    label: 'Cache',
    description: 'Cache placement and eviction events.',
    icon: Database,
  },
  {
    key: 'system',
    label: 'System',
    description: 'Platform-wide events.',
    icon: Cpu,
  },
];

const channelKeys = ['telegram', 'slack', 'webhook'] as const;
type ChannelKey = (typeof channelKeys)[number];
const channelLabels: Record<ChannelKey, string> = {
  telegram: 'Telegram',
  slack: 'Slack',
  webhook: 'Webhook',
};

function ToggleSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full border-transparent transition-all outline-none',
        'data-[state=unchecked]:border data-[state=unchecked]:border-[#73777A] data-[state=unchecked]:bg-[#2C2E30]',
        'data-[state=checked]:border-0 data-[state=checked]:bg-[#335CD7]'
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block h-[16px] w-[16px] rounded-full bg-white shadow-lg ring-0 transition-transform',
          'data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

function ChannelToggles({
  channels,
  onChange,
}: {
  channels: MockAlertChannelConfig;
  onChange: (next: MockAlertChannelConfig) => void;
}) {
  return (
    <div className='flex flex-wrap items-center gap-4'>
      {channelKeys.map((c) => (
        <label key={c} className='flex items-center gap-2 text-xs'>
          <ToggleSwitch
            checked={channels[c]}
            onCheckedChange={(v) => onChange({ ...channels, [c]: v })}
          />
          <span className='text-gray-300'>{channelLabels[c]}</span>
        </label>
      ))}
    </div>
  );
}

export default function AlertsPage() {
  const [subscriptions, setSubscriptions] = useState<MockAlertSubscriptions>(
    () => structuredClone(mockAlertSubscriptions)
  );
  const [active, setActive] = useState<CategoryKey>('activation');

  const updateActivation = <
    K extends keyof MockAlertSubscriptions['activation']
  >(
    key: K,
    patch: Partial<MockAlertSubscriptions['activation'][K]>
  ) => {
    setSubscriptions((prev) => ({
      ...prev,
      activation: {
        ...prev.activation,
        [key]: { ...prev.activation[key], ...patch },
      },
    }));
  };

  const updateCache = <K extends keyof MockAlertSubscriptions['cache']>(
    key: K,
    patch: Partial<MockAlertSubscriptions['cache'][K]>
  ) => {
    setSubscriptions((prev) => ({
      ...prev,
      cache: {
        ...prev.cache,
        [key]: { ...prev.cache[key], ...patch },
      },
    }));
  };

  const updateSystem = <K extends keyof MockAlertSubscriptions['system']>(
    key: K,
    patch: Partial<MockAlertSubscriptions['system'][K]>
  ) => {
    setSubscriptions((prev) => ({
      ...prev,
      system: {
        ...prev.system,
        [key]: { ...prev.system[key], ...patch },
      },
    }));
  };

  const handleSave = () => {
    toast.success(PROTOTYPE_ALERT_PREFERENCES_TOAST);
  };

  const activeMeta = useMemo(
    () => CATEGORIES.find((c) => c.key === active)!,
    [active]
  );

  return (
    <div
      className='px-4 sm:px-10 pb-16 text-white'
      style={{
        minHeight: 'calc(100dvh - var(--app-chrome-h, 96px))',
        paddingTop: 'calc(var(--app-chrome-h, 96px) + 1.5rem)',
      }}
    >
      <div className='max-w-6xl mx-auto'>
        <div className='mb-6 flex items-center gap-3'>
          <Bell className='h-5 w-5' />
          <h1 className='text-2xl font-bold'>Alert Preferences</h1>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6'>
          <aside className='border border-[#2C2E30] rounded-lg bg-black p-2 h-fit'>
            <nav className='space-y-1'>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = active === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActive(cat.key)}
                    className={cn(
                      'w-full text-left rounded-md px-3 py-2 flex items-start gap-3 transition-colors',
                      isActive ? 'bg-[#2C2E30]' : 'hover:bg-[#1A1A1A]'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 mt-0.5',
                        isActive ? 'text-white' : 'text-gray-400'
                      )}
                    />
                    <div>
                      <div
                        className={cn(
                          'text-sm font-medium',
                          isActive ? 'text-white' : 'text-gray-300'
                        )}
                      >
                        {cat.label}
                      </div>
                      <div className='text-[11px] text-gray-500'>
                        {cat.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className='border border-[#2C2E30] rounded-lg bg-black p-6 space-y-6'>
            <div>
              <h2 className='text-lg font-semibold'>{activeMeta.label}</h2>
              <p className='text-xs text-gray-400'>{activeMeta.description}</p>
            </div>

            {active === 'activation' && (
              <div className='space-y-6'>
                <AlertRow
                  title='Approaching expiration'
                  description='Get notified before your program expires.'
                  enabled={subscriptions.activation.approachingExpiration.enabled}
                  onToggleEnabled={(v) =>
                    updateActivation('approachingExpiration', { enabled: v })
                  }
                  channels={
                    subscriptions.activation.approachingExpiration.channels
                  }
                  onChannelsChange={(c) =>
                    updateActivation('approachingExpiration', { channels: c })
                  }
                  extra={
                    <div className='flex items-center gap-2'>
                      <label className='text-xs text-gray-400'>
                        Threshold (days)
                      </label>
                      <Input
                        type='number'
                        min={1}
                        max={30}
                        value={
                          subscriptions.activation.approachingExpiration
                            .thresholdDays
                        }
                        onChange={(e) =>
                          updateActivation('approachingExpiration', {
                            thresholdDays: Number(e.target.value) || 7,
                          })
                        }
                        className='w-20 bg-[#1A1919] border-gray-700 text-white'
                      />
                    </div>
                  }
                />
                <AlertRow
                  title='Expired'
                  description='Notify when a program has expired.'
                  enabled={subscriptions.activation.expired.enabled}
                  onToggleEnabled={(v) =>
                    updateActivation('expired', { enabled: v })
                  }
                  channels={subscriptions.activation.expired.channels}
                  onChannelsChange={(c) =>
                    updateActivation('expired', { channels: c })
                  }
                />
                <AlertRow
                  title='Auto-activation succeeded'
                  description='Confirmation when automatic activation succeeds.'
                  enabled={
                    subscriptions.activation.autoActivationSucceeded.enabled
                  }
                  onToggleEnabled={(v) =>
                    updateActivation('autoActivationSucceeded', { enabled: v })
                  }
                  channels={
                    subscriptions.activation.autoActivationSucceeded.channels
                  }
                  onChannelsChange={(c) =>
                    updateActivation('autoActivationSucceeded', { channels: c })
                  }
                />
                <AlertRow
                  title='Auto-activation failed'
                  description='Alert when an automatic activation reverts.'
                  enabled={
                    subscriptions.activation.autoActivationFailed.enabled
                  }
                  onToggleEnabled={(v) =>
                    updateActivation('autoActivationFailed', { enabled: v })
                  }
                  channels={
                    subscriptions.activation.autoActivationFailed.channels
                  }
                  onChannelsChange={(c) =>
                    updateActivation('autoActivationFailed', { channels: c })
                  }
                />
              </div>
            )}

            {active === 'cache' && (
              <div className='space-y-6'>
                <AlertRow
                  title='Eviction'
                  description='Notify when one of your contracts is evicted.'
                  enabled={subscriptions.cache.eviction.enabled}
                  onToggleEnabled={(v) =>
                    updateCache('eviction', { enabled: v })
                  }
                  channels={subscriptions.cache.eviction.channels}
                  onChannelsChange={(c) =>
                    updateCache('eviction', { channels: c })
                  }
                />
                <AlertRow
                  title='Low gas'
                  description='Notify when escrow balance falls below the threshold.'
                  enabled={subscriptions.cache.lowGas.enabled}
                  onToggleEnabled={(v) =>
                    updateCache('lowGas', { enabled: v })
                  }
                  channels={subscriptions.cache.lowGas.channels}
                  onChannelsChange={(c) =>
                    updateCache('lowGas', { channels: c })
                  }
                  extra={
                    <div className='flex items-center gap-2'>
                      <label className='text-xs text-gray-400'>
                        Threshold (ETH)
                      </label>
                      <Input
                        type='number'
                        step='0.001'
                        min={0}
                        value={subscriptions.cache.lowGas.thresholdEth}
                        onChange={(e) =>
                          updateCache('lowGas', {
                            thresholdEth: Number(e.target.value) || 0,
                          })
                        }
                        className='w-24 bg-[#1A1919] border-gray-700 text-white'
                      />
                    </div>
                  }
                />
              </div>
            )}

            {active === 'system' && (
              <div className='space-y-6'>
                <AlertRow
                  title='Maintenance windows'
                  description='Receive a heads-up before scheduled platform work.'
                  enabled={subscriptions.system.maintenance.enabled}
                  onToggleEnabled={(v) =>
                    updateSystem('maintenance', { enabled: v })
                  }
                  channels={subscriptions.system.maintenance.channels}
                  onChannelsChange={(c) =>
                    updateSystem('maintenance', { channels: c })
                  }
                />
              </div>
            )}

            <div className='pt-4 border-t border-[#2C2E30] flex justify-end'>
              <Button
                onClick={handleSave}
                className='bg-[#335CD7] hover:bg-[#2a4cb8] text-white'
              >
                Save
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

interface AlertRowProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggleEnabled: (v: boolean) => void;
  channels: MockAlertChannelConfig;
  onChannelsChange: (next: MockAlertChannelConfig) => void;
  extra?: React.ReactNode;
}

function AlertRow({
  title,
  description,
  enabled,
  onToggleEnabled,
  channels,
  onChannelsChange,
  extra,
}: AlertRowProps) {
  return (
    <div className='rounded-md border border-[#2C2E30] p-4'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h4 className='text-sm font-medium'>{title}</h4>
          <p className='text-xs text-gray-400 mt-0.5'>{description}</p>
        </div>
        <ToggleSwitch checked={enabled} onCheckedChange={onToggleEnabled} />
      </div>
      <div
        className={cn(
          'mt-4 space-y-3',
          !enabled && 'opacity-50 pointer-events-none'
        )}
      >
        {extra}
        <ChannelToggles channels={channels} onChange={onChannelsChange} />
      </div>
    </div>
  );
}
