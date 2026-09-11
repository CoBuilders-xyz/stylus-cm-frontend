import { describe, expect, it } from 'vitest';
import {
  decodeAbiParameters,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  getAddress,
  toFunctionSelector,
  type Hex,
} from 'viem';
import { CACHE_MANAGER_AUTOMATION_ABI } from '@/config/abis/cacheManagerAutomation/cacheManagerAutomation';
import { findCMAContractConfig, type CMAContractConfig } from '@/lib/cma';

/**
 * Positional decoding regression tests for CMA v2.0.
 *
 * The return data below is encoded from an *independent* parameter list
 * (not the ABI under test) so a wrong component order in the ABI cannot
 * cancel itself out. Every fixture uses distinct values for `maxBid`,
 * `maxActivationCost`, and the two flags, so any swap shows up.
 */

// viem returns checksummed addresses from every decode, so fixtures are
// checksummed too. All-digit addresses below are their own checksum.
const USER_A = getAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
const USER_B = getAddress('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
const CONTRACT_1 = '0x1111111111111111111111111111111111111111' as const;
const CONTRACT_2 = '0x2222222222222222222222222222222222222222' as const;
const CONTRACT_3 = '0x3333333333333333333333333333333333333333' as const;

/** Bidding on, activation off. */
const CONFIG_1: CMAContractConfig = {
  contractAddress: CONTRACT_1,
  biddingEnabled: true,
  autoActivate: false,
  maxBid: BigInt(1_000_001),
  maxActivationCost: BigInt(7_777),
};
/** Bidding off, activation on. */
const CONFIG_2: CMAContractConfig = {
  contractAddress: CONTRACT_2,
  biddingEnabled: false,
  autoActivate: true,
  maxBid: BigInt(42),
  maxActivationCost: BigInt(123_456_789),
};
/** Both off, zero cost. */
const CONFIG_3: CMAContractConfig = {
  contractAddress: CONTRACT_3,
  biddingEnabled: false,
  autoActivate: false,
  maxBid: BigInt(5),
  maxActivationCost: BigInt(0),
};

/** v2.0 on-chain layout, written out by hand. */
const V2_CONFIG_TYPE = {
  type: 'tuple',
  components: [
    { name: 'contractAddress', type: 'address' },
    { name: 'biddingEnabled', type: 'bool' },
    { name: 'autoActivate', type: 'bool' },
    { name: 'maxBid', type: 'uint256' },
    { name: 'maxActivationCost', type: 'uint256' },
  ],
} as const;

/** v1 layout — what the old ABI decoded. Used only to prove sensitivity. */
const V1_CONFIG_TYPE = {
  type: 'tuple',
  components: [
    { name: 'contractAddress', type: 'address' },
    { name: 'maxBid', type: 'uint256' },
    { name: 'enabled', type: 'bool' },
    { name: 'autoActivate', type: 'bool' },
    { name: 'maxActivationCost', type: 'uint256' },
  ],
} as const;

const V2_USER_DATA_TYPE = {
  type: 'tuple',
  components: [
    { name: 'user', type: 'address' },
    { name: 'contracts', ...V2_CONFIG_TYPE, type: 'tuple[]' },
  ],
} as const;

function encodeV2Configs(configs: CMAContractConfig[]): Hex {
  return encodeAbiParameters([{ ...V2_CONFIG_TYPE, type: 'tuple[]' }], [configs]);
}

function expectConfig(actual: unknown, expected: CMAContractConfig) {
  expect(actual).toEqual(expected);
}

describe('getUserContracts decoding', () => {
  it('maps every v2.0 field by position', () => {
    const data = encodeV2Configs([CONFIG_1, CONFIG_2, CONFIG_3]);
    const decoded = decodeFunctionResult({
      abi: CACHE_MANAGER_AUTOMATION_ABI,
      functionName: 'getUserContracts',
      data,
    }) as readonly CMAContractConfig[];

    expect(decoded).toHaveLength(3);
    expectConfig(decoded[0], CONFIG_1);
    expectConfig(decoded[1], CONFIG_2);
    expectConfig(decoded[2], CONFIG_3);
    // Distinct numeric fields cannot have been swapped.
    expect(decoded[0].maxBid).not.toBe(decoded[0].maxActivationCost);
    expect(decoded[1].biddingEnabled).not.toBe(decoded[1].autoActivate);
  });

  it('fails loudly or garbles under the stale v1 layout', () => {
    // Sensitivity check for this suite: the v1 tuple order reads the
    // `maxBid` word into the `autoActivate` bool slot. A real bid amount
    // is not 0/1, so viem throws...
    expect(() =>
      decodeAbiParameters(
        [{ ...V1_CONFIG_TYPE, type: 'tuple[]' }],
        encodeV2Configs([CONFIG_1])
      )
    ).toThrow();

    // ...and a bid of exactly 1 wei decodes without error into wrong
    // values: `maxBid` becomes the `biddingEnabled` flag and
    // `autoActivate` becomes the bid. Either way a stale ABI is caught.
    const oneWeiBid: CMAContractConfig = {
      ...CONFIG_3,
      biddingEnabled: true,
      autoActivate: false,
      maxBid: BigInt(1),
      maxActivationCost: BigInt(99),
    };
    const [v1] = decodeAbiParameters(
      [{ ...V1_CONFIG_TYPE, type: 'tuple[]' }],
      encodeV2Configs([oneWeiBid])
    );
    expect(v1[0].maxBid).toBe(BigInt(1)); // biddingEnabled === true, not the bid
    expect(v1[0].enabled).toBe(false); // actually autoActivate
    expect(v1[0].autoActivate).toBe(true); // actually maxBid === 1
    expect(v1[0].maxActivationCost).toBe(BigInt(99));
  });

  it('decodes an empty registry', () => {
    const decoded = decodeFunctionResult({
      abi: CACHE_MANAGER_AUTOMATION_ABI,
      functionName: 'getUserContracts',
      data: encodeV2Configs([]),
    });
    expect(decoded).toEqual([]);
  });
});

describe('userContracts(address,uint256) getter decoding', () => {
  it('returns the five v2.0 fields in order', () => {
    const data = encodeAbiParameters(V2_CONFIG_TYPE.components, [
      CONFIG_2.contractAddress,
      CONFIG_2.biddingEnabled,
      CONFIG_2.autoActivate,
      CONFIG_2.maxBid,
      CONFIG_2.maxActivationCost,
    ]);
    const decoded = decodeFunctionResult({
      abi: CACHE_MANAGER_AUTOMATION_ABI,
      functionName: 'userContracts',
      data,
    });
    expect(decoded).toEqual([
      CONFIG_2.contractAddress,
      CONFIG_2.biddingEnabled,
      CONFIG_2.autoActivate,
      CONFIG_2.maxBid,
      CONFIG_2.maxActivationCost,
    ]);
  });
});

describe('getContracts / getContractsPaginated decoding', () => {
  const userData = [
    { user: USER_A, contracts: [CONFIG_1, CONFIG_2] },
    { user: USER_B, contracts: [CONFIG_3] },
  ];

  it('getContracts nests ContractConfig[] per user', () => {
    const data = encodeAbiParameters(
      [{ ...V2_USER_DATA_TYPE, type: 'tuple[]' }],
      [userData]
    );
    const decoded = decodeFunctionResult({
      abi: CACHE_MANAGER_AUTOMATION_ABI,
      functionName: 'getContracts',
      data,
    });
    expect(decoded).toEqual(userData);
  });

  it('getContractsPaginated returns [userData, hasMore]', () => {
    const data = encodeAbiParameters(
      [{ ...V2_USER_DATA_TYPE, type: 'tuple[]' }, { type: 'bool' }],
      [userData, true]
    );
    const decoded = decodeFunctionResult({
      abi: CACHE_MANAGER_AUTOMATION_ABI,
      functionName: 'getContractsPaginated',
      data,
    });
    expect(decoded).toEqual([userData, true]);
  });
});

describe('insertContract / updateContract calldata', () => {
  const args = [
    CONTRACT_1,
    CONFIG_1.maxBid,
    CONFIG_1.biddingEnabled,
    CONFIG_1.autoActivate,
    CONFIG_1.maxActivationCost,
  ] as const;

  it.each(['insertContract', 'updateContract'] as const)(
    '%s encodes (_contract, _maxBid, _biddingEnabled, _autoActivate, _maxActivationCost)',
    (functionName) => {
      const data = encodeFunctionData({
        abi: CACHE_MANAGER_AUTOMATION_ABI,
        functionName,
        args,
      });
      expect(data.slice(0, 10)).toBe(
        toFunctionSelector(
          `${functionName}(address,uint256,bool,bool,uint256)`
        )
      );
      const decoded = decodeAbiParameters(
        [
          { type: 'address' },
          { type: 'uint256' },
          { type: 'bool' },
          { type: 'bool' },
          { type: 'uint256' },
        ],
        `0x${data.slice(10)}`
      );
      expect(decoded).toEqual([
        CONTRACT_1,
        BigInt(1_000_001), // _maxBid
        true, // _biddingEnabled
        false, // _autoActivate
        BigInt(7_777), // _maxActivationCost
      ]);
    }
  );
});

describe('findCMAContractConfig', () => {
  const registry = [CONFIG_1, CONFIG_2];

  it('returns undefined while the read is unresolved', () => {
    expect(findCMAContractConfig(undefined, CONTRACT_1)).toBeUndefined();
    expect(findCMAContractConfig(null, CONTRACT_1)).toBeUndefined();
  });

  it('returns null when the contract address is missing or unregistered', () => {
    expect(findCMAContractConfig(registry, undefined)).toBeNull();
    expect(findCMAContractConfig(registry, CONTRACT_3)).toBeNull();
    expect(findCMAContractConfig([], CONTRACT_1)).toBeNull();
  });

  it('matches case-insensitively and copies the v2.0 fields', () => {
    const found = findCMAContractConfig(registry, CONTRACT_2.toUpperCase());
    expect(found).toEqual(CONFIG_2);
    expect(found).not.toBe(CONFIG_2);
    expect(found?.biddingEnabled).toBe(false);
    expect(found?.autoActivate).toBe(true);
    expect(found?.maxBid).toBe(BigInt(42));
    expect(found?.maxActivationCost).toBe(BigInt(123_456_789));
  });

  it('round-trips from raw getUserContracts bytes', () => {
    const decoded = decodeFunctionResult({
      abi: CACHE_MANAGER_AUTOMATION_ABI,
      functionName: 'getUserContracts',
      data: encodeV2Configs([CONFIG_3, CONFIG_1]),
    }) as readonly CMAContractConfig[];
    expect(findCMAContractConfig(decoded, CONTRACT_1)).toEqual(CONFIG_1);
    expect(findCMAContractConfig(decoded, CONTRACT_3)).toEqual(CONFIG_3);
  });
});
