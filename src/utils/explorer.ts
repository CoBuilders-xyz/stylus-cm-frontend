/**
 * Block-explorer URL helpers.
 *
 * The app currently only supports Arbiscan (Arbitrum One + Sepolia). Any
 * other chain configured in the backend / selector (Superposition,
 * Arbitrum Local, etc.) intentionally returns `null` so callers can render
 * the link as disabled instead of pointing at an explorer that does not
 * exist. When another explorer is added, extend `EXPLORER_BASE` here — that
 * is the only place that needs to change.
 */

const EXPLORER_BASE: Record<number, string> = {
  42161: 'https://arbiscan.io',
  421614: 'https://sepolia.arbiscan.io',
};

type ChainIdInput = number | string | null | undefined;

function normalizeChainId(chainId: ChainIdInput): number | null {
  if (chainId == null) return null;
  const id = typeof chainId === 'string' ? Number(chainId) : chainId;
  return Number.isFinite(id) ? id : null;
}

/** Base explorer origin for a chain, or `null` if unsupported. */
export function explorerBaseUrl(chainId: ChainIdInput): string | null {
  const id = normalizeChainId(chainId);
  return id != null ? (EXPLORER_BASE[id] ?? null) : null;
}

/** Full explorer URL for a transaction hash, or `null` if unsupported. */
export function explorerTxUrl(
  chainId: ChainIdInput,
  hash: string
): string | null {
  const base = explorerBaseUrl(chainId);
  return base ? `${base}/tx/${hash}` : null;
}

/** Full explorer URL for a contract/account address, or `null` if unsupported. */
export function explorerAddressUrl(
  chainId: ChainIdInput,
  address: string
): string | null {
  const base = explorerBaseUrl(chainId);
  return base ? `${base}/address/${address}` : null;
}
