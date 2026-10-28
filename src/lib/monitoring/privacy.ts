import type { Event, StackFrame } from '@sentry/nextjs';

const routes = new Set([
  '/', '/blockchain-events', '/cache-status', '/explore-contracts', '/my-contracts',
]);

// Keep code locations for source maps. Never keep request URLs, URL credentials,
// queries, source snippets, locals, or arbitrary paths from RPC error objects.
function codeLocation(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const path = value.split(/[?#]/, 1)[0];
  if (/^https?:\/\//.test(path)) {
    try {
      const url = new URL(path);
      if (!url.pathname.startsWith('/_next/static/')) return undefined;
      return url.origin + url.pathname;
    } catch {
      return undefined;
    }
  }
  if (/^(app:\/\/\/|webpack(?:-internal)?:\/\/|\/var\/task\/|\.next\/)/.test(path)) {
    return path;
  }
  return undefined;
}

function cleanFrame(frame: StackFrame): StackFrame {
  return {
    filename: codeLocation(frame.filename),
    abs_path: codeLocation(frame.abs_path),
    lineno: frame.lineno,
    colno: frame.colno,
    in_app: frame.in_app,
    // Function names can contain computed object keys, including wallet addresses.
  };
}

function cleanTrace(event: Event) {
  const trace = event.contexts?.trace;
  if (!trace) return undefined;
  const id = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{16,32}$/.test(value) ? value : undefined;
  const traceId = id(trace.trace_id);
  const spanId = id(trace.span_id);
  if (!traceId || !spanId) return undefined;
  return {
    trace_id: traceId,
    span_id: spanId,
    parent_span_id: id(trace.parent_span_id),
  };
}

// An allowlist avoids leaks from future SDK integrations and scope enrichment.
// Error messages can contain whole HTTP responses, signatures and RPC URLs.
// Retain stack locations and standard error types instead of free-form text.
export function sanitizeEvent<T extends Event>(event: T): T {
  const safe: Event = {
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: event.platform,
    level: event.level,
    environment: event.environment,
    release: event.release,
    dist: event.dist,
    type: event.type,
    contexts: { trace: cleanTrace(event) },
  };

  if (event.exception) {
    safe.exception = {
      values: event.exception.values?.map(exception => ({
        type: /^(Error|TypeError|RangeError|ReferenceError|SyntaxError|URIError|EvalError|AggregateError)$/.test(exception.type ?? '')
          ? exception.type : 'Error',
        value: '[Message removed for privacy]',
        stacktrace: exception.stacktrace && { frames: exception.stacktrace.frames?.map(cleanFrame) },
        mechanism: exception.mechanism && {
          type: 'generic',
          handled: exception.mechanism.handled,
        },
      })),
    };
  }

  if (event.debug_meta?.images) {
    safe.debug_meta = {
      images: event.debug_meta.images.flatMap(image => {
        const file = codeLocation(image.code_file);
        return image.type === 'sourcemap' && file
          ? [{ type: 'sourcemap' as const, code_file: file, debug_id: image.debug_id }]
          : [];
      }),
    };
  }

  if (event.type === 'transaction') {
    const transaction = event;
    Object.assign(safe, {
      transaction: routes.has(transaction.transaction ?? '') ? transaction.transaction : '[Filtered route]',
      start_timestamp: transaction.start_timestamp,
      transaction_info: { source: 'custom' },
      // Child spans can contain HTTP/RPC URLs and database queries.
      spans: [],
    });
  }
  return safe as T;
}
