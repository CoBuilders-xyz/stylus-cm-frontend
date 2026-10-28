import type { SentryBuildOptions } from '@sentry/nextjs';

export function monitoringBuild(env: Record<string, string | undefined>) {
  const release = env.SENTRY_RELEASE || env.NEXT_PUBLIC_SENTRY_RELEASE || env.VERCEL_GIT_COMMIT_SHA;
  const environment = env.SENTRY_ENVIRONMENT || env.NEXT_PUBLIC_SENTRY_ENVIRONMENT
    || env.VERCEL_TARGET_ENV || env.VERCEL_ENV || env.NODE_ENV || 'development';
  const upload = Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT);

  const sentry: SentryBuildOptions = {
    org: env.SENTRY_ORG,
    project: env.SENTRY_PROJECT,
    authToken: env.SENTRY_AUTH_TOKEN,
    silent: !env.CI,
    telemetry: false,
    widenClientFileUpload: true,
    sourcemaps: { disable: !upload, deleteSourcemapsAfterUpload: true },
    release: { name: release, create: upload, finalize: upload },
    webpack: { treeshake: { removeDebugLogging: true } },
  };

  return {
    publicEnv: {
      NEXT_PUBLIC_SENTRY_ENVIRONMENT: environment,
      NEXT_PUBLIC_SENTRY_RELEASE: release || '',
    },
    sentry,
  };
}
