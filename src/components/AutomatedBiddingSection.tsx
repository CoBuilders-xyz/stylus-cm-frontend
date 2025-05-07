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
  automationFunding?: string;
  setAutomationFunding?: (value: string) => void;
}

export function AutomatedBiddingSection({
  automatedBidding,
  setAutomatedBidding,
  maxBidAmount = '',
  setMaxBidAmount = () => {},
  automationFunding = '',
  setAutomationFunding = () => {},
}: AutomatedBiddingSectionProps) {
  // Local state for input values to ensure they update immediately
  const [inputValue, setInputValue] = useState(maxBidAmount);
  const [fundingValue, setFundingValue] = useState(automationFunding);
  const [inputError, setInputError] = useState<string | null>(null);
  const [fundingError, setFundingError] = useState<string | null>(null);

  // Sync local state with prop values when they change
  useEffect(() => {
    setInputValue(maxBidAmount);
  }, [maxBidAmount]);

  useEffect(() => {
    setFundingValue(automationFunding);
  }, [automationFunding]);

  // Validate numeric input - only validate format, don't set error for empty values
  const validateNumericInput = (
    value: string,
    setError: (error: string | null) => void
  ) => {
    if (!value) {
      return false;
    }

    // Check if the input is a valid number
    const isValidNumber = /^[0-9]*\.?[0-9]*$/.test(value);
    if (!isValidNumber) {
      setError('Enter a valid amount');
      return false;
    }

    if (parseFloat(value) < 0) {
      setError('Amount cannot be negative');
      return false;
    }

    setError(null);
    return true;
  };

  // Handle max bid amount input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Update local state immediately to show typing in real-time
    setInputValue(value);

    // Clear the error if input is emptied
    if (!value) {
      setInputError(null);
    } else {
      // Only validate the format for non-empty values
      validateNumericInput(value, setInputError);
    }

    setMaxBidAmount(value);
  };

  // Handle automation funding input change
  const handleFundingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Update local state immediately to show typing in real-time
    setFundingValue(value);

    // Clear the error if input is emptied
    if (!value) {
      setFundingError(null);
    } else {
      // Only validate the format for non-empty values
      validateNumericInput(value, setFundingError);
    }

    setAutomationFunding(value);
  };

  // Handle set bid button click
  const handleSetBid = () => {
    let hasError = false;

    // When button is clicked, check for empty values and show error if needed
    if (!inputValue) {
      setInputError('Enter a valid Bid Amount');
      hasError = true;
    }

    if (!fundingValue) {
      setFundingError('Enter a valid Amount');
      hasError = true;
    }

    if (hasError) return;

    const isMaxBidValid = validateNumericInput(inputValue, setInputError);
    const isFundingValid = validateNumericInput(fundingValue, setFundingError);

    if (isMaxBidValid && isFundingValid) {
      // You could add additional logic here if needed
      console.log('Maximum bid set to:', inputValue);
      console.log('Automation funding set to:', fundingValue);
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

      {/* Input fields - shown only when automated bidding is enabled */}
      {automatedBidding && (
        <div className='mt-4 relative z-10'>
          <div className='grid grid-cols-[auto_1fr_auto] gap-y-5'>
            {/* Row 1: Automation Funding */}
            <div className='self-center'>
              <p className='font-bold'>Automation Funding</p>
            </div>
            <div className='flex justify-end'>
              <div className='flex flex-col w-full max-w-[200px]'>
                <div className='relative'>
                  <Input
                    type='text'
                    placeholder='Enter amount'
                    value={fundingValue}
                    onChange={handleFundingChange}
                    className={`pr-12 bg-white border-none text-gray-500 ${
                      fundingError ? 'border-red-500' : ''
                    }`}
                  />
                  <div className='absolute right-3 top-0 bottom-0 flex items-center pointer-events-none text-gray-500'>
                    ETH
                  </div>
                </div>
                {fundingError && (
                  <div className='text-white text-xs italic text-left mt-1'>
                    {fundingError}
                  </div>
                )}
              </div>
            </div>
            <div>{/* Empty cell */}</div>

            {/* Row 2: Maximum Bid Amount */}
            <div className='self-center'>
              <p className='font-bold'>Maximum Bid Amount</p>
            </div>
            <div className='flex justify-end'>
              <div className='flex flex-col w-full max-w-[200px]'>
                <div className='relative'>
                  <Input
                    type='text'
                    placeholder='Enter amount'
                    value={inputValue}
                    onChange={handleInputChange}
                    className={`pr-12 bg-white border-none text-gray-500 ${
                      inputError ? 'border-red-500' : ''
                    }`}
                  />
                  <div className='absolute right-3 top-0 bottom-0 flex items-center pointer-events-none text-gray-500'>
                    ETH
                  </div>
                </div>
                {inputError && (
                  <div className='text-white text-xs italic text-left mt-1'>
                    {inputError}
                  </div>
                )}
              </div>
            </div>
            <div className='self-start pl-2'>
              <Button
                onClick={handleSetBid}
                className='bg-transparent border border-white text-xs text-white hover:bg-gray-500 flex items-center'
                disabled={false} // Button should always be clickable
              >
                Set Bid
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomatedBiddingSection;
