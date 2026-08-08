export type ClientErrorPayload = {
  message: string;
  stack?: string;
  digest?: string;
  href?: string;
  userAgent?: string;
  ts: string;
  source: 'error-boundary' | 'window' | 'unhandledrejection' | 'manual';
};

const buffer: ClientErrorPayload[] = [];

export function reportClientError(
  error: unknown,
  source: ClientErrorPayload['source'] = 'manual',
  digest?: string,
) {
  const err = error instanceof Error ? error : new Error(String(error));
  const payload: ClientErrorPayload = {
    message: err.message,
    stack: err.stack,
    digest,
    href: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    ts: new Date().toISOString(),
    source,
  };
  buffer.push(payload);
  try {
    const w = window as Window & { __MOVVO_ERRORS__?: ClientErrorPayload[] };
    w.__MOVVO_ERRORS__ = w.__MOVVO_ERRORS__ || [];
    w.__MOVVO_ERRORS__.push(payload);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[Movvo RUM]', payload);
    }
  } catch {
    /* ignore */
  }
  return payload;
}

export function getBufferedErrors() {
  return [...buffer];
}
