// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://527517c68091d4adae31b0e6bfc2525e@o4511507618136064.ingest.us.sentry.io/4511507636813824",

  // 100% sampling in development, 10% in production to control trace volume.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Opt in explicitly when there's a documented use case + consent coverage.
  sendDefaultPii: false,
});
