'use client';

import { useEffect } from 'react';

/** Protege contra fechamento/aba com alterações não salvas. */
export function useUnsavedChanges(dirty: boolean, message = 'Existem alterações não salvas. Deseja sair?') {
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, message]);
}
