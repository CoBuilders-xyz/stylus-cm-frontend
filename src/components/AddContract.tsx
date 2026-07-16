'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSidePanel } from './SidePanel';
import { useContractService } from '@/hooks/useContractService';
import { useContractsUpdater } from '@/hooks/useContractsUpdater';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { useRouter } from 'next/navigation';
import { X, Info } from 'lucide-react';
import {
  useAccount,
  useBytecode,
  useChainId,
  useSimulateContract,
  useSwitchChain,
} from 'wagmi';
import { isAddress, parseEther } from 'viem';
import { useWeb3, TransactionStatus } from '@/hooks/useWeb3';
import {
  useProgramTimeLeft,
  type ProgramReason,
} from '@/hooks/useProgramTimeLeft';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ARB_WASM_ABI,
  ARB_WASM_PRECOMPILE,
} from '@/config/abis/arbWasm/arbWasm';
import { showErrorToast, showSuccessToast } from '@/components/Toast';
import ActivationRequiredCard from '@/components/ActivationRequiredCard';

// User-facing copy per revert reason. The action is the same in all three
// cases (call ArbWasm.activateProgram) — only the framing differs so the
// user understands whether they are activating for the first time,
// re-activating after expiry, or migrating to a newer Stylus runtime.
const ACTIVATION_MESSAGE_BY_REASON: Record<ProgramReason, string> = {
  never_activated:
    'This WASM contract has not been activated yet. Activate it now to cache it.',
  expired:
    "This WASM contract's activation has expired. Reactivate it to be cached.",
  needs_upgrade:
    'This WASM contract was activated under an older Stylus version. Reactivate it under the current version to be cached.',
};

// Generous over-pay used to discover the program's dataFee via simulation.
// ArbWasm.activateProgram refunds excess value, so the user is only charged
// the actual dataFee returned from the simulation.
const ACTIVATION_SIMULATION_VALUE = parseEther('0.01');

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
  const { currentBlockchain, currentBlockchainId } = useBlockchainService();
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const targetChainId = currentBlockchain?.chainId;
  const isChainMismatch =
    isConnected && targetChainId != null && walletChainId !== targetChainId;
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
    chainId: targetChainId,
    query: {
      enabled:
        !!contractAddress &&
        contractAddress.length === 42 &&
        !addressError &&
        targetChainId != null,
    },
  });

  // Check the program's activation status against the ArbWasm precompile.
  // useProgramTimeLeft (COB-493) decodes the precompile's typed reverts into
  // a stable `reason` — this is what lets the amber card handle every
  // reactivation case (never-activated, expired, needs-upgrade) with a single
  // `activateProgram` call. Using the shared hook here means the AddContract
  // validation stays in lockstep with the badge on the contracts tables.
  const programAddresses = useMemo(
    () =>
      isWasmContract && contractAddress.length === 42
        ? [contractAddress]
        : undefined,
    [isWasmContract, contractAddress]
  );
  const {
    data: programReadings,
    isLoading: isCheckingWasmActive,
    refetch: refetchProgramTimeLeft,
  } = useProgramTimeLeft(programAddresses, targetChainId);
  const programReading = programReadings[contractAddress.toLowerCase()];
  const programSeconds = programReading?.seconds ?? null;
  // Defensive: some ArbWasm precompile builds may return `0n` instead of
  // reverting for expired programs, and older revert types not covered by
  // `REASON_BY_ERROR_NAME` in useProgramTimeLeft fall back to `null`. If we
  // observe a numeric zero without a decoded reason, treat it as expired so
  // the amber card still surfaces instead of silently blocking the user.
  const effectiveReason: ProgramReason | undefined =
    programReading?.reason ??
    (programSeconds === 0 ? 'expired' : undefined);
  const isReactivationRequired =
    isWasmContract && effectiveReason != null;
  const isProgramActive =
    isWasmContract &&
    effectiveReason == null &&
    programSeconds != null &&
    programSeconds > 0;

  // Simulate activateProgram on the ArbWasm precompile so we can discover the
  // contract-specific dataFee. Excess value is refunded by the precompile, but
  // we want to charge the user the precise fee. simulateData.result is
  // [version, dataFee].
  const {
    data: activationSimulation,
    error: activationSimulationError,
    isLoading: isSimulatingActivation,
  } = useSimulateContract({
    address: ARB_WASM_PRECOMPILE,
    abi: ARB_WASM_ABI,
    functionName: 'activateProgram',
    args: [contractAddress as `0x${string}`],
    value: ACTIVATION_SIMULATION_VALUE,
    chainId: targetChainId,
    query: {
      enabled:
        isConnected &&
        isReactivationRequired &&
        !isChainMismatch &&
        targetChainId != null,
    },
  });

  const activationDataFee = useMemo(() => {
    const result = activationSimulation?.result as
      | readonly [number, bigint]
      | undefined;
    return result?.[1];
  }, [activationSimulation]);

  // Route the write through the project-wide useWeb3 wrapper so we inherit
  // gas-price protection and a consistent transaction status enum with the
  // rest of the codebase (bidding, gas tank, automated bidding).
  const {
    writeContract: writeActivation,
    status: activationStatus,
    txHash: activationTxHash,
    error: activationError,
    reset: resetActivationWrite,
  } = useWeb3();

  const isActivating =
    activationStatus === TransactionStatus.PREPARING ||
    activationStatus === TransactionStatus.PENDING;
  const isActivationConfirmed =
    activationStatus === TransactionStatus.SUCCESS;

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
        // It's a WASM contract, now we need to check its activation state
        // against the ArbWasm precompile.
        setIsWasmContract(true);
        // Show loading while checking activation status
        if (isCheckingWasmActive) {
          setValidationState({
            message: 'Checking WASM contract activation status...',
            type: 'loading',
          });
          return;
        }

        // Every "not active" state from the precompile — never activated,
        // expired, or activated under an older Stylus version — is resolved
        // by the same `activateProgram` call, so all three surface as the
        // actionable amber state instead of a hard block. The wording is
        // tailored per reason so the user understands what actually happened.
        if (isReactivationRequired && effectiveReason) {
          setValidationState({
            message: ACTIVATION_MESSAGE_BY_REASON[effectiveReason],
            type: 'warning',
          });
          setAddressError(null);
          return;
        }

        // WASM contract exists, is active, and still valid
        if (isProgramActive && programSeconds != null) {
          const daysLeft = Math.floor(programSeconds / 86400); // Convert seconds to days
          setValidationState({
            message: `Valid WASM contract. Program expires in ${daysLeft} days`,
            type: 'success',
          });
          // Clear any previous address error
          setAddressError(null);
          return;
        }

        // Reading came back as "unknown" (RPC error, unrecognised revert,
        // or wagmi not settled yet). Keep the user in the loading state
        // rather than falsely surfacing the contract as inactive — the
        // hook will re-emit once the read resolves.
        setValidationState({
          message: 'Checking WASM contract activation status...',
          type: 'loading',
        });
        return;
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
    isCheckingWasmActive,
    isReactivationRequired,
    effectiveReason,
    isProgramActive,
    programSeconds,
  ]);

  // Function to validate Ethereum address
  const validateAddress = (address: string): boolean => {
    // Check if address is too long
    if (address.length > 42) {
      setAddressError(
        'Address is too long. Ethereum addresses must be exactly 42 characters (0x + 40 hex chars)'
      );
      return false;
    }

    // Use viem's isAddress function for proper Ethereum address validation
    if (!isAddress(address)) {
      setAddressError('Please enter a valid Ethereum address (42 characters)');
      return false;
    }
    setAddressError(null);
    return true;
  };

  // Handle address input change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setContractAddress(newAddress);

    // Clear validation states when user types
    setValidationState(null);
    setIsWasmContract(false); // Reset WASM status on address change
    resetActivationWrite();

    // Validate address on every change for immediate feedback
    if (newAddress.trim()) {
      validateAddress(newAddress);
    } else {
      // Clear error if field is empty
      setAddressError(null);
    }
  };

  const handleSwitchToTargetChain = () => {
    if (targetChainId != null) {
      switchChain({ chainId: targetChainId });
    }
  };

  const handleActivateProgram = () => {
    if (!isConnected) {
      showErrorToast({
        message: 'Connect your wallet to activate this contract.',
      });
      return;
    }
    if (isChainMismatch) {
      // The UI surfaces a dedicated Switch button; guard the write path just
      // in case it gets invoked before the user resolves the mismatch.
      handleSwitchToTargetChain();
      return;
    }
    // Nullish check rather than truthy so a legitimate 0n fee is not treated
    // as missing (the ArbWasm precompile can, in theory, return a zero
    // dataFee for a program that has already paid its allowance).
    if (activationDataFee == null) {
      showErrorToast({
        message:
          activationSimulationError?.message ??
          'Unable to estimate the activation fee. Try again in a moment.',
      });
      return;
    }
    writeActivation({
      address: ARB_WASM_PRECOMPILE,
      abi: ARB_WASM_ABI,
      functionName: 'activateProgram',
      args: [contractAddress as `0x${string}`],
      value: activationDataFee,
      chainId: targetChainId,
    });
  };

  // After the activation tx is mined, re-read programTimeLeft so the
  // validation effect unlocks the form once the precompile reports
  // a non-zero remaining lifetime.
  useEffect(() => {
    if (isActivationConfirmed) {
      showSuccessToast({ message: 'Contract activated successfully.' });
      refetchProgramTimeLeft();
    }
  }, [isActivationConfirmed, refetchProgramTimeLeft]);

  useEffect(() => {
    if (!activationError) return;

    const message = activationError.message ?? '';
    const lower = message.toLowerCase();
    let display = 'Activation failed. Please try again.';
    if (
      lower.includes('user rejected') ||
      lower.includes('user denied') ||
      lower.includes('rejected the request')
    ) {
      display = 'Activation cancelled in wallet.';
    } else if (
      lower.includes('insufficient funds') ||
      lower.includes('insufficient balance') ||
      lower.includes('exceeds the balance')
    ) {
      display = 'Insufficient ETH to cover the activation fee.';
    } else if (lower.includes('network fee is extremely high')) {
      // Surface the gas-price-protection message from useWeb3 as-is.
      display = message;
    }
    showErrorToast({ message: display, onRetry: handleActivateProgram });
    resetActivationWrite();
    // handleActivateProgram is stable enough for this retry surface; including
    // it would re-fire the effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activationError, resetActivationWrite]);

  // Handle name input change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractName(e.target.value);
  };

  // Move to the next step
  const handleNextStep = () => {
    if (
      validateAddress(contractAddress) &&
      !addressError &&
      validationState?.type === 'success'
    ) {
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
                    <Info className='w-4 h-4 cursor-help mb-1' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='max-w-xs'>
                      <strong>
                        Arbitrum cache only supports Stylus Contracts.
                      </strong>
                      <br />
                      Only WASM contracts (Stylus) are supported, not EVM
                      contracts.
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
              {validationState && validationState.type !== 'warning' && (
                <p
                  className={`text-sm mt-1 ${
                    validationState.type === 'loading'
                      ? 'text-yellow-500'
                      : validationState.type === 'success'
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {validationState.message}
                </p>
              )}
              {isReactivationRequired && (
                <ActivationRequiredCard
                  message={
                    validationState?.message ??
                    'This WASM contract is expired and needs to be reactivated to be cached.'
                  }
                  isConnected={isConnected}
                  isSimulating={isSimulatingActivation}
                  simulationError={activationSimulationError}
                  dataFee={activationDataFee}
                  isActivating={isActivating}
                  isChainMismatch={isChainMismatch}
                  isSwitchingChain={isSwitchingChain}
                  chainName={currentBlockchain?.name}
                  onSwitchChain={handleSwitchToTargetChain}
                  txHash={activationTxHash}
                  chainId={targetChainId}
                  onActivate={handleActivateProgram}
                />
              )}
            </div>

            <div className='mt-6'>
              <Button
                className='w-full px-4 py-2 bg-black text-white border border-[#2C2E30] hover:bg-gray-900 rounded-md'
                disabled={
                  !contractAddress ||
                  !!addressError ||
                  validationState?.type !== 'success'
                }
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
                  <label className='block text-sm'>Contract Address</label>
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
                        Only WASM contracts (Stylus) are supported, not EVM
                        contracts.
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
                {validationState && validationState.type !== 'warning' && (
                  <p
                    className={`text-sm mt-1 ${
                      validationState.type === 'loading'
                        ? 'text-yellow-500'
                        : validationState.type === 'success'
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {validationState.message}
                  </p>
                )}
              </div>
            )}

            {/* Prefilled-address flow can drop the user straight into Step 2
                with an expired contract; render the activation card here as
                well so the same on-chain activate flow is available and the
                Add Contract button stays gated until programTimeLeft > 0. */}
            {isReactivationRequired && (
              <ActivationRequiredCard
                message={
                  validationState?.message ??
                  'This WASM contract is expired and needs to be reactivated to be cached.'
                }
                isConnected={isConnected}
                isSimulating={isSimulatingActivation}
                simulationError={activationSimulationError}
                dataFee={activationDataFee}
                isActivating={isActivating}
                isChainMismatch={isChainMismatch}
                isSwitchingChain={isSwitchingChain}
                chainName={currentBlockchain?.name}
                onSwitchChain={handleSwitchToTargetChain}
                txHash={activationTxHash}
                chainId={targetChainId}
                onActivate={handleActivateProgram}
              />
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
                disabled={isLoading || validationState?.type !== 'success'}
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
