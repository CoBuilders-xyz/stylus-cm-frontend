/**
 * Cache Manager Automation ABI (v2.0).
 *
 * On-chain contract that orchestrates automated bidding and activation for
 * user-registered Stylus programs.
 *
 * `CacheManagerAutomation.json` is the single source of truth. It is the
 * Hardhat artifact compiled from stylus-cm-contracts commit
 * `82f963ae45441c8c0a558735e876183370d7a7c9` (audited v2.0). This module only
 * re-exports the ABI with the `Abi` type so every wagmi/viem call site shares
 * one typed import instead of casting the JSON on its own.
 *
 * v2.0 `ContractConfig` tuple layout (positional order matters for decoding):
 * `(address contractAddress, bool biddingEnabled, bool autoActivate,
 *   uint256 maxBid, uint256 maxActivationCost)`.
 *
 * `insertContract` / `updateContract` inputs keep the v1 order:
 * `(_contract, _maxBid, _biddingEnabled, _autoActivate, _maxActivationCost)`.
 *
 * To regenerate: check out the contracts commit, run `npx hardhat compile`,
 * and copy the `abi` array of the artifact into the JSON file.
 */
import type { Abi } from 'viem';
import cacheManagerAutomationArtifact from './CacheManagerAutomation.json';

export const CACHE_MANAGER_AUTOMATION_ABI =
  cacheManagerAutomationArtifact.abi as Abi;

/** Contracts commit the bundled ABI was generated from. */
export const CACHE_MANAGER_AUTOMATION_ABI_SOURCE_COMMIT =
  cacheManagerAutomationArtifact._source.commit;
