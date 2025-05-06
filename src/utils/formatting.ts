/**
 * Format utilities for displaying contract data
 */

/**
 * Format an Ethereum amount from Wei to ETH with readable formatting
 * @param wei Wei amount as string
 * @returns Formatted ETH amount with units
 */
export const formatEth = (wei: string): string => {
  // Convert Wei to ETH (1 ETH = 10^18 Wei)
  try {
    const weiNum = BigInt(wei);
    const ethValue = Number(weiNum) / 1e18;
    return ethValue.toFixed(6);
  } catch {
    return wei;
  }
};

/**
 * Format ETH value with rounding to significant figures
 * @param ethValue ETH amount as string or number
 * @param decimals Number of significant figures to show
 * @returns Formatted ETH amount with specified number of significant figures
 */
export const formatRoundedEth = (
  ethValue: string | number,
  decimals: number = 3
): string => {
  try {
    // Convert input to number if it's a string
    const value =
      typeof ethValue === 'string' ? parseFloat(ethValue) : ethValue;

    // Handle zero case
    if (value === 0) return '0';

    // Format to specified number of significant digits
    // For 123456 → show 123000
    // For 0.000451234 → show 0.000451
    const formattedValue = value.toPrecision(decimals);

    // Remove trailing zeros after decimal and unnecessary decimal point
    const cleanedValue = parseFloat(formattedValue).toString();

    return cleanedValue;
  } catch {
    return ethValue.toString();
  }
};

/**
 * Format a file size from bytes to appropriate units (B, KB, MB)
 * @param bytes Size in bytes as string
 * @returns Formatted size with units
 */
export const formatSize = (bytes: string): string => {
  const size = parseInt(bytes, 10);
  if (isNaN(size)) return bytes;

  if (size < 1024) return size + ' B';
  if (size < 1048576) return (size / 1024).toFixed(2) + ' KB';
  return (size / 1048576).toFixed(2) + ' MB';
};

/**
 * Format a date string to a localized date/time format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
};

/**
 * Convert eviction risk level to appropriate color class
 * @param risk The risk level string ('high', 'medium', 'low', etc.)
 * @returns CSS class name for the appropriate color
 */
export const getEvictionRiskColor = (risk?: string | null): string => {
  if (!risk) return 'text-gray-400';

  switch (risk.toLowerCase()) {
    case 'high':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-green-500';
    default:
      return 'text-gray-400';
  }
};

/**
 * Format a risk level string with proper capitalization
 * @param risk The risk level string
 * @returns Capitalized risk level string
 */
export const formatRiskLevel = (risk: string): string => {
  if (!risk) return '-';
  return risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase();
};

// A helper function to get badge variant based on risk level
export const getRiskBadgeVariant = (risk?: string | null) => {
  if (!risk) return 'secondary';

  switch (risk.toLowerCase()) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'default';
  }
};

// Also export as a class for better organization if preferred
export class Format {
  static eth = formatEth;
  static roundedEth = formatRoundedEth;
  static size = formatSize;
  static date = formatDate;
  static evictionRiskColor = getEvictionRiskColor;
  static riskLevel = formatRiskLevel;
  static riskBadgeVariant = getRiskBadgeVariant;
}
