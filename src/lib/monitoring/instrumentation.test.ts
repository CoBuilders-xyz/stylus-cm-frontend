import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const sentry = vi.hoisted(() => ({ init: vi.fn(), captureRequestError: vi.fn(), captureRouterTransitionStart: vi.fn() }));
vi.mock('@sentry/nextjs', () => sentry);

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('SENTRY_DSN', undefined);
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', undefined);
});
afterEach(() => vi.unstubAllEnvs());

it('does not initialize any SDK or capture requests when DSNs are absent', async () => {
  await import('../../instrumentation-client');
  const server = await import('../../instrumentation');
  await server.register();
  await import('../../../sentry.server.config');
  await import('../../../sentry.edge.config');
  server.onRequestError(new Error('test'), { path: '/', method: 'GET', headers: {} }, { routerKind: 'App Router', routePath: '/', routeType: 'render' });
  expect(sentry.init).not.toHaveBeenCalled();
  expect(sentry.captureRequestError).not.toHaveBeenCalled();
});

it.each(['nodejs', 'edge'])('registers the %s SDK and captures request errors', async runtime => {
  vi.stubEnv('NEXT_RUNTIME', runtime);
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'test-value');
  const server = await import('../../instrumentation');
  await server.register();
  expect(sentry.init).toHaveBeenCalledOnce();
  expect(sentry.init.mock.calls[0][0]).toMatchObject({ dsn: 'test-value', sendDefaultPii: false, tracesSampleRate: 0 });
  const error = new Error('test');
  server.onRequestError(error, { path: '/', method: 'GET', headers: {} }, { routerKind: 'App Router', routePath: '/', routeType: 'render' });
  expect(sentry.captureRequestError.mock.calls[0][0]).toBe(error);
});

it('initializes the browser from literal public variables without replay or logs', async () => {
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'test-value');
  vi.stubEnv('NEXT_PUBLIC_SENTRY_ENVIRONMENT', 'staging');
  vi.stubEnv('NEXT_PUBLIC_SENTRY_RELEASE', 'test-sha');
  await import('../../instrumentation-client');
  expect(sentry.init.mock.calls[0][0]).toMatchObject({
    dsn: 'test-value', environment: 'staging', release: 'test-sha',
    replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 0, enableLogs: false,
  });
});
