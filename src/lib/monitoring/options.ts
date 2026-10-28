import type { init } from '@sentry/nextjs';
type Options = Parameters<typeof init>[0];
import { sanitizeEvent } from './privacy';

export function sampleRate(value: string | undefined): number {
  if (!value?.trim()) return 0;
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 0;
}

export function monitoringOptions(config: {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: string;
}): Options {
  return {
    dsn: config.dsn,
    enabled: Boolean(config.dsn),
    environment: config.environment,
    release: config.release,
    sendDefaultPii: false,
    enableLogs: false,
    enableMetrics: false,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },
    tracesSampleRate: sampleRate(config.tracesSampleRate),
    tracePropagationTargets: [],
    maxBreadcrumbs: 0,
    beforeBreadcrumb: () => null,
    beforeSend(event, hint) {
      hint.attachments = [];
      return sanitizeEvent(event);
    },
    beforeSendTransaction: sanitizeEvent,
  };
}

export function serverOptions(): Options {
  return monitoringOptions({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT
      || process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ?? process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  });
}
