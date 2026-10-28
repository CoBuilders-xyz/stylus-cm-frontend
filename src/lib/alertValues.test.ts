import { describe, expect, it } from 'vitest';
import {
  DISABLED_APPROACHING_EXPIRATION_FALLBACK_VALUE,
  DISABLED_LOW_GAS_FALLBACK_VALUE,
  resolveDisabledApproachingExpirationValue,
  resolveDisabledLowGasValue,
} from '@/lib/alertValues';

describe('resolveDisabledLowGasValue', () => {
  it('keeps a valid stored value', () => {
    expect(resolveDisabledLowGasValue('0.05')).toBe(0.05);
    expect(resolveDisabledLowGasValue('1')).toBe(1);
    expect(resolveDisabledLowGasValue(' 2.5 ')).toBe(2.5);
  });

  it.each([
    ['Infinity', 'non-finite'],
    ['-Infinity', 'non-finite'],
    ['NaN', 'NaN'],
    ['0', 'zero'],
    ['-0.01', 'negative'],
    ['', 'empty'],
    ['   ', 'whitespace'],
    ['abc', 'non-numeric'],
    ['0.01garbage', 'trailing garbage (parseFloat would accept)'],
    ['1e400', 'overflows to Infinity'],
  ])('falls back for %j (%s)', (stored) => {
    expect(resolveDisabledLowGasValue(stored)).toBe(
      DISABLED_LOW_GAS_FALLBACK_VALUE
    );
  });

  it('fallback itself is a finite positive number', () => {
    expect(Number.isFinite(DISABLED_LOW_GAS_FALLBACK_VALUE)).toBe(true);
    expect(DISABLED_LOW_GAS_FALLBACK_VALUE).toBeGreaterThan(0);
    // JSON.stringify(Infinity) === 'null' — the exact failure the guard exists for.
    expect(JSON.stringify(resolveDisabledLowGasValue('Infinity'))).not.toBe(
      'null'
    );
  });
});

describe('resolveDisabledApproachingExpirationValue', () => {
  it('keeps a valid stored value', () => {
    expect(resolveDisabledApproachingExpirationValue('1')).toBe(1);
    expect(resolveDisabledApproachingExpirationValue('30')).toBe(30);
    expect(resolveDisabledApproachingExpirationValue('365')).toBe(365);
  });

  it.each([
    ['0', 'below range'],
    ['366', 'above range'],
    ['-5', 'negative'],
    ['12.5', 'decimal (parseInt would truncate to 12)'],
    ['12abc', 'trailing garbage (parseInt would accept)'],
    ['Infinity', 'non-finite'],
    ['NaN', 'NaN'],
    ['', 'empty'],
    ['abc', 'non-numeric'],
  ])('falls back for %j (%s)', (stored) => {
    expect(resolveDisabledApproachingExpirationValue(stored)).toBe(
      DISABLED_APPROACHING_EXPIRATION_FALLBACK_VALUE
    );
  });

  it('fallback itself is within [1, 365]', () => {
    expect(
      Number.isInteger(DISABLED_APPROACHING_EXPIRATION_FALLBACK_VALUE)
    ).toBe(true);
    expect(DISABLED_APPROACHING_EXPIRATION_FALLBACK_VALUE).toBeGreaterThanOrEqual(1);
    expect(DISABLED_APPROACHING_EXPIRATION_FALLBACK_VALUE).toBeLessThanOrEqual(365);
  });
});
