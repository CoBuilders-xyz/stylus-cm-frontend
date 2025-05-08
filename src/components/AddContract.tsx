'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSidePanel } from './SidePanel';
import { useContractService } from '@/hooks/useContractService';
import { useContractsUpdater } from '@/hooks/useContractsUpdater';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { XCircle } from 'lucide-react';

interface AddContractProps {
  onSuccess?: () => void;
  initialAddress?: string; // New prop for pre-filled address
}

export default function AddContract({
  onSuccess,
  initialAddress,
}: AddContractProps) {
  const { onClose } = useSidePanel();
  const contractService = useContractService();
  const { signalContractUpdated } = useContractsUpdater();
  const { currentBlockchainId } = useBlockchainService();

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
    } catch (err) {
      console.error('Failed to add contract:', err);
      setError('Failed to add the contract. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='text-white flex flex-col h-full bg-[#1A1919]'>
      <div className='flex justify-between items-center p-6 border-b border-[#2C2E30]'>
        <h2 className='text-xl font-bold'>Add Contract</h2>
        <div className='text-sm text-gray-400'>Step {step} of 2</div>
        <Button
          variant='ghost'
          size='icon'
          onClick={onClose}
          className='hover:bg-gray-800 rounded-full'
        >
          <XCircle className='h-6 w-6' />
        </Button>
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
              <label className='block text-sm mb-1'>Contract Address</label>
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
                className='w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md'
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
                <label className='block text-sm mb-1'>Contract Address</label>
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
                placeholder='E.g: House Rental'
                value={contractName}
                onChange={handleNameChange}
                className='bg-black text-white border border-gray-700 rounded-md p-2 w-full'
              />
            </div>

            {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}

            <div className='flex space-x-4 mt-6'>
              {!initialAddress && (
                <Button
                  className='flex-1 py-2 bg-black text-white border border-white rounded-md'
                  onClick={handlePrevStep}
                  disabled={isLoading}
                >
                  Back to Contract Details
                </Button>
              )}

              <Button
                className={`${
                  !initialAddress ? 'flex-1' : 'w-full'
                } py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md`}
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
