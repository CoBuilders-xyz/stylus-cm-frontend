import { parseEther } from 'viem';
import type { Address, Abi } from 'viem';

/**
 * Configuration for gas protection to prevent excessive network fees
 */
export interface GasProtectionConfig {
  maxGasPriceGwei: number;
  gasLimit?: bigint;
}

/**
 * Our custom transaction request type
 * This matches what wagmi's useWriteContract expects
 */
export interface WriteTransactionRequest {
  address: Address;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  value?: bigint;
  gas?: bigint;
  chainId?: number;
}

/**
 * Parameters for executing a contract write operation
 */
export interface ContractWriteParams<
  TFunctionName extends string,
  TArgs extends readonly unknown[]
> {
  /** Contract address */
  address: Address;
  /** Contract ABI */
  abi: Abi;
  /** Function name to call */
  functionName: TFunctionName;
  /** Arguments to pass to the function */
  args: TArgs;
  /**
   * Value to send with the transaction.
   * - `string`: interpreted as ETH (converted with `parseEther` internally).
   * - `bigint`: interpreted as raw wei and passed straight through. Use
   *   this when the value was derived on-chain (e.g. from a simulation)
   *   and precision matters.
   */
  value?: string | bigint;
  /** Target chain id — forwarded to wagmi so the write happens on the
   * intended network even if the wallet is currently switched elsewhere. */
  chainId?: number;
  /** Gas protection configuration */
  gasProtection?: GasProtectionConfig;
}

/**
 * Generic Web3 service for interacting with blockchain
 */
export class Web3Service {
  /**
   * Default gas protection configuration
   */
  static DEFAULT_GAS_PROTECTION: GasProtectionConfig = {
    maxGasPriceGwei: 500, // 500 gwei max
    gasLimit: BigInt(1000000), // 1M gas limit
  };

  /**
   * Prepare a contract write transaction
   * @param params Parameters for the transaction
   * @returns A prepared transaction request
   */
  static prepareContractWriteTransaction<
    TFunctionName extends string,
    TArgs extends readonly unknown[]
  >(
    params: ContractWriteParams<TFunctionName, TArgs>
  ): WriteTransactionRequest {
    const {
      address,
      abi,
      functionName,
      args,
      value,
      chainId,
      gasProtection = this.DEFAULT_GAS_PROTECTION,
    } = params;

    try {
      // Prepare basic transaction data
      const transactionRequest: WriteTransactionRequest = {
        address,
        abi,
        functionName,
        args,
      };

      // Add value if provided. Strings are treated as ETH and converted to
      // wei; bigints are treated as raw wei and passed straight through.
      // Nullish check (not truthy) so a legitimate 0/0n does not silently
      // become undefined and lose the intent to send zero value.
      if (value != null) {
        transactionRequest.value =
          typeof value === 'string' ? parseEther(value) : value;
      }

      // Forward the target chain id (if any) so wagmi routes the write to
      // the intended network regardless of the wallet's current chain.
      if (chainId != null) {
        transactionRequest.chainId = chainId;
      }

      // Add gas limit if provided
      if (gasProtection.gasLimit) {
        transactionRequest.gas = gasProtection.gasLimit;
      }

      return transactionRequest;
    } catch (error) {
      console.error('Error preparing transaction:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to prepare transaction'
      );
    }
  }

  /**
   * Validate if the current gas fee is reasonable before proceeding
   * @param currentGasPriceGwei The current gas price in gwei
   * @param maxGasPriceGwei Maximum acceptable gas price in gwei
   * @returns true if gas price is acceptable, false otherwise
   */
  static isGasFeeAcceptable(
    currentGasPriceGwei: number | string,
    maxGasPriceGwei: number = this.DEFAULT_GAS_PROTECTION.maxGasPriceGwei
  ): boolean {
    // Parse string to number if needed
    const gasPriceNumber =
      typeof currentGasPriceGwei === 'string'
        ? parseFloat(currentGasPriceGwei)
        : currentGasPriceGwei;

    // Safety check - if gas price is excessively high, don't proceed
    return gasPriceNumber <= maxGasPriceGwei;
  }

  /**
   * Calculate the estimated cost of a transaction
   * @param gasPriceGwei Current gas price in gwei
   * @param gasLimit Gas limit for the transaction
   * @param ethPrice Optional price of ETH in USD
   * @returns Estimated cost in ETH and USD (if ethPrice provided)
   */
  static estimateTransactionCost(
    gasPriceGwei: number | string,
    gasLimit: bigint | number,
    ethPrice?: number
  ): { ethCost: string; usdCost?: string } {
    const gasPriceNumber =
      typeof gasPriceGwei === 'string'
        ? parseFloat(gasPriceGwei)
        : gasPriceGwei;

    const gasLimitNumber =
      typeof gasLimit === 'bigint' ? Number(gasLimit) : gasLimit;

    // Calculate cost in ETH: (gasPrice in gwei * gasLimit) / 10^9
    const ethCost = (gasPriceNumber * gasLimitNumber) / 1_000_000_000;
    const ethCostFormatted = ethCost.toFixed(8);

    // Calculate USD cost if ETH price is provided
    if (ethPrice) {
      const usdCost = ethCost * ethPrice;
      return {
        ethCost: ethCostFormatted,
        usdCost: usdCost.toFixed(2),
      };
    }

    return { ethCost: ethCostFormatted };
  }
}
