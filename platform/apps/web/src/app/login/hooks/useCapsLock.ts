'use client';

import { useCallback, useState } from 'react';

export function useCapsLock() {
  const [capsLockOn, setCapsLockOn] = useState(false);

  const onKeyEvent = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  }, []);

  return { capsLockOn, onKeyEvent };
}
