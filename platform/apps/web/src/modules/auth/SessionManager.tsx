'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DEV_TOKEN_COOKIE } from '@/lib/auth/constants';

const IDLE_MS = 30 * 60 * 1000;
const REFRESH_MS = 4 * 60 * 1000;
const DEV_AUTH = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

export function SessionManager() {
  const router = useRouter();
  const lastActive = useRef(Date.now());

  useEffect(() => {
    const mark = () => {
      lastActive.current = Date.now();
    };
    window.addEventListener('mousemove', mark);
    window.addEventListener('keydown', mark);
    window.addEventListener('click', mark);

    const clearDev = () => {
      document.cookie = `${DEV_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    };

    const idleTimer = window.setInterval(async () => {
      if (Date.now() - lastActive.current > IDLE_MS) {
        clearDev();
        if (!DEV_AUTH) {
          const supabase = createClient();
          await supabase.auth.signOut();
        }
        router.push('/login?reason=timeout');
        router.refresh();
      }
    }, 30_000);

    let refreshTimer: number | undefined;
    let sub: { subscription: { unsubscribe: () => void } } | undefined;

    if (!DEV_AUTH) {
      const supabase = createClient();
      refreshTimer = window.setInterval(async () => {
        await supabase.auth.getSession();
      }, REFRESH_MS);
      const { data } = supabase.auth.onAuthStateChange(() => {
        mark();
      });
      sub = data;
    }

    return () => {
      window.removeEventListener('mousemove', mark);
      window.removeEventListener('keydown', mark);
      window.removeEventListener('click', mark);
      window.clearInterval(idleTimer);
      if (refreshTimer) window.clearInterval(refreshTimer);
      sub?.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
