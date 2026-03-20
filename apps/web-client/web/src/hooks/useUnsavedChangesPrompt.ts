'use client';

import { useCallback, useEffect } from 'react';

export const UNSAVED_CHANGES_MESSAGE = 'Hay cambios que aún no se han guardado. ¿Deseas salir o continuar?';

export function useUnsavedChangesPrompt(enabled: boolean, message: string = UNSAVED_CHANGES_MESSAGE) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled, message]);

  const confirmNavigation = useCallback(() => {
    if (!enabled) return true;
    return window.confirm(message);
  }, [enabled, message]);

  return { confirmNavigation };
}
