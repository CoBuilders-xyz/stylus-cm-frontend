interface ProviderErrorLike {
  code?: number;
  name?: string;
  message?: string;
  cause?: unknown;
}

/**
 * Wallet providers wrap EIP-1193 errors differently. Walk the short cause
 * chain so a user rejection is recognised without exposing provider details.
 */
export function isUserRejectedRequest(error: unknown): boolean {
  let current: unknown = error;
  const visited = new Set<unknown>();

  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const providerError = current as ProviderErrorLike;
    const message = providerError.message?.toLowerCase() ?? '';

    if (
      providerError.code === 4001 ||
      providerError.name === 'UserRejectedRequestError' ||
      message.includes('user rejected') ||
      message.includes('user denied') ||
      message.includes('rejected the request')
    ) {
      return true;
    }

    current = providerError.cause;
  }

  return false;
}

export function getNetworkSwitchErrorMessage(
  error: unknown,
  networkName?: string
): string {
  if (isUserRejectedRequest(error)) {
    return networkName
      ? `Network switch cancelled. Your wallet was not switched to ${networkName}.`
      : 'Network switch cancelled. Your wallet remains on its current network.';
  }

  return networkName
    ? `Could not switch to ${networkName}. Try again from your wallet.`
    : 'Could not switch networks. Try again from your wallet.';
}
