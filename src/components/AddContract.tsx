'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSidePanel } from './SidePanel';
import { useContractService } from '@/hooks/useContractService';
import { useContractsUpdater } from '@/hooks/useContractsUpdater';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { useRouter } from 'next/navigation';
import { X, Info } from 'lucide-react';
import { useBytecode, useReadContract } from 'wagmi';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ArbWasm precompile ABI - using the real interface for checking program activation
const ARB_WASM_ABI = [
  {
    type: 'function',
    name: 'programTimeLeft',
    stateMutability: 'view',
    inputs: [{ name: 'program', type: 'address' }],
    outputs: [{ type: 'uint64' }],
  },
] as const;

// ArbWasm precompile address
const ARB_WASM_PRECOMPILE =
  '0x0000000000000000000000000000000000000071' as const;

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
  const [validationState, setValidationState] = useState<{
    message: string;
    type: 'loading' | 'success' | 'warning' | 'error';
  } | null>(null);
  const [isWasmContract, setIsWasmContract] = useState(false);

  // Get bytecode for the contract address if it's a valid address
  const {
    data: bytecode,
    isLoading: isBytecodeLoading,
    error: bytecodeError,
  } = useBytecode({
    address: contractAddress as `0x${string}`,
    query: {
      enabled:
        !!contractAddress && contractAddress.length === 42 && !addressError,
    },
  });

  // Check if WASM contract is active using ArbWasm precompile
  const {
    data: timeLeftSeconds,
    isLoading: isCheckingWasmActive,
    error: wasmActiveError,
  } = useReadContract({
    address: ARB_WASM_PRECOMPILE,
    abi: ARB_WASM_ABI,
    functionName: 'programTimeLeft',
    args: [contractAddress as `0x${string}`],
    query: {
      enabled:
        isWasmContract && !!contractAddress && contractAddress.length === 42,
    },
  });

  // Handle all validation logic in one place
  useEffect(() => {
    // Clear validation state if address is not valid
    if (!contractAddress || contractAddress.length !== 42 || addressError) {
      setValidationState(null);
      setIsWasmContract(false);
      return;
    }

    // Show loading state while fetching bytecode
    if (isBytecodeLoading) {
      setValidationState({
        message: 'Validating contract...',
        type: 'loading',
      });
      return;
    }

    // Handle bytecode error
    if (bytecodeError) {
      setValidationState({
        message: 'Error validating contract',
        type: 'error',
      });
      console.error('Error fetching bytecode:', bytecodeError);
      return;
    }

    // Handle case where no contract is found (bytecode fetch completed but no contract)
    // This covers both '0x' (empty bytecode) and null/undefined (no contract at address)
    if (
      bytecode === '0x' ||
      (bytecode == null && !isBytecodeLoading && !bytecodeError)
    ) {
      setValidationState({
        message: 'Wrong contract address, no bytecode found',
        type: 'error',
      });
      setIsWasmContract(false);
      return;
    }

    // Analyze bytecode if it exists
    if (bytecode && bytecode !== '0x') {
      // Detect contract type based on Arbitrum's official Stylus prefix
      // According to Arbitrum docs: "when a contract's bytecode starts with the magic 0xEFF00000 prefix, it's a Stylus WASM contract"
      const bytecodeStart = bytecode.slice(0, 10).toLowerCase(); // Get first 4 bytes: 0x + 8 hex chars

      const isStylus = bytecodeStart === '0xeff00000';
      const detectedType = isStylus ? 'WASM' : 'EVM';

      if (detectedType === 'EVM') {
        setValidationState({
          message:
            'This appears to be an EVM contract. Only WASM contracts (Stylus) are supported.',
          type: 'error',
        });
        // Also set addressError to prevent form submission
        setAddressError(
          'This appears to be an EVM contract. Only WASM contracts (Stylus) are supported.'
        );
        setIsWasmContract(false);
      } else {
        // It's a WASM contract, now we need to check if it's active
        setIsWasmContract(true);
        // Show loading while checking activation status
        if (isCheckingWasmActive) {
          setValidationState({
            message: 'Checking WASM contract activation status...',
            type: 'loading',
          });
          return;
        }

        // Handle timeout case
        if (wasmActiveError) {
          // programTimeLeft reverts for EVM contracts or non-activated programs
          setValidationState({
            message: 'Make sure your WASM contract is active',
            type: 'error',
          });
          setAddressError('Make sure your WASM contract is active');
          return;
        }

        // Check if WASM program is expired
        if (
          typeof timeLeftSeconds === 'bigint' &&
          timeLeftSeconds === BigInt(0)
        ) {
          setValidationState({
            message: 'WASM contract has expired and needs reactivation',
            type: 'error',
          });
          setAddressError('WASM contract has expired and needs reactivation');
          return;
        }

        // WASM contract exists, is active, and still valid
        if (
          typeof timeLeftSeconds === 'bigint' &&
          timeLeftSeconds > BigInt(0)
        ) {
          const timeInSeconds = Number(timeLeftSeconds);
          const daysLeft = Math.floor(timeInSeconds / 86400); // Convert seconds to days
          setValidationState({
            message: `Valid WASM contract. Program expires in ${daysLeft} days`,
            type: 'success',
          });
          // Clear any previous address error
          setAddressError(null);
          return;
        }
      }
      return;
    }

    // If we reach here, something unexpected happened - no validation state will be shown
  }, [
    contractAddress,
    addressError,
    bytecode,
    isBytecodeLoading,
    bytecodeError,
    isWasmContract,
    timeLeftSeconds,
    isCheckingWasmActive,
    wasmActiveError,
  ]);

  // Function to validate Ethereum address
  const validateAddress = (address: string): boolean => {
    // Basic Ethereum address validation - must be exactly 42 characters (0x + 40 hex chars)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(address) || address.length !== 42) {
      setAddressError('Please enter a valid Ethereum address (42 characters)');
      return false;
    }
    setAddressError(null);
    return true;
  };

  // Handle address input change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value);
    // Clear all validation states when user types
    setAddressError(null);
    setValidationState(null);
    setIsWasmContract(false); // Reset WASM status on address change
  };

  // Handle name input change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractName(e.target.value);
  };

  // Move to the next step
  const handleNextStep = () => {
    if (validateAddress(contractAddress) && !addressError) {
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
              {validationState && (
                <p
                  className={`text-sm mt-1 ${
                    validationState.type === 'loading'
                      ? 'text-yellow-500'
                      : validationState.type === 'success'
                      ? 'text-green-500'
                      : validationState.type === 'warning'
                      ? 'text-orange-500'
                      : 'text-red-500'
                  }`}
                >
                  {validationState.message}
                </p>
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
                {addressError && (
                  <p className='text-red-500 text-sm mt-1'>{addressError}</p>
                )}
                {validationState && (
                  <p
                    className={`text-sm mt-1 ${
                      validationState.type === 'loading'
                        ? 'text-yellow-500'
                        : validationState.type === 'success'
                        ? 'text-green-500'
                        : validationState.type === 'warning'
                        ? 'text-orange-500'
                        : 'text-red-500'
                    }`}
                  >
                    {validationState.message}
                  </p>
                )}
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
