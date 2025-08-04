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
 * Format ETH values with subscript notation for small amounts on chart axes
 * @param value ETH amount as number
 * @returns Formatted ETH amount with subscript notation for small values
 */
export const formatETHForAxis = (value: number): string => {
  if (value < 0.001 && value > 0) {
    // Convert to string and find the position of the first non-zero digit after decimal
    const str = value.toString();
    const decimalIndex = str.indexOf('.');
    if (decimalIndex !== -1) {
      const afterDecimal = str.substring(decimalIndex + 1);
      let firstNonZeroIndex = -1;
      for (let i = 0; i < afterDecimal.length; i++) {
        if (afterDecimal[i] !== '0') {
          firstNonZeroIndex = i;
          break;
        }
      }
      if (firstNonZeroIndex >= 3) {
        // Only use notation if there are 3+ leading zeros
        const leadingZeros = firstNonZeroIndex;
        const significantDigits = afterDecimal.substring(firstNonZeroIndex);

        // Convert leading zeros count to subscript
        const subscriptMap: { [key: string]: string } = {
          '0': '₀',
          '1': '₁',
          '2': '₂',
          '3': '₃',
          '4': '₄',
          '5': '₅',
          '6': '₆',
          '7': '₇',
          '8': '₈',
          '9': '₉',
        };
        const subscriptNumber = leadingZeros
          .toString()
          .split('')
          .map((digit) => subscriptMap[digit])
          .join('');

        return `0.0${subscriptNumber}${significantDigits.substring(0, 3)}`;
      }
    }
  }
  return formatRoundedEth(value, 5);
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
  static roundedEth = formatRoundedEth;
  static size = formatSize;
  static date = formatDate;
  static evictionRiskColor = getEvictionRiskColor;
  static riskLevel = formatRiskLevel;
  static riskBadgeVariant = getRiskBadgeVariant;
}
