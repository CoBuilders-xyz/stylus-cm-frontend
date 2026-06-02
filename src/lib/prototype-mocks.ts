import {
  Blockchain,
  Contract,
  UserContract,
} from '@/services/contractService';
import { parseEther } from 'viem';
import type {
  BidAverageResponse,
  BidAverageTimespan,
  BidTrendsResponse,
  CacheStats,
  TotalBytecodes,
} from '@/services/cacheMetricsService';
import type {
  BlockchainEvent,
  BlockchainEventsResponse,
} from '@/types/blockchainEvents';
import { BlockchainEventType } from '@/types/blockchainEvents';

export type ActivationStatus = 'active' | 'expiring' | 'inactive';

export interface ActivationInfo {
  status: ActivationStatus;
  secondsRemaining: number;
  lastActivatedAt: string | null;
}

export interface ActivationEvent {
  id: string;
  date: string;
  status: 'success' | 'error';
  txHash: string;
  valueConsumedEth: string;
  gasUsed: string;
  note?: string;
}

export interface CacheEvent {
  id: string;
  date: string;
  type: 'cached' | 'evicted' | 'bid_placed';
  description: string;
  txHash?: string;
}

const MOCK_BLOCKCHAIN: Blockchain = {
  id: 'mock-blockchain-arb-sepolia',
  name: 'Arbitrum Sepolia',
  rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  cacheManagerAddress: '0x0000000000000000000000000000000000000001',
  cacheManagerAutomationAddress: '0x0000000000000000000000000000000000000002',
  arbWasmCacheAddress: '0x0000000000000000000000000000000000000003',
  chainId: 421614,
  otherInfo: null,
  lastSyncedBlock: 1_234_567,
  lastProcessedBlockNumber: 1_234_567,
};

export const MOCK_BLOCKCHAINS: Blockchain[] = [MOCK_BLOCKCHAIN];

const DAY = 86_400;
const HOUR = 3_600;
const isoMinusDays = (d: number) =>
  new Date(Date.now() - d * 86_400_000).toISOString();
const isoMinusHours = (h: number) =>
  new Date(Date.now() - h * 3_600_000).toISOString();

const wei = (eth: string) => parseEther(eth).toString();

interface MockContractSeed {
  id: string;
  address: string;
  name: string;
  bid: string; // in eth
  effectiveBid: string;
  minBid: string;
  totalInvestment: string;
  size: number;
  isCached: boolean;
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  bidAgeHours: number;
  activation: ActivationInfo;
}

const SEEDS: MockContractSeed[] = [
  {
    id: 'mock-1',
    address: '0xa1b2c3d4e5f6789012345678901234567890aaaa',
    name: 'Treasury Vault',
    bid: '0.0042',
    effectiveBid: '0.0038',
    minBid: '0.0021',
    totalInvestment: '0.085',
    size: 28_500,
    isCached: true,
    riskLevel: 'low',
    bidAgeHours: 72,
    activation: {
      status: 'active',
      secondsRemaining: 18 * DAY,
      lastActivatedAt: isoMinusDays(8),
    },
  },
  {
    id: 'mock-2',
    address: '0xa1b2c3d4e5f6789012345678901234567890bbbb',
    name: 'Order Book Engine',
    bid: '0.0051',
    effectiveBid: '0.0049',
    minBid: '0.0034',
    totalInvestment: '0.142',
    size: 42_100,
    isCached: false,
    riskLevel: 'medium',
    bidAgeHours: 6,
    activation: {
      status: 'active',
      secondsRemaining: 24 * DAY,
      lastActivatedAt: isoMinusDays(2),
    },
  },
  {
    id: 'mock-3',
    address: '0xa1b2c3d4e5f6789012345678901234567890cccc',
    name: 'Settlement Router',
    bid: '0.0029',
    effectiveBid: '0.0027',
    minBid: '0.0024',
    totalInvestment: '0.031',
    size: 18_700,
    isCached: false,
    riskLevel: 'high',
    bidAgeHours: 240,
    activation: {
      status: 'active',
      secondsRemaining: 27 * DAY,
      lastActivatedAt: isoMinusDays(3),
    },
  },
  {
    id: 'mock-4',
    address: '0xa1b2c3d4e5f6789012345678901234567890dddd',
    name: 'Yield Aggregator',
    bid: '0.0061',
    effectiveBid: '0.0055',
    minBid: '0.0040',
    totalInvestment: '0.221',
    size: 35_900,
    isCached: true,
    riskLevel: 'medium',
    bidAgeHours: 36,
    activation: {
      status: 'expiring',
      secondsRemaining: 3 * DAY + 4 * HOUR,
      lastActivatedAt: isoMinusDays(27),
    },
  },
  {
    id: 'mock-5',
    address: '0xa1b2c3d4e5f6789012345678901234567890eeee',
    name: 'Legacy Bridge',
    bid: '0.0033',
    effectiveBid: '0.0030',
    minBid: '0.0029',
    totalInvestment: '0.094',
    size: 21_400,
    isCached: true,
    riskLevel: 'high',
    bidAgeHours: 480,
    activation: {
      status: 'inactive',
      secondsRemaining: 0,
      lastActivatedAt: isoMinusDays(34),
    },
  },
  {
    id: 'mock-6',
    address: '0xa1b2c3d4e5f6789012345678901234567890ffff',
    name: 'Oracle Reader',
    bid: '0.0017',
    effectiveBid: '0.0015',
    minBid: '0.0014',
    totalInvestment: '0.022',
    size: 12_300,
    isCached: false,
    riskLevel: 'high',
    bidAgeHours: 720,
    activation: {
      status: 'inactive',
      secondsRemaining: 0,
      lastActivatedAt: isoMinusDays(45),
    },
  },
  {
    id: 'mock-7',
    address: '0xa1b2c3d4e5f6789012345678901234567890a1a1',
    name: 'Perp Margining',
    bid: '0.0045',
    effectiveBid: '0.0041',
    minBid: '0.0026',
    totalInvestment: '0.118',
    size: 31_200,
    isCached: true,
    riskLevel: 'low',
    bidAgeHours: 12,
    activation: {
      status: 'expiring',
      secondsRemaining: 18 * HOUR,
      lastActivatedAt: isoMinusDays(29),
    },
  },
];

function buildContract(seed: MockContractSeed): Contract {
  const bidTimestamp = isoMinusHours(seed.bidAgeHours);
  const bidPlusDecay = wei(seed.bid);

  return {
    id: seed.id,
    address: seed.address,
    lastBid: wei(seed.bid),
    bidPlusDecay,
    totalBidInvestment: wei(seed.totalInvestment),
    bidBlockNumber: '1234500',
    bidBlockTimestamp: bidTimestamp,
    bytecode: {
      id: `bytecode-${seed.id}`,
      bytecodeHash: `0xhash${seed.id}`,
      size: String(seed.size),
      lastBid: wei(seed.bid),
      bidPlusDecay,
      lastEvictionBid: wei('0.001'),
      isCached: seed.isCached,
      totalBidInvestment: wei(seed.totalInvestment),
      bidBlockNumber: '1234500',
      bidBlockTimestamp: bidTimestamp,
    },
    blockchain: MOCK_BLOCKCHAIN,
    effectiveBid: wei(seed.effectiveBid),
    evictionRisk: {
      riskLevel: seed.riskLevel,
      remainingEffectiveBid: wei(seed.effectiveBid),
      suggestedBids: {
        highRisk: wei('0.0030'),
        midRisk: wei('0.0045'),
        lowRisk: wei('0.0060'),
      },
      comparisonPercentages: {
        vsHighRisk: 120,
        vsMidRisk: 95,
        vsLowRisk: 70,
      },
      cacheStats: {
        utilization: 78,
        evictionRate: 0.04,
        medianBidPerByte: '1500000',
        competitiveness: 62,
        cacheSizeBytes: '8388608',
        usedCacheSizeBytes: '6553600',
      },
    },
    minBid: wei(seed.minBid),
    maxBid: wei((Number(seed.bid) * 1.5).toFixed(4)),
    isAutomated: seed.id === 'mock-2' || seed.id === 'mock-4',
    name: seed.name,
    userContractId: seed.id,
    isSavedByUser: true,
    savedContractName: seed.name,
    alerts: [],
    activation: seed.activation,
    biddingHistory: [
      {
        bytecodeHash: `0xhash${seed.id}`,
        contractAddress: seed.address,
        bid: wei(seed.bid),
        actualBid: wei(seed.bid),
        size: String(seed.size),
        timestamp: bidTimestamp,
        blockNumber: '1234500',
        transactionHash: `0xbidtx${seed.id}`,
        originAddress: '0xabc1234567890abcdef1234567890abcdef12345',
        isAutomated: seed.id === 'mock-2' || seed.id === 'mock-4',
      },
    ],
  } as Contract & { activation: ActivationInfo };
}

export const mockContracts: Contract[] = SEEDS.map(buildContract);

export const mockUserContracts: UserContract[] = mockContracts.map(
  (contract) => ({
    id: contract.id,
    address: contract.address,
    name: contract.name || '',
    blockchain: MOCK_BLOCKCHAIN,
    contract,
    alerts: [],
  })
);

export const mockActivationHistory: Record<string, ActivationEvent[]> = {
  'mock-1': [
    {
      id: 'evt-1-1',
      date: isoMinusDays(8),
      status: 'success',
      txHash: '0xactivate11abcdef0000000000000000000000000000000000000000000000aa',
      valueConsumedEth: '0.0012',
      gasUsed: '142000',
    },
    {
      id: 'evt-1-2',
      date: isoMinusDays(38),
      status: 'success',
      txHash: '0xactivate12abcdef0000000000000000000000000000000000000000000000bb',
      valueConsumedEth: '0.0014',
      gasUsed: '139500',
    },
  ],
  'mock-2': [
    {
      id: 'evt-2-1',
      date: isoMinusDays(2),
      status: 'success',
      txHash: '0xactivate21abcdef0000000000000000000000000000000000000000000000cc',
      valueConsumedEth: '0.0018',
      gasUsed: '156000',
    },
  ],
  'mock-3': [
    {
      id: 'evt-3-1',
      date: isoMinusDays(3),
      status: 'success',
      txHash: '0xactivate31abcdef0000000000000000000000000000000000000000000000dd',
      valueConsumedEth: '0.0010',
      gasUsed: '128000',
    },
    {
      id: 'evt-3-2',
      date: isoMinusDays(34),
      status: 'error',
      txHash: '0xactivate32abcdef0000000000000000000000000000000000000000000000ee',
      valueConsumedEth: '0.0000',
      gasUsed: '21000',
      note: 'Reverted: insufficient escrow balance',
    },
  ],
  'mock-4': [
    {
      id: 'evt-4-1',
      date: isoMinusDays(27),
      status: 'success',
      txHash: '0xactivate41abcdef0000000000000000000000000000000000000000000000ff',
      valueConsumedEth: '0.0021',
      gasUsed: '161000',
    },
    {
      id: 'evt-4-2',
      date: isoMinusDays(58),
      status: 'success',
      txHash: '0xactivate42abcdef000000000000000000000000000000000000000000000011',
      valueConsumedEth: '0.0019',
      gasUsed: '154300',
    },
  ],
  'mock-5': [
    {
      id: 'evt-5-1',
      date: isoMinusDays(34),
      status: 'success',
      txHash: '0xactivate51abcdef000000000000000000000000000000000000000000000022',
      valueConsumedEth: '0.0015',
      gasUsed: '144000',
    },
    {
      id: 'evt-5-2',
      date: isoMinusDays(64),
      status: 'error',
      txHash: '0xactivate52abcdef000000000000000000000000000000000000000000000033',
      valueConsumedEth: '0.0000',
      gasUsed: '21000',
      note: 'Reverted: program already expired',
    },
  ],
  'mock-6': [
    {
      id: 'evt-6-1',
      date: isoMinusDays(45),
      status: 'success',
      txHash: '0xactivate61abcdef000000000000000000000000000000000000000000000044',
      valueConsumedEth: '0.0011',
      gasUsed: '132000',
    },
  ],
  'mock-7': [
    {
      id: 'evt-7-1',
      date: isoMinusDays(29),
      status: 'success',
      txHash: '0xactivate71abcdef000000000000000000000000000000000000000000000055',
      valueConsumedEth: '0.0013',
      gasUsed: '141200',
    },
  ],
};

export const mockCacheEvents: Record<string, CacheEvent[]> = {
  'mock-1': [
    {
      id: 'cache-1-1',
      date: isoMinusDays(3),
      type: 'cached',
      description: 'Contract entered the cache after a winning bid.',
      txHash: '0xcache11',
    },
    {
      id: 'cache-1-2',
      date: isoMinusDays(7),
      type: 'bid_placed',
      description: 'Manual bid of 0.0042 ETH placed.',
      txHash: '0xcache12',
    },
  ],
  'mock-4': [
    {
      id: 'cache-4-1',
      date: isoMinusDays(2),
      type: 'cached',
      description: 'Re-entered the cache after eviction.',
      txHash: '0xcache41',
    },
    {
      id: 'cache-4-2',
      date: isoMinusDays(5),
      type: 'evicted',
      description: 'Evicted from cache due to higher competing bid.',
      txHash: '0xcache42',
    },
  ],
};

export interface MockAlertChannelConfig {
  telegram: boolean;
  slack: boolean;
  webhook: boolean;
}

export interface MockActivationAlertConfig {
  approachingExpiration: {
    enabled: boolean;
    thresholdDays: number;
    channels: MockAlertChannelConfig;
  };
  expired: { enabled: boolean; channels: MockAlertChannelConfig };
  autoActivationSucceeded: {
    enabled: boolean;
    channels: MockAlertChannelConfig;
  };
  autoActivationFailed: { enabled: boolean; channels: MockAlertChannelConfig };
}

export interface MockCacheAlertConfig {
  eviction: { enabled: boolean; channels: MockAlertChannelConfig };
  lowGas: {
    enabled: boolean;
    thresholdEth: number;
    channels: MockAlertChannelConfig;
  };
}

export interface MockSystemAlertConfig {
  maintenance: { enabled: boolean; channels: MockAlertChannelConfig };
}

export interface MockAlertSubscriptions {
  activation: MockActivationAlertConfig;
  cache: MockCacheAlertConfig;
  system: MockSystemAlertConfig;
}

export const mockAlertSubscriptions: MockAlertSubscriptions = {
  activation: {
    approachingExpiration: {
      enabled: true,
      thresholdDays: 7,
      channels: { telegram: true, slack: false, webhook: false },
    },
    expired: {
      enabled: false,
      channels: { telegram: false, slack: false, webhook: false },
    },
    autoActivationSucceeded: {
      enabled: true,
      channels: { telegram: false, slack: true, webhook: false },
    },
    autoActivationFailed: {
      enabled: true,
      channels: { telegram: true, slack: true, webhook: false },
    },
  },
  cache: {
    eviction: {
      enabled: true,
      channels: { telegram: true, slack: true, webhook: false },
    },
    lowGas: {
      enabled: false,
      thresholdEth: 0.05,
      channels: { telegram: false, slack: false, webhook: false },
    },
  },
  system: {
    maintenance: {
      enabled: false,
      channels: { telegram: false, slack: false, webhook: false },
    },
  },
};

export const MOCK_AUTO_ACTIVATION_DEFAULT = {
  enabled: false,
  maxActivationCostEth: 0.005,
};

export function getMockContractById(id: string): Contract | undefined {
  return mockContracts.find((c) => c.id === id);
}

export function getMockContractByAddress(
  address: string
): Contract | undefined {
  return mockContracts.find(
    (c) => c.address.toLowerCase() === address.toLowerCase()
  );
}

export function getMockUserContractById(id: string): UserContract | undefined {
  return mockUserContracts.find((uc) => uc.id === id);
}

export function getMockActivationHistory(
  contractId: string
): ActivationEvent[] {
  return mockActivationHistory[contractId] || [];
}

export function getMockCacheEvents(contractId: string): CacheEvent[] {
  return mockCacheEvents[contractId] || [];
}

export function getActivationInfo(contract: Contract): ActivationInfo {
  const c = contract as Contract & { activation?: ActivationInfo };
  return (
    c.activation ?? {
      status: 'active',
      secondsRemaining: 14 * DAY,
      lastActivatedAt: isoMinusDays(10),
    }
  );
}

export function setActivationInfo(
  contract: Contract,
  next: ActivationInfo
): void {
  (contract as Contract & { activation: ActivationInfo }).activation = next;
}

export function humanizeActivationTime(info: ActivationInfo): string {
  if (info.status === 'inactive' || info.secondsRemaining <= 0) {
    return 'Inactive';
  }
  const s = info.secondsRemaining;
  if (s >= DAY) {
    const days = Math.floor(s / DAY);
    return `in ${days} day${days === 1 ? '' : 's'}`;
  }
  if (s >= HOUR) {
    const hours = Math.floor(s / HOUR);
    return `in ${hours}h`;
  }
  const minutes = Math.max(1, Math.floor(s / 60));
  return `in ${minutes}m`;
}

export function activationLabel(info: ActivationInfo): string {
  if (info.status === 'inactive') return 'Inactive';
  if (info.status === 'expiring') return `Expiring · ${humanizeActivationTime(info)}`;
  return `Active · ${humanizeActivationTime(info)}`;
}

export function activationStatusLabel(info: ActivationInfo): string {
  if (info.status === 'inactive') return 'Inactive';
  if (info.status === 'expiring') return 'Expiring';
  return 'Active';
}

export function activationSubLabel(info: ActivationInfo): string {
  if (info.status === 'inactive') return 'Reactivation required';
  const remaining = humanizeActivationTime(info);
  // strip the leading "in "
  const tail = remaining.startsWith('in ') ? remaining.slice(3) : remaining;
  return `expires in ${tail}`;
}

export function activationDotClass(status: ActivationStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'expiring':
      return 'bg-amber-400';
    case 'inactive':
    default:
      return 'bg-red-500';
  }
}

export function activationTextClass(status: ActivationStatus): string {
  switch (status) {
    case 'active':
      return 'text-green-400';
    case 'expiring':
      return 'text-amber-300';
    case 'inactive':
    default:
      return 'text-red-400';
  }
}

export const PROTOTYPE_ACTIVATION_TOAST =
  'Activation simulated (prototype mode)';
export const PROTOTYPE_AUTO_ACTIVATION_TOAST =
  'Auto-activation settings saved (prototype mode)';
export const PROTOTYPE_ALERT_PREFERENCES_TOAST =
  'Alert preferences saved (prototype mode)';

// ---------------------------------------------------------------------------
// Cache metrics mocks (powers /cache-status and the bid charts)
// ---------------------------------------------------------------------------

export const mockTotalBytecodes: TotalBytecodes = {
  bytecodeCount: 1284,
  bytecodeCountDiffWithLastMonth: 142,
};

export const mockCacheStatsMetric: CacheStats = {
  queueSize: '8388608',
  cacheSize: '12582912',
  queueSizeMB: 8,
  cacheSizeMB: 12,
  cacheFilledPercentage: 67,
};

// Seeded pseudo-random generator so chart data is stable across renders.
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function bucketCount(timespan: BidAverageTimespan): number {
  switch (timespan) {
    case 'D':
      return 24;
    case 'W':
      return 7;
    case 'M':
      return 30;
    case 'Y':
      return 12;
  }
}

function periodLabel(timespan: BidAverageTimespan, idx: number, total: number) {
  const now = new Date();
  switch (timespan) {
    case 'D': {
      const d = new Date(now.getTime() - (total - 1 - idx) * 3_600_000);
      return d.toISOString();
    }
    case 'W': {
      const d = new Date(now.getTime() - (total - 1 - idx) * 86_400_000);
      return d.toISOString().slice(0, 10);
    }
    case 'M': {
      const d = new Date(now.getTime() - (total - 1 - idx) * 86_400_000);
      return d.toISOString().slice(0, 10);
    }
    case 'Y': {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - (total - 1 - idx),
        1
      );
      return d.toISOString().slice(0, 7);
    }
  }
}

export function buildMockBidAverage(
  timespan: BidAverageTimespan,
  minSize?: number
): BidAverageResponse {
  const buckets = bucketCount(timespan);
  // Tie pseudo-random seed to size band so each line is distinct but stable.
  const sizeKey = !minSize ? 1 : minSize < 800 ? 1 : minSize < 1600 ? 2 : 3;
  const baseEth = sizeKey === 1 ? 0.0024 : sizeKey === 2 ? 0.0041 : 0.0067;
  const rand = seededRand(sizeKey * 9973 + buckets);

  const periods = Array.from({ length: buckets }, (_, i) => {
    const wave =
      Math.sin((i / buckets) * Math.PI * 2 + sizeKey) * 0.18 +
      (rand() - 0.5) * 0.12;
    const eth = Math.max(0.0001, baseEth * (1 + wave));
    return {
      period: periodLabel(timespan, i, buckets),
      averageBid: parseEther(eth.toFixed(8)).toString(),
      parsedAverageBid: eth.toFixed(8),
      count: 12 + Math.floor(rand() * 30),
    };
  });

  const globalAvg =
    periods.reduce((acc, p) => acc + parseFloat(p.parsedAverageBid), 0) /
    periods.length;
  const totalCount = periods.reduce((acc, p) => acc + p.count, 0);

  return {
    periods,
    global: {
      averageBid: parseEther(globalAvg.toFixed(8)).toString(),
      parsedAverageBid: globalAvg.toFixed(8),
      count: totalCount,
    },
  };
}

export function buildMockBidTrends(
  timespan: BidAverageTimespan
): BidTrendsResponse {
  const buckets = bucketCount(timespan);
  const rand = seededRand(buckets * 31 + 7);
  const periods = Array.from({ length: buckets }, (_, i) => {
    const insertCount = 8 + Math.floor(rand() * 24);
    const deleteCount = 4 + Math.floor(rand() * 18);
    return {
      period: periodLabel(timespan, i, buckets),
      insertCount,
      deleteCount,
      netChange: insertCount - deleteCount,
    };
  });
  const globalInsert = periods.reduce((acc, p) => acc + p.insertCount, 0);
  const globalDelete = periods.reduce((acc, p) => acc + p.deleteCount, 0);
  return {
    periods,
    global: {
      insertCount: globalInsert,
      deleteCount: globalDelete,
      netChange: globalInsert - globalDelete,
    },
  };
}

// ---------------------------------------------------------------------------
// Blockchain events mocks (powers /blockchain-events)
// ---------------------------------------------------------------------------

const EVENT_CONTRACTS = mockContracts.slice(0, 5);

function buildEvents(): BlockchainEvent[] {
  const events: BlockchainEvent[] = [];
  const rand = seededRand(424242);
  for (let i = 0; i < 60; i++) {
    const contract = EVENT_CONTRACTS[i % EVENT_CONTRACTS.length];
    const isInsert = rand() > 0.45;
    const minutesAgo = i * 37 + Math.floor(rand() * 17);
    const blockTimestamp = new Date(
      Date.now() - minutesAgo * 60_000
    ).toISOString();
    events.push({
      id: `evt-${i}`,
      blockchainId: MOCK_BLOCKCHAINS[0].id,
      blockchainName: MOCK_BLOCKCHAINS[0].name,
      contractName: contract.name || contract.address,
      contractAddress: contract.address,
      eventName: isInsert ? 'InsertBid' : 'DeleteBid',
      blockTimestamp,
      blockNumber: 1_234_500 - i * 12,
      transactionHash:
        '0x' +
        (i.toString(16).padStart(4, '0') +
          'aa' +
          Math.floor(rand() * 1e10)
            .toString(16)
            .padStart(8, '0') +
          '0'.repeat(56)).slice(0, 64),
      logIndex: i % 8,
      isRealTime: i < 4,
      originAddress:
        i % 3 === 0
          ? '0xaaa1111111111111111111111111111111111111'
          : '0xbbb2222222222222222222222222222222222222',
      eventData: isInsert
        ? {
            bid: contract.lastBid,
            size: contract.bytecode.size,
          }
        : {
            evictedBid: contract.lastBid,
          },
    });
  }
  return events;
}

export const mockBlockchainEvents: BlockchainEvent[] = buildEvents();

export function buildMockEventsResponse(
  page: number,
  limit: number,
  eventType?: BlockchainEventType,
  search?: string
): BlockchainEventsResponse {
  let filtered = mockBlockchainEvents;
  if (eventType) {
    filtered = filtered.filter((e) => e.eventName === eventType);
  }
  if (search && search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.contractAddress.toLowerCase().includes(q) ||
        e.contractName.toLowerCase().includes(q) ||
        e.transactionHash.toLowerCase().includes(q)
    );
  }
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);
  return {
    data,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
