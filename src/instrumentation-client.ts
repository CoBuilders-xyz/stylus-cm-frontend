import * as Sentry from '@sentry/nextjs';
import { monitoringOptions } from './lib/monitoring/options';

// Next.js only inlines literal NEXT_PUBLIC_* references into browser bundles.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    ...monitoringOptions({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    }),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: defaults => defaults.filter(integration => integration.name !== 'BrowserSession'),
  });
}

export const onRouterTransitionStart: typeof Sentry.captureRouterTransitionStart = (...args) => {
  if (dsn) Sentry.captureRouterTransitionStart(...args);
};
