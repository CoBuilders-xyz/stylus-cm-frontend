'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSidePanel } from './SidePanel';
import { useContractService } from '@/hooks/useContractService';
import { useContractsUpdater } from '@/hooks/useContractsUpdater';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { useRouter } from 'next/navigation';
import { X, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AddContractProps {
  onSuccess?: () => void;
  initialAddress?: string; // New prop for pre-filled address
  shouldRedirect?: boolean;
}

export default function AddContract({
  onSuccess,
  initialAddress,
  shouldRedirect = false,
}: AddContractProps) {
  const { onClose } = useSidePanel();
  const contractService = useContractService();
  const { signalContractUpdated } = useContractsUpdater();
  const { currentBlockchainId } = useBlockchainService();
  const router = useRouter();

  // State for the form - initialize with initialAddress if provided
  const [step, setStep] = useState<1 | 2>(initialAddress ? 2 : 1);
  const [contractAddress, setContractAddress] = useState(initialAddress || '');
  const [contractName, setContractName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Function to validate Ethereum address
  const validateAddress = (address: string): boolean => {
    // Basic Ethereum address validation
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(address)) {
      setAddressError('Please enter a valid Ethereum address');
      return false;
    }
    setAddressError(null);
    return true;
  };

  // Handle address input change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value);
    // Clear error when user types
    if (addressError) setAddressError(null);
  };

  // Handle name input change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractName(e.target.value);
  };

  // Move to the next step
  const handleNextStep = () => {
    if (validateAddress(contractAddress)) {
      setStep(2);
    }
  };

  // Go back to the previous step
  const handlePrevStep = () => {
    setStep(1);
  };

  // Submit the form
  const handleSubmit = async () => {
    if (!contractService || !currentBlockchainId) {
      setError('Service not available. Please try again later.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create the contract
      const result = await contractService.createContract(
        contractAddress,
        currentBlockchainId,
        contractName || undefined // Only send name if it's not empty
      );

      // Signal that a contract was created to update lists
      signalContractUpdated(result.id, 'name');

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close the panel
      onClose();

      // Redirect to my-contracts if shouldRedirect is true
      if (shouldRedirect) {
        router.push('/my-contracts');
      }
    } catch (err) {
      console.error('Failed to add contract:', err);
      setError('Failed to add the contract. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='text-white flex flex-col h-full bg-[#1A1919]'>
      {/* Title header with gradient background and noise texture */}
      <div
        className='relative overflow-hidden'
        style={{
          background:
            'linear-gradient(88.8deg, #275A93 0.24%, #2D99DD 24.41%, #FA9647 59.66%, #E0445B 100.95%)',
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

        {/* Header content */}
        <div className='flex justify-between items-center p-6 relative z-10'>
          <div>
            <h2 className='text-2xl font-bold text-white'>Add Contract</h2>
            <div className='text-white/80 mt-1'>Step {step} of 2</div>
          </div>
          <Button
            size='icon'
            onClick={onClose}
            className='w-10 h-10 flex items-center justify-center bg-transparent border border-white text-white rounded-md'
          >
            <X className='h-6 w-6' />
          </Button>
        </div>
      </div>

      <div className='p-6 flex-1'>
        {step === 1 && (
          <div>
            <h3 className='text-lg font-medium mb-2'>Set Contract Details</h3>
            <p className='text-gray-400 mb-4'>
              Enter the contract address and select the active network to
              proceed.
            </p>

            <div className='mb-4'>
              <div className='flex items-center gap-2'>
                <label className='block text-sm mb-1'>Contract Address</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='w-4 h-4 cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='max-w-xs'>
                      <strong>
                        Arbitrum cache only supports Stylus Contracts.
                      </strong>
                      <br />
                      Only WASM contracts (Stylus) are supported, not
                      traditional EVM contracts.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type='text'
                placeholder='0x...'
                value={contractAddress}
                onChange={handleAddressChange}
                className={`bg-black text-white border ${
                  addressError ? 'border-red-500' : 'border-gray-700'
                } rounded-md p-2 w-full`}
              />
              {addressError && (
                <p className='text-red-500 text-sm mt-1'>{addressError}</p>
              )}
              {!addressError && contractAddress && (
                <p className='text-green-500 text-sm mt-1'>Valid Eth address</p>
              )}
            </div>

            <div className='mt-6'>
              <Button
                className='w-full px-4 py-2 bg-black text-white border border-[#2C2E30] hover:bg-gray-900 rounded-md'
                disabled={!contractAddress || !!addressError}
                onClick={handleNextStep}
              >
                Next: Name Your Contract
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className='text-lg font-medium mb-2'>Name Your Contract</h3>
            <p className='text-gray-400 mb-4'>
              Assign a custom name for your contract. This name is private to
              you and can be updated anytime.
            </p>

            {initialAddress && (
              <div className='mb-4'>
                <div className='flex items-center gap-2'>
                  <label className='block text-sm mb-1'>Contract Address</label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='w-4 h-4 cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='max-w-xs'>
                        <strong>
                          Arbitrum cache only supports Stylus Contracts.
                        </strong>
                        <br />
                        Only WASM contracts (Stylus) are supported, not
                        traditional EVM contracts.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type='text'
                  value={contractAddress}
                  disabled
                  className='bg-gray-800 text-gray-400 border border-gray-700 rounded-md p-2 w-full cursor-not-allowed'
                />
              </div>
            )}

            <div className='mb-4'>
              <label className='block text-sm mb-1'>Contract Name</label>
              <Input
                type='text'
                placeholder='Protocol v1.5'
                value={contractName}
                onChange={handleNameChange}
                className='bg-black text-white border border-gray-700 rounded-md p-2 w-full'
              />
            </div>

            {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}

            <div className='flex space-x-4 mt-6'>
              {!initialAddress && (
                <Button
                  className='flex-1 px-4 py-2 bg-black text-white border border-[#2C2E30] hover:bg-gray-900 rounded-md'
                  onClick={handlePrevStep}
                  disabled={isLoading}
                >
                  Back to Contract Details
                </Button>
              )}

              <Button
                className={`${
                  !initialAddress ? 'flex-1' : 'w-full'
                } px-4 py-2 bg-black text-white border border-[#2C2E30] hover:bg-gray-900 rounded-md`}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Contract'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
