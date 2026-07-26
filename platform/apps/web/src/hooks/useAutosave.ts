'use client';

import { useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutosave<T>({
  value,
  enabled,
  delayMs = 900,
  onSave,
}: {
  value: T;
  enabled: boolean;
  delayMs?: number;
  onSave: (value: T) => Promise<void>;
}) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const first = useRef(true);
  const latest = useRef(value);
  const onSaveRef = useRef(onSave);
  latest.current = value;
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }

    setStatus('saving');
    const t = setTimeout(() => {
      void (async () => {
        try {
          await onSaveRef.current(latest.current);
          setStatus('saved');
        } catch {
          setStatus('error');
        }
      })();
    }, delayMs);

    return () => clearTimeout(t);
  }, [value, enabled, delayMs]);

  return status;
}
