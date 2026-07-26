'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DEV_TOKEN_COOKIE } from '@/lib/auth/constants';

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    document.cookie = `${DEV_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push('/login');
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-[10px] bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)]"
    >
      Sair
    </button>
  );
}
