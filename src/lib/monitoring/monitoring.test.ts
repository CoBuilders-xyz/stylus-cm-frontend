import { afterEach, describe, expect, it, vi } from 'vitest';
import { NodeClient, defaultStackParser } from '@sentry/node';
import type { Event } from '@sentry/nextjs';
import { monitoringBuild } from './build';
import { monitoringOptions, sampleRate, serverOptions } from './options';
import { sanitizeEvent } from './privacy';

afterEach(() => vi.unstubAllEnvs());

describe('monitoring configuration', () => {
  it.each([undefined, '', ' ', '-1', '1.01', 'NaN', 'Infinity', 'garbage'])('disables tracing for invalid rate %s', value => {
    expect(sampleRate(value)).toBe(0);
  });

  it.each(['0', '0.05', '1'])('accepts an explicit sample rate %s', value => {
    expect(sampleRate(value)).toBe(Number(value));
  });

  it('disables monitoring without a DSN and disables PII, logs, metrics and propagation', () => {
    const options = monitoringOptions({});
    expect(options.enabled).toBe(false);
    expect(options.sendDefaultPii).toBe(false);
    expect(options.enableLogs).toBe(false);
    expect(options.enableMetrics).toBe(false);
    expect(options.tracesSampleRate).toBe(0);
    expect(options.tracePropagationTargets).toEqual([]);
  });

  it('uses public configuration on the server, with explicit server overrides', () => {
    for (const name of ['SENTRY_DSN', 'SENTRY_ENVIRONMENT', 'SENTRY_RELEASE', 'SENTRY_TRACES_SAMPLE_RATE']) {
      vi.stubEnv(name, undefined);
    }
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'public-test-value');
    vi.stubEnv('NEXT_PUBLIC_SENTRY_ENVIRONMENT', 'staging');
    vi.stubEnv('NEXT_PUBLIC_SENTRY_RELEASE', 'test-release');
    vi.stubEnv('NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE', '0.05');
    expect(serverOptions()).toMatchObject({ dsn: 'public-test-value', environment: 'staging', release: 'test-release', tracesSampleRate: 0.05 });
    vi.stubEnv('SENTRY_DSN', 'server-test-value');
    vi.stubEnv('SENTRY_ENVIRONMENT', 'production');
    vi.stubEnv('SENTRY_RELEASE', 'server-release');
    vi.stubEnv('SENTRY_TRACES_SAMPLE_RATE', '0');
    expect(serverOptions()).toMatchObject({ dsn: 'server-test-value', environment: 'production', release: 'server-release', tracesSampleRate: 0 });
  });

  it('inlines Vercel custom environment and commit identity without exposing upload credentials', () => {
    const config = monitoringBuild({
      VERCEL_ENV: 'preview', VERCEL_TARGET_ENV: 'staging', VERCEL_GIT_COMMIT_SHA: 'test-sha',
      SENTRY_AUTH_TOKEN: 'upload-test-value', SENTRY_ORG: 'test-org', SENTRY_PROJECT: 'test-project',
    });
    expect(config.publicEnv).toEqual({ NEXT_PUBLIC_SENTRY_ENVIRONMENT: 'staging', NEXT_PUBLIC_SENTRY_RELEASE: 'test-sha' });
    expect(JSON.stringify(config.publicEnv)).not.toContain('upload-test-value');
    expect(config.sentry.sourcemaps).toEqual({ disable: false, deleteSourcemapsAfterUpload: true });
    expect(config.sentry.release).toMatchObject({ name: 'test-sha', create: true, finalize: true });
  });

  it('allows builds without optional upload credentials and honors explicit identities', () => {
    const config = monitoringBuild({ SENTRY_RELEASE: 'custom-release', SENTRY_ENVIRONMENT: 'custom-env', VERCEL_ENV: 'production' });
    expect(config.publicEnv).toEqual({ NEXT_PUBLIC_SENTRY_ENVIRONMENT: 'custom-env', NEXT_PUBLIC_SENTRY_RELEASE: 'custom-release' });
    expect(config.sentry.sourcemaps?.disable).toBe(true);
    expect(config.sentry.release).toMatchObject({ create: false, finalize: false });
  });
});

describe('telemetry privacy', () => {
  const sensitive = 'PRIVATE_TEST_MARKER';
  const event: Event = {
    event_id: 'a'.repeat(32), environment: 'staging', release: 'test-release',
    message: sensitive, logentry: { message: sensitive },
    user: { id: sensitive, ip_address: sensitive },
    request: { url: `https://rpc.invalid/${sensitive}`, headers: { Authorization: sensitive }, cookies: { session: sensitive }, data: sensitive },
    extra: { wallet: sensitive }, tags: { token: sensitive },
    breadcrumbs: [{ message: sensitive, data: { url: sensitive } }],
    contexts: { trace: { trace_id: 'a'.repeat(32), span_id: 'b'.repeat(16), data: { authorization: sensitive } }, wallet: { address: sensitive } },
    exception: { values: [{
      type: 'TypeError', value: sensitive,
      mechanism: { type: sensitive, handled: false, data: { token: sensitive } },
      stacktrace: { frames: [{
        filename: `https://user:${sensitive}@app.invalid/_next/static/chunks/app.js?token=${sensitive}#${sensitive}`,
        abs_path: `https://rpc.invalid/${sensitive}`, function: sensitive,
        lineno: 12, colno: 9, vars: { cookie: sensitive }, context_line: sensitive,
        pre_context: [sensitive], post_context: [sensitive],
      }] },
    }] },
    debug_meta: { images: [{ type: 'sourcemap', code_file: 'https://app.invalid/_next/static/chunks/app.js', debug_id: '00000000-0000-4000-8000-000000000001' }] },
  };

  it('drops arbitrary payloads while preserving stack locations and debug IDs for source maps', () => {
    const sanitized = sanitizeEvent(event);
    expect(JSON.stringify(sanitized)).not.toContain(sensitive);
    expect(sanitized.exception?.values?.[0]).toMatchObject({
      type: 'TypeError', mechanism: { type: 'generic', handled: false },
      stacktrace: { frames: [{ filename: 'https://app.invalid/_next/static/chunks/app.js', lineno: 12, colno: 9 }] },
    });
    expect(sanitized.debug_meta).toEqual(event.debug_meta);
    expect(sanitized.release).toBe('test-release');
    expect(sanitized.user).toEqual({ ip_address: '0.0.0.0' });
    expect(event.message).toBe(sensitive); // No mutation of the SDK input.
  });

  it('strips sensitive transaction names, span payloads and request context', () => {
    const result = sanitizeEvent({ ...event, type: 'transaction', transaction: `/wallet/${sensitive}`, start_timestamp: 1, timestamp: 2, spans: [{ description: sensitive, span_id: 'b'.repeat(16), trace_id: 'a'.repeat(32), start_timestamp: 1, data: { url: sensitive } }] });
    expect(JSON.stringify(result)).not.toContain(sensitive);
    expect(result).toMatchObject({ transaction: '[Filtered route]', spans: [], start_timestamp: 1, timestamp: 2 });
    expect(sanitizeEvent({ type: 'transaction', transaction: '/my-contracts' }).transaction).toBe('/my-contracts');
  });

  it('filters a real SDK transport envelope, including scope data and attachments', async () => {
    const envelopes: unknown[] = [];
    const client = new NodeClient({
      ...monitoringOptions({ dsn: 'https://public@example.invalid/1', environment: 'test', release: 'test-release' }),
      integrations: [], stackParser: defaultStackParser,
      transport: () => ({ send: async envelope => { envelopes.push(envelope); return {}; }, flush: async () => true }),
    });
    client.init();
    client.captureEvent(event, { attachments: [{ filename: 'private.txt', data: sensitive }] });
    await client.flush(2000);
    expect(envelopes).toHaveLength(1);
    expect(JSON.stringify(envelopes)).not.toContain(sensitive);
    expect(JSON.stringify(envelopes)).not.toContain('private.txt');
    await client.close();
  });
});
