import React from 'react';
import { Button } from '@/components/ui/button';

interface BidNowSectionProps {
  minBidAmount: string;
  bidAmount: string;
  setBidAmount: (value: string) => void;
  onSubmitBid: () => void;
}

export function BidNowSection({
  minBidAmount,
  bidAmount,
  setBidAmount,
  onSubmitBid,
}: BidNowSectionProps) {
  return (
    <div
      className='relative rounded-md p-4 overflow-hidden'
      style={{
        background:
          'linear-gradient(89.49deg, #3E71C6 0%, #5897B2 55.53%, #C35B88 103.8%)',
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

      <div className='flex justify-between items-start relative z-10'>
        <div>
          <p className='font-bold'>Bid now</p>
          <p className='text-sm text-blue-200'>
            Higher bids extend cache duration
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='relative rounded-md overflow-hidden'>
            <input
              type='text'
              placeholder={`From ${minBidAmount}`}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className='px-3 py-2 bg-white border-none outline-none text-[#B1B1B1] w-50'
            />
          </div>
          <Button
            className='px-4 py-2 rounded-md bg-transparent border border-white'
            onClick={onSubmitBid}
          >
            Place bid
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BidNowSection;
