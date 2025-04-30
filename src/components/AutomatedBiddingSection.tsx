import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface AutomatedBiddingSectionProps {
  automatedBidding: boolean;
  setAutomatedBidding: (value: boolean) => void;
}

export function AutomatedBiddingSection({
  automatedBidding,
  setAutomatedBidding,
}: AutomatedBiddingSectionProps) {
  return (
    <div
      className='relative rounded-md p-4 overflow-hidden'
      style={{
        background: 'linear-gradient(89.49deg, #3E71C6 0%, #5897B2 103.8%)',
      }}
    >
      {/* White noise texture overlay */}
      <div
        className='absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='white'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div className='flex justify-between items-center relative z-10'>
        <div>
          <p className='font-bold'>Enable Automated Bidding</p>
          <p className='text-sm text-blue-200'>
            Set a maximum bid value to maintain your position in the cache
            without manual intervention
          </p>
        </div>
        <SwitchPrimitive.Root
          checked={automatedBidding}
          onCheckedChange={setAutomatedBidding}
          className={cn(
            'inline-flex h-[26px] w-[48px] shrink-0 items-center rounded-full border-transparent transition-all outline-none',
            'data-[state=unchecked]:border data-[state=unchecked]:border-[#73777A] data-[state=unchecked]:bg-[#2C2E30]',
            'data-[state=checked]:border-0 data-[state=checked]:bg-[#335CD7]'
          )}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block h-[20px] w-[20px] rounded-full bg-white shadow-lg ring-0 transition-transform',
              'data-[state=checked]:translate-x-[24px] data-[state=unchecked]:translate-x-0.5'
            )}
          />
        </SwitchPrimitive.Root>
      </div>
    </div>
  );
}

export default AutomatedBiddingSection;
