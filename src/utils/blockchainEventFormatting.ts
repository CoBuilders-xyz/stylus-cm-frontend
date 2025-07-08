import { BlockchainEventType } from '../types/blockchainEvents';

/**
 * Truncate transaction hash for display
 * @param hash Full transaction hash
 * @param startLength Characters to show at start (default: 6)
 * @param endLength Characters to show at end (default: 4)
 * @returns Truncated hash with ellipsis
 */
export const formatTransactionHash = (
  hash: string,
  startLength: number = 6,
  endLength: number = 4
): string => {
  if (!hash || hash.length <= startLength + endLength + 3) return hash;
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
};

/**
 * Truncate contract address for display
 * @param address Full contract address
 * @param startLength Characters to show at start (default: 6)
 * @param endLength Characters to show at end (default: 4)
 * @returns Truncated address with ellipsis
 */
export const formatContractAddress = (
  address: string,
  startLength: number = 6,
  endLength: number = 4
): string => {
  if (!address || address.length <= startLength + endLength + 3) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * Format timestamp for blockchain events
 * @param timestamp ISO timestamp string
 * @returns Formatted date and time
 */
export const formatEventTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param timestamp ISO timestamp string
 * @returns Relative time string
 */
export const formatRelativeTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    // For longer periods, just return the formatted date
    return formatEventTimestamp(timestamp);
  } catch {
    return timestamp;
  }
};

/**
 * Get event type badge variant based on event type
 * @param eventType The blockchain event type
 * @returns Badge variant for styling
 */
export const getEventTypeBadgeVariant = (eventType: string) => {
  switch (eventType) {
    case BlockchainEventType.INSERT:
      return 'default'; // Green-ish for inserts
    case BlockchainEventType.DELETE:
      return 'destructive'; // Red-ish for deletes
    default:
      return 'secondary';
  }
};

/**
 * Format event type for display
 * @param eventType Raw event type from backend
 * @returns Formatted event type
 */
export const formatEventType = (eventType: string): string => {
  switch (eventType) {
    case BlockchainEventType.INSERT:
      return 'Insert';
    case BlockchainEventType.DELETE:
      return 'Delete';
    default:
      return eventType;
  }
};

/**
 * Format block number with thousands separator
 * @param blockNumber Block number
 * @returns Formatted block number
 */
export const formatBlockNumber = (blockNumber: number): string => {
  return blockNumber.toLocaleString();
};

/**
 * Extract contract address from event data
 * Assumes the second element (index 1) of eventData array contains the contract address
 * @param eventData Event data array
 * @returns Contract address or empty string
 */
export const getContractAddressFromEventData = (
  eventData: Record<string, unknown>
): string => {
  // Event data is typically an array, contract address is usually at index 1
  if (Array.isArray(eventData) && eventData.length > 1) {
    return eventData[1] || '';
  }
  return '';
};

/**
 * Extract bid amount from event data
 * Assumes the third element (index 2) of eventData array contains the bid amount
 * @param eventData Event data array
 * @returns Bid amount or empty string
 */
export const getBidAmountFromEventData = (
  eventData: Record<string, unknown>
): string => {
  // Bid amount is typically at index 2
  if (Array.isArray(eventData) && eventData.length > 2) {
    return eventData[2] || '';
  }
  return '';
};

/**
 * Extract bytecode size from event data
 * Assumes the fourth element (index 3) of eventData array contains the size
 * @param eventData Event data array
 * @returns Size or empty string
 */
export const getSizeFromEventData = (
  eventData: Record<string, unknown>
): string => {
  // Size is typically at index 3
  if (Array.isArray(eventData) && eventData.length > 3) {
    return eventData[3] || '';
  }
  return '';
};

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @returns Promise that resolves when text is copied
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};
