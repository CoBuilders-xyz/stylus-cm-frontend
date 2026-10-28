/**
 * Pure helpers for CacheManagerAutomation (CMA) v2.0 reads. Kept free of
 * React/wagmi so the tuple mapping can be unit-tested against the ABI.
 */

/**
 * One entry of the CMA `ContractConfig` struct as viem decodes it. The ABI
 * names every component, so viem returns objects keyed by name (not
 * positional arrays). Field order below mirrors the v2.0 tuple layout:
 * `(address contractAddress, bool biddingEnabled, bool autoActivate,
 *   uint256 maxBid, uint256 maxActivationCost)`.
 */
export interface CMAContractConfig {
  contractAddress: `0x${string}`;
  /** Controls automated bidding only. Activation is gated by `autoActivate`. */
  biddingEnabled: boolean;
  autoActivate: boolean;
  maxBid: bigint;
  maxActivationCost: bigint;
}

/**
 * Normalises a decoded `ContractConfig` into a plain {@link CMAContractConfig}.
 * Copies by name so an unexpected extra field on the decoded object never
 * leaks into app state.
 */
export function toCMAContractConfig(entry: CMAContractConfig): CMAContractConfig {
  return {
    contractAddress: entry.contractAddress,
    biddingEnabled: entry.biddingEnabled,
    autoActivate: entry.autoActivate,
    maxBid: entry.maxBid,
    maxActivationCost: entry.maxActivationCost,
  };
}

/**
 * Finds the connected user's CMA record for `contractAddress` inside the
 * array returned by `getUserContracts`.
 *
 * - `undefined` when the read has not resolved yet (`rawContracts == null`)
 * - `null` when the contract is not registered under this user
 * - the config otherwise
 */
export function findCMAContractConfig(
  rawContracts: readonly CMAContractConfig[] | null | undefined,
  contractAddress: string | null | undefined
): CMAContractConfig | null | undefined {
  if (rawContracts == null) return undefined;
  if (contractAddress == null) return null;
  const target = contractAddress.toLowerCase();
  const match = rawContracts.find(
    (entry) => entry.contractAddress.toLowerCase() === target
  );
  if (!match) return null;
  return toCMAContractConfig(match);
}
