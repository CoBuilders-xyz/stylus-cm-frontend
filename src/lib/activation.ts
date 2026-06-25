/**
 * Activation domain types + presentation helpers for the Stylus activations
 * surface. Pure functions only: no network, no mocks. The shapes here mirror
 * the activation state exposed by the backend `CacheManagerAutomation` and
 * `ArbWasm` precompile (see `programTimeLeft`, `ActivationPerformed`,
 * `ActivationError`, `ContractAutoActivateUpdated`,
 * `ContractMaxActivationCostUpdated`), but consumers receive already-derived
 * `ActivationInfo` so the UI shells stay decoupled from the data source.
 */

const DAY = 86_400;
const HOUR = 3_600;

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

export const DEFAULT_AUTO_ACTIVATION = {
  enabled: false,
  maxActivationCostEth: 0.005,
};

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
  if (info.status === 'expiring')
    return `Expiring · ${humanizeActivationTime(info)}`;
  return `Active · ${humanizeActivationTime(info)}`;
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
  if (info.status === 'inactive') return 'Inactive';
  if (info.status === 'expiring') return 'Expiring';
  return 'Active';
}

export function activationSubLabel(info: ActivationInfo): string {
  if (info.status === 'inactive') return 'Reactivation required';
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
