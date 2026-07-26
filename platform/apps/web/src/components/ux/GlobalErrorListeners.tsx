'use client';

import { useEffect } from 'react';
import { reportClientError } from '@athena/ui';

export function GlobalErrorListeners() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportClientError(event.error || event.message, 'window');
    }
    function onRejection(event: PromiseRejectionEvent) {
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
