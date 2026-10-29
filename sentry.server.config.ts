import * as Sentry from '@sentry/nextjs';
import { serverOptions } from './src/lib/monitoring/options';

const options = serverOptions();
if (options.dsn) Sentry.init(options);
