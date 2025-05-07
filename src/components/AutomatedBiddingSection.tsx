import React, { useState, useEffect } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AutomatedBiddingSectionProps {
  automatedBidding: boolean;
  setAutomatedBidding: (value: boolean) => void;
  maxBidAmount?: string;
  setMaxBidAmount?: (value: string) => void;
}

export function AutomatedBiddingSection({
  automatedBidding,
  setAutomatedBidding,
  maxBidAmount = '',
  setMaxBidAmount = () => {},
}: AutomatedBiddingSectionProps) {
  // Local state for input value to ensure it updates immediately
  const [inputValue, setInputValue] = useState(maxBidAmount);
  const [inputError, setInputError] = useState<string | null>(null);

  // Sync local state with prop value when it changes
  useEffect(() => {
    setInputValue(maxBidAmount);
  }, [maxBidAmount]);

  // Validate bid amount input - only validate format, don't set error for empty values
  const validateInput = (value: string) => {
    if (!value) {
      return false;
    }

    // Check if the input is a valid number
    const isValidNumber = /^[0-9]*\.?[0-9]*$/.test(value);
    if (!isValidNumber) {
      setInputError('Enter a valid amount to Bid');
      return false;
    }

    if (parseFloat(value) < 0) {
      setInputError('Bid amount cannot be negative');
      return false;
    }

    setInputError(null);
    return true;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Update local state immediately to show typing in real-time
    setInputValue(value);

    // Clear the error if input is emptied
    if (!value) {
      setInputError(null);
    } else {
      // Only validate the format for non-empty values
      validateInput(value);
    }

    setMaxBidAmount(value);
  };

  // Handle set bid button click
  const handleSetBid = () => {
    // When button is clicked, check for empty values and show error if needed
    if (!inputValue) {
      setInputError('Enter a valid Bid Amount');
      return;
    }

    if (validateInput(inputValue)) {
      // You could add additional logic here if needed
      console.log('Maximum bid set to:', inputValue);
    }
  };

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

      <div className='flex justify-between items-start relative z-10'>
        <div>
          <p className='font-bold'>Enable Automated Bidding</p>
          <p className='text-sm text-blue-200'>
            Set a maximum bid value to maintain your position in the cache
            without manual intervention.
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

      {/* Maximum Bid Amount input - shown only when automated bidding is enabled */}
      {automatedBidding && (
        <div className='mt-4 relative z-10'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='font-bold'>Maximum Bid Amount</p>
            </div>
            <div>
              <div className='flex gap-2'>
                <div className='relative'>
                  <Input
                    type='text'
                    placeholder='Enter maximum bid amount'
                    value={inputValue}
                    onChange={handleInputChange}
                    className={`pr-12 bg-white border-none text-gray-500 ${
                      inputError ? 'border-red-500' : ''
                    }`}
                    style={{ width: '350px' }}
                  />
                  <div className='absolute right-3 top-0 bottom-0 flex items-center pointer-events-none text-gray-500'>
                    ETH
                  </div>
                </div>
                <Button
                  onClick={handleSetBid}
                  className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center'
                  disabled={false} // Button should always be clickable
                >
                  Set Bid
                </Button>
              </div>
              {inputError && (
                <div
                  className='text-white text-xs italic text-left mt-1'
                  style={{ width: '350px' }}
                >
                  {inputError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomatedBiddingSection;
