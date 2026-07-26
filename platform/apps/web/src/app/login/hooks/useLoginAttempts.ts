'use client';

import { useCallback, useEffect, useState } from 'react';
import { LOCKOUT_MS, LOGIN_ATTEMPTS_KEY, MAX_LOGIN_ATTEMPTS } from '../constants';

type Stored = { count: number; lockedUntil: number | null };

function read(): Stored {
  try {
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!raw) return { count: 0, lockedUntil: null };
    return JSON.parse(raw) as Stored;
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function write(data: Stored) {
  try {
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function useLoginAttempts() {
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const data = read();
    if (data.lockedUntil && data.lockedUntil > Date.now()) {
      setLockedUntil(data.lockedUntil);
    } else if (data.lockedUntil) {
      write({ count: 0, lockedUntil: null });
    }
  }, []);

  useEffect(() => {
    if (!lockedUntil) {
      setRemainingMs(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, lockedUntil - Date.now());
      setRemainingMs(left);
      if (left <= 0) {
        setLockedUntil(null);
        write({ count: 0, lockedUntil: null });
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  const locked = Boolean(lockedUntil && remainingMs > 0);

  const registerFailure = useCallback(() => {
    const data = read();
    const count = data.count + 1;
    if (count >= MAX_LOGIN_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_MS;
      write({ count, lockedUntil: until });
      setLockedUntil(until);
      return { locked: true, attemptsLeft: 0 };
    }
    write({ count, lockedUntil: null });
    return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS - count };
  }, []);

  const registerSuccess = useCallback(() => {
    write({ count: 0, lockedUntil: null });
    setLockedUntil(null);
  }, []);

  const lockMinutes = Math.ceil(remainingMs / 60_000);

  return {
    locked,
    remainingMs,
    lockMinutes,
    registerFailure,
    registerSuccess,
    maxAttempts: MAX_LOGIN_ATTEMPTS,
  };
}
