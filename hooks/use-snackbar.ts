'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const AUTO_DISMISS_MS = 4000;

export function useSnackbar() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const dismiss = useCallback(() => {
    setMessage(null);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback((newMessage: string) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    setMessage(newMessage);
    timerRef.current = setTimeout(() => {
      setMessage(null);
      timerRef.current = null;
    }, AUTO_DISMISS_MS);
  }, []);

  return { message, show, dismiss };
}
