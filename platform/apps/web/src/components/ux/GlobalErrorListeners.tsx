'use client';

import { useEffect } from 'react';
import { reportClientError } from '@athena/ui';

const CHUNK_RELOAD_KEY = 'athena-chunk-reload';

function isStaleChunkError(value: unknown): boolean {
  const message =
    typeof value === 'string'
      ? value
      : value instanceof Error
        ? value.message
        : typeof (value as { message?: string })?.message === 'string'
          ? (value as { message: string }).message
          : String(value ?? '');

  return (
    message.includes("reading 'call'") ||
    message.includes('ChunkLoadError') ||
    message.includes('Loading chunk') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Cannot find module')
  );
}

function hardReloadForStaleChunk() {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
  const url = new URL(window.location.href);
  url.searchParams.set('_rsc', String(Date.now()));
  window.location.replace(url.toString());
}

export function GlobalErrorListeners() {
  useEffect(() => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);

    function onError(event: ErrorEvent) {
      if (isStaleChunkError(event.error || event.message)) {
        hardReloadForStaleChunk();
        return;
      }
      reportClientError(event.error || event.message, 'window');
    }
    function onRejection(event: PromiseRejectionEvent) {
      if (isStaleChunkError(event.reason)) {
        hardReloadForStaleChunk();
        return;
      }
      reportClientError(event.reason, 'unhandledrejection');
    }
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
