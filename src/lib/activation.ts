/**
 * Activation domain types + presentation helpers for the Stylus activations
 * surface. Pure functions only: no network, no mocks. The shapes here mirror
 * the activation state exposed by the backend `CacheManagerAutomation` and
 * `ArbWasm` precompile (see `programTimeLeft`, `ActivationPerformed`,
 * `ActivationError`, `ContractAutoActivateUpdated`,
 * `ContractMaxActivationCostUpdated`), but consumers receive already-derived
 * `ActivationInfo` so the UI shells stay decoupled from the data source.
 */

import { formatEther } from 'viem';
import type { ActivationHistoryItem } from '@/services/contractService';

const DAY = 86_400;
const HOUR = 3_600;

/**
 * 14 days — once a program has less than this window left we mark it as
 * `expiring` so users have time to react before it falls back to inactive.
 */
export const EXPIRING_THRESHOLD_SECONDS = 14 * DAY;

export type ActivationStatus =
  | 'active'
  | 'expiring'
  | 'inactive'
  | 'unknown'
  | 'error';

/**
 * Narrower description of *why* a contract is currently inactive, surfaced as
 * a badge sublabel. Doesn't affect the 5-state filter contract.
 */
export type ActivationDetail =
  | 'never_activated'
  | 'expired'
  | 'needs_upgrade';

export interface ActivationInfo {
  status: ActivationStatus;
  /**
   * `null` when we have no `programTimeLeft` reading yet — e.g. backend
   * persisted `active` but the on-chain read hasn't returned. Distinct from
   * `0`, which means "the precompile answered and the program is not
   * executable right now". Consumers must not coerce `null` to `0`.
   */
  secondsRemaining: number | null;
  lastActivatedAt: string | null;
  detail?: ActivationDetail;
}

/**
 * Inputs to {@link getEffectiveActivationStatus} — kept narrow so any contract
 * shape that carries `activationStatus` can be fed in (Contract, UserContract,
 * row drafts, etc.).
 */
export interface ActivationStatusInput {
  activationStatus?: string | null;
}

/**
 * Resolve the effective activation status for a contract by combining the
 * backend-persisted `activationStatus` ('unknown' | 'active' | 'error') with
 * the on-chain `programTimeLeft` reading.
 *
 * - `error` from the backend trumps everything (the worker saw the activation
 *   tx fail and that's the truth until the next activation attempt).
 * - When `programTimeLeft` is missing (list endpoints pre-COB-490, RPC error,
 *   or contract never activated) we fall back to the persisted status.
 * - `programTimeLeft <= 0` → `inactive`; below the expiring threshold →
 *   `expiring`; otherwise `active`.
 */
export function getEffectiveActivationStatus(
  contract: ActivationStatusInput,
  programTimeLeftSeconds: number | null | undefined
): ActivationStatus {
  const persisted = contract.activationStatus;
  if (persisted === 'error') return 'error';

  // `NaN` slips past `<= 0` and `< threshold` and would otherwise return
  // `'active'` — treat any non-finite value the same as "no answer yet".
  const hasReading =
    programTimeLeftSeconds != null && Number.isFinite(programTimeLeftSeconds);

  if (!hasReading) {
    if (persisted === 'active') return 'active';
    return 'unknown';
  }

  if (programTimeLeftSeconds <= 0) return 'inactive';
  if (programTimeLeftSeconds < EXPIRING_THRESHOLD_SECONDS) return 'expiring';
  return 'active';
}

/**
 * Backend ships `programTimeLeft` as `string | null`. Defensive against
 * malformed values that would otherwise short-circuit downstream consumers
 * and pin the row/tab to "Inactive":
 * - whitespace-only strings (`Number(' ') === 0`),
 * - empty strings,
 * - non-numeric strings,
 * - negative numbers (the precompile returns `uint64`, anything < 0 is
 *   garbage from the backend).
 *
 * Returns parsed seconds when usable, otherwise `null` ("no backend
 * reading — fall back to the on-chain multicall").
 */
export function backendProgramTimeLeft(
  raw: string | null | undefined
): number | null {
  const value = raw?.trim();
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Narrow shape needed to feed `buildActivationInfo` — kept minimal so any
 * contract-like object (Contract, UserContract, row draft) can be passed
 * without importing the wider domain type.
 */
export interface ActivationInfoInput extends ActivationStatusInput {
  lastActivationTimestamp?: string | null;
}

/**
 * `ProgramReason` (from `useProgramTimeLeft`) and `ActivationDetail` share
 * the same string union deliberately — the two domains stay decoupled but
 * a value from one can be passed to the other without an identity map.
 * Consumers should keep the alignment when either union changes.
 */
type ProgramReasonLike = ActivationDetail;

/**
 * Compose an {@link ActivationInfo} from a contract + a `programTimeLeft`
 * reading. Both the contracts table and the ContractDetails Activation tab
 * feed this so their status badges stay in lockstep.
 */
export function buildActivationInfo(
  contract: ActivationInfoInput,
  programTimeLeftSeconds: number | null,
  reason: ProgramReasonLike | undefined
): ActivationInfo {
  const status = getEffectiveActivationStatus(contract, programTimeLeftSeconds);
  return {
    status,
    secondsRemaining: programTimeLeftSeconds,
    lastActivatedAt: contract.lastActivationTimestamp ?? null,
    detail: reason,
  };
}

export interface ActivationEvent {
  id: string;
  date: string;
  status: 'success' | 'error';
  txHash: string;
  /**
   * ETH string formatted for display. Empty string on `error` events —
   * the tx reverted so nothing was spent. `''` (not `'0'`) so downstream
   * renders can distinguish "no value" from "explicit zero".
   */
  valueConsumedEth: string;
  /**
   * Present, kept for compatibility with the not-yet-shipped unified
   * history tab (COB-497). The backend does not currently index gas per
   * activation event so activation-only consumers get `''`.
   */
  gasUsed: string;
  /**
   * On-chain revert reason for `error` events. Empty for successful
   * activations.
   */
  note?: string;
}

/**
 * Backend event → UI event shape. Wei-denominated `spent` becomes an
 * `ether`-formatted string; anything the backend does not populate becomes
 * an empty string so consumers can render a stable table without null
 * gymnastics.
 */
export function activationHistoryItemToEvent(
  item: ActivationHistoryItem
): ActivationEvent {
  const isSuccess = item.eventType === 'ActivationPerformed';
  const spentEth =
    isSuccess && item.spent != null && item.spent !== ''
      ? formatEther(BigInt(item.spent))
      : '';
  return {
    id: item.transactionHash,
    date: item.timestamp,
    status: isSuccess ? 'success' : 'error',
    txHash: item.transactionHash,
    valueConsumedEth: spentEth,
    gasUsed: '',
    note: isSuccess ? undefined : item.reason,
  };
}

export interface CacheEvent {
  id: string;
  date: string;
  type: 'cached' | 'evicted' | 'bid_placed';
  description: string;
  txHash?: string;
}

export const DEFAULT_AUTO_ACTIVATION = {
  enabled: false,
  maxActivationCostEth: 0.005,
};

export function humanizeActivationTime(info: ActivationInfo): string {
  if (info.status === 'inactive') return 'Inactive';
  if (info.status === 'unknown') return 'Status unknown';
  if (info.status === 'error') return 'Activation failed';
  if (info.secondsRemaining == null) return '—';
  if (info.secondsRemaining <= 0) return 'Inactive';
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
  if (info.status === 'unknown') return 'Unknown';
  if (info.status === 'error') return 'Activation failed';
  const suffix =
    info.secondsRemaining != null ? ` · ${humanizeActivationTime(info)}` : '';
  if (info.status === 'expiring') return `Expiring${suffix}`;
  return `Active${suffix}`;
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate).getTime();
  if (Number.isNaN(date)) return isoDate;
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / 60);
    return `${m} min${m === 1 ? '' : 's'} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  const d = Math.floor(diff / DAY);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  const months = Math.floor(d / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function activationStatusLabel(info: ActivationInfo): string {
  switch (info.status) {
    case 'inactive':
      return 'Inactive';
    case 'expiring':
      return 'Expiring';
    case 'unknown':
      return 'Unknown';
    case 'error':
      return 'Error';
    case 'active':
    default:
      return 'Active';
  }
}

export function activationSubLabel(info: ActivationInfo): string {
  if (info.status === 'inactive') {
    switch (info.detail) {
      case 'never_activated':
        return 'Activation required';
      case 'expired':
        return 'Activation expired';
      case 'needs_upgrade':
        return 'Needs upgrade to current Stylus version';
      default:
        return 'Reactivation required';
    }
  }
  if (info.status === 'unknown') return 'Status not yet known';
  if (info.status === 'error') return 'Last activation failed';
  // active / expiring: only show the countdown when we actually have a
  // reading. Falling back to `humanizeActivationTime`'s "Inactive" branch
  // when seconds are missing would render "expires in Inactive".
  if (info.secondsRemaining == null) {
    return info.status === 'expiring' ? 'Expiring soon' : 'Currently active';
  }
  const remaining = humanizeActivationTime(info);
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
      return 'bg-red-500';
    case 'error':
      return 'bg-red-600';
    case 'unknown':
    default:
      return 'bg-gray-500';
  }
}

export function activationTextClass(status: ActivationStatus): string {
  switch (status) {
    case 'active':
      return 'text-green-400';
    case 'expiring':
      return 'text-amber-300';
    case 'inactive':
      return 'text-red-400';
    case 'error':
      return 'text-red-500';
    case 'unknown':
    default:
      return 'text-gray-400';
  }
}
