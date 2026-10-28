import { describe, expect, it } from 'vitest';
import type { AbiEvent, AbiFunction, AbiParameter } from 'viem';
import cacheManagerAutomationArtifact from './CacheManagerAutomation.json';
import {
  CACHE_MANAGER_AUTOMATION_ABI,
  CACHE_MANAGER_AUTOMATION_ABI_SOURCE_COMMIT,
} from './cacheManagerAutomation';

/**
 * Shape guards for the CMA v2.0 ABI. These lock the parts of the ABI the
 * frontend depends on positionally, so a stale or hand-edited ABI fails
 * here instead of silently decoding `maxBid` into a boolean at runtime.
 */

const CONTRACT_CONFIG_LAYOUT = [
  ['contractAddress', 'address'],
  ['biddingEnabled', 'bool'],
  ['autoActivate', 'bool'],
  ['maxBid', 'uint256'],
  ['maxActivationCost', 'uint256'],
] as const;

const WRITE_INPUT_LAYOUT = [
  ['_contract', 'address'],
  ['_maxBid', 'uint256'],
  ['_biddingEnabled', 'bool'],
  ['_autoActivate', 'bool'],
  ['_maxActivationCost', 'uint256'],
] as const;

const OBSOLETE_EVENTS = [
  'BidAttempted',
  'BidDetails',
  'ContractOperationPerformed',
  'DebugBidCheck',
  'DebugMinBidFetch',
  'MinBidCheck',
  'UpkeepPerformed',
  'UserBalanceOperation',
  'Paused',
  'Unpaused',
];

function fn(name: string): AbiFunction {
  const match = CACHE_MANAGER_AUTOMATION_ABI.find(
    (item): item is AbiFunction => item.type === 'function' && item.name === name
  );
  if (!match) throw new Error(`function ${name} missing from ABI`);
  return match;
}

function event(name: string): AbiEvent | undefined {
  return CACHE_MANAGER_AUTOMATION_ABI.find(
    (item): item is AbiEvent => item.type === 'event' && item.name === name
  );
}

function layoutOf(params: readonly AbiParameter[]): Array<[string, string]> {
  return params.map((p) => [p.name ?? '', p.type]);
}

function componentsOf(param: AbiParameter): readonly AbiParameter[] {
  if (!('components' in param) || param.components == null) {
    throw new Error(`parameter ${param.name ?? param.type} has no components`);
  }
  return param.components;
}

describe('CacheManagerAutomation ABI (v2.0)', () => {
  it('re-exports the JSON artifact as the single source', () => {
    expect(CACHE_MANAGER_AUTOMATION_ABI).toBe(cacheManagerAutomationArtifact.abi);
    expect(CACHE_MANAGER_AUTOMATION_ABI_SOURCE_COMMIT).toBe(
      '82f963ae45441c8c0a558735e876183370d7a7c9'
    );
    expect(cacheManagerAutomationArtifact.contractName).toBe(
      'CacheManagerAutomation'
    );
  });

  it('getUserContracts returns ContractConfig[] in the v2.0 order', () => {
    const [output] = fn('getUserContracts').outputs;
    expect(output.type).toBe('tuple[]');
    expect(layoutOf(componentsOf(output))).toEqual(CONTRACT_CONFIG_LAYOUT);
  });

  it('userContracts(address,uint256) getter returns the v2.0 order', () => {
    expect(layoutOf(fn('userContracts').outputs)).toEqual(
      CONTRACT_CONFIG_LAYOUT
    );
  });

  it('getContracts nests ContractConfig[] in the v2.0 order', () => {
    const [output] = fn('getContracts').outputs;
    expect(output.type).toBe('tuple[]');
    const [user, contracts] = componentsOf(output);
    expect([user.name, user.type]).toEqual(['user', 'address']);
    expect(contracts.type).toBe('tuple[]');
    expect(layoutOf(componentsOf(contracts))).toEqual(CONTRACT_CONFIG_LAYOUT);
  });

  it('getContractsPaginated returns (UserContractsData[], bool hasMore)', () => {
    const f = fn('getContractsPaginated');
    expect(layoutOf(f.inputs)).toEqual([
      ['offset', 'uint256'],
      ['limit', 'uint256'],
    ]);
    const [userData, hasMore] = f.outputs;
    expect([userData.name, userData.type]).toEqual(['userData', 'tuple[]']);
    expect([hasMore.name, hasMore.type]).toEqual(['hasMore', 'bool']);
    const [, contracts] = componentsOf(userData);
    expect(layoutOf(componentsOf(contracts))).toEqual(CONTRACT_CONFIG_LAYOUT);
  });

  it.each(['insertContract', 'updateContract'])(
    '%s keeps the v1 input order (_contract, _maxBid, _biddingEnabled, _autoActivate, _maxActivationCost)',
    (name) => {
      expect(layoutOf(fn(name).inputs)).toEqual(WRITE_INPUT_LAYOUT);
    }
  );

  it('insertContract is payable and updateContract is not', () => {
    expect(fn('insertContract').stateMutability).toBe('payable');
    expect(fn('updateContract').stateMutability).toBe('nonpayable');
  });

  it('exposes every function the frontend calls', () => {
    for (const name of [
      'getUserContracts',
      'minMaxBidAmount',
      'getUserBalance',
      'fundBalance',
      'withdrawBalance',
      'insertContract',
      'updateContract',
      'removeContract',
    ]) {
      expect(fn(name).name).toBe(name);
    }
  });

  it('declares ContractBiddingEnabledUpdated(user, contractAddress, biddingEnabled)', () => {
    const ev = event('ContractBiddingEnabledUpdated');
    expect(ev).toBeDefined();
    expect(
      ev!.inputs.map((i) => [i.name, i.type, i.indexed ?? false])
    ).toEqual([
      ['user', 'address', true],
      ['contractAddress', 'address', true],
      ['biddingEnabled', 'bool', false],
    ]);
  });

  it('keeps the v1 per-contract events still emitted by v2.0', () => {
    for (const name of [
      'ContractAdded',
      'ContractUpdated',
      'ContractRemoved',
      'ContractAutoActivateUpdated',
      'ContractMaxActivationCostUpdated',
      'BalanceUpdated',
    ]) {
      expect(event(name), name).toBeDefined();
    }
  });

  it('drops the obsolete v1 debug and pause events', () => {
    for (const name of OBSOLETE_EVENTS) {
      expect(event(name), name).toBeUndefined();
    }
  });

  it('does not carry a stale `enabled` component anywhere', () => {
    expect(JSON.stringify(CACHE_MANAGER_AUTOMATION_ABI)).not.toContain(
      '"name":"enabled"'
    );
  });
});
