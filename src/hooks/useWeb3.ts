import { useState, useEffect, useCallback } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useGasPrice,
} from 'wagmi';
import { formatGwei } from 'viem';
import {
  Web3Service,
  ContractWriteParams,
  GasProtectionConfig,
} from '@/services/web3Service';

/**
 * Transaction status enum
 */
export enum TransactionStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Web3 transaction result type
 */
export interface Web3TransactionResult {
  /** Current status of the transaction */
  status: TransactionStatus;
  /** Transaction hash when available */
  txHash?: `0x${string}`;
  /** Error if something went wrong */
  error: Error | null;
  /** Reset the transaction state */
  reset: () => void;
  /** Current gas price in Gwei */
  gasPriceGwei: string | null;
  /** Flag indicating if gas price is excessively high */
  isGasPriceHigh: boolean;
  /** Function to write to the contract */
  writeContract: <
    TFunctionName extends string,
    TArgs extends readonly unknown[]
  >(
    params: ContractWriteParams<TFunctionName, TArgs>,
    onSuccess?: (txHash: `0x${string}`) => void
  ) => void;
}

/**
 * Hook options
 */
export interface UseWeb3Options {
  /** Gas protection configuration */
  gasProtection?: GasProtectionConfig;
  /** Auto reset after success/error */
  autoReset?: boolean;
  /** Delay in ms before auto reset */
  resetDelay?: number;
}

/**
 * Generic hook for Web3 interactions
 */
export function useWeb3(options: UseWeb3Options = {}): Web3TransactionResult {
  // Extract options with defaults
  const {
    gasProtection = Web3Service.DEFAULT_GAS_PROTECTION,
    autoReset = false,
    resetDelay = 3000,
  } = options;

  // Component state
  const [status, setStatus] = useState<TransactionStatus>(
    TransactionStatus.IDLE
  );
  const [error, setError] = useState<Error | null>(null);
  const [onSuccessCallback, setOnSuccessCallback] = useState<
    ((txHash: `0x${string}`) => void) | undefined
  >(undefined);
  const [isGasPriceHigh, setIsGasPriceHigh] = useState<boolean>(false);
  const [gasPriceGwei, setGasPriceGwei] = useState<string | null>(null);

  // Get current gas price
  const { data: gasPrice } = useGasPrice();

  // Update gas price information whenever it changes
  useEffect(() => {
    if (gasPrice) {
      try {
        // Format gas price to Gwei
        const gasPriceFormatted = formatGwei(gasPrice);
        setGasPriceGwei(gasPriceFormatted);

        // Check if gas price is excessively high
        const gasPriceNumber = parseFloat(gasPriceFormatted);
        setIsGasPriceHigh(
          !Web3Service.isGasFeeAcceptable(
            gasPriceNumber,
            gasProtection.maxGasPriceGwei
          )
        );
      } catch (err) {
        console.error('Error formatting gas price:', err);
      }
    }
  }, [gasPrice, gasProtection.maxGasPriceGwei]);

  // Use wagmi hooks for contract interaction
  const {
    writeContract: wagmiWriteContract,
    data: txHash,
    error: writeError,
    isPending: isWritePending,
    isSuccess: isWriteSuccess,
    reset: resetWrite,
  } = useWriteContract();

  // Track transaction receipt
  const {
    isSuccess: isReceiptSuccess,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Update status based on transaction states
  useEffect(() => {
    if (isWritePending) {
      setStatus(TransactionStatus.PENDING);
    } else if (isWriteSuccess && isReceiptSuccess) {
      setStatus(TransactionStatus.SUCCESS);
    } else if (writeError || isReceiptError) {
      setStatus(TransactionStatus.ERROR);
    }
  }, [
    isWritePending,
    isWriteSuccess,
    isReceiptSuccess,
    writeError,
    isReceiptError,
  ]);

  // Handle errors
  useEffect(() => {
    if (writeError && !error) {
      setError(writeError);
    } else if (receiptError && !error) {
      setError(receiptError);
    }
  }, [writeError, receiptError, error]);

  // Auto reset after success or error if enabled
  useEffect(() => {
    if (
      autoReset &&
      (status === TransactionStatus.SUCCESS ||
        status === TransactionStatus.ERROR)
    ) {
      const timer = setTimeout(() => {
        reset();
      }, resetDelay);

      return () => clearTimeout(timer);
    }
  }, [status, autoReset, resetDelay]);

  // Call the onSuccess callback when transaction succeeds
  useEffect(() => {
    if (status === TransactionStatus.SUCCESS && txHash && onSuccessCallback) {
      onSuccessCallback(txHash);
      // Clear the callback to prevent duplicate calls
      setOnSuccessCallback(undefined);
    }
  }, [status, txHash, onSuccessCallback]);

  /**
   * Write to a contract with all necessary validations
   */
  const writeContract = useCallback(
    <TFunctionName extends string, TArgs extends readonly unknown[]>(
      params: ContractWriteParams<TFunctionName, TArgs>,
      onSuccess?: (txHash: `0x${string}`) => void
    ) => {
      // Store the success callback if provided
      if (onSuccess) {
        setOnSuccessCallback(() => onSuccess);
      }

      try {
        setStatus(TransactionStatus.PREPARING);
        setError(null);

        // Check current gas price before proceeding
        if (gasPrice && isGasPriceHigh) {
          const gasPriceFormatted = formatGwei(gasPrice);
          const error = new Error(
            `Transaction aborted: Network fee is extremely high (${gasPriceFormatted} Gwei). Please try again when gas prices are lower.`
          );
          setError(error);
          setStatus(TransactionStatus.ERROR);
          return;
        }

        // Use service to prepare the transaction with proper configurations
        const mergedParams = {
          ...params,
          gasProtection: params.gasProtection || gasProtection,
        };

        const tx = Web3Service.prepareContractWriteTransaction(mergedParams);

        // Execute the transaction
        wagmiWriteContract(tx);
      } catch (err) {
        console.error('Error executing contract write:', err);
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setStatus(TransactionStatus.ERROR);
      }
    },
    [gasPrice, isGasPriceHigh, gasProtection, wagmiWriteContract]
  );

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setStatus(TransactionStatus.IDLE);
    setError(null);
    setOnSuccessCallback(undefined);
    resetWrite();
  }, [resetWrite]);

  return {
    status,
    txHash,
    error,
    reset,
    gasPriceGwei,
    isGasPriceHigh,
    writeContract,
  };
}
