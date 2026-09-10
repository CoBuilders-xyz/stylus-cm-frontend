/**
 * Value resolution for *disabling* value-based alerts.
 *
 * The backend requires a schema-valid `value` even when `isActive` is false.
 * The stored value normally passes validation (the backend validated it on
 * write), but a legacy or malformed row must not cause the disable request
 * to be skipped or rejected — that would leave the alert active while the
 * save reports success. These helpers return the stored value when it is
 * usable and a safe fallback otherwise. The alert is inactive, so the
 * fallback is never acted on; it only has to satisfy the backend schema.
 *
 * `Number()` is used instead of `parseFloat` / `parseInt` on purpose: the
 * latter accept partial matches (`'0.01garbage'` → 0.01, `'12.5'` → 12),
 * which would let malformed values slip past the checks below.
 */

export const DISABLED_LOW_GAS_FALLBACK_VALUE = 0.01;
export const DISABLED_APPROACHING_EXPIRATION_FALLBACK_VALUE = 7;

/** Low Gas threshold: any finite positive number. */
export function resolveDisabledLowGasValue(stored: string): number {
  const n = stored.trim() === '' ? NaN : Number(stored);
  return Number.isFinite(n) && n > 0 ? n : DISABLED_LOW_GAS_FALLBACK_VALUE;
}

/** Approaching Expiration threshold: integer number of days in [1, 365]. */
export function resolveDisabledApproachingExpirationValue(
  stored: string
): number {
  const n = stored.trim() === '' ? NaN : Number(stored);
  return Number.isInteger(n) && n >= 1 && n <= 365
    ? n
    : DISABLED_APPROACHING_EXPIRATION_FALLBACK_VALUE;
}
