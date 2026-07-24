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
      // ignore — DEV session may have no Supabase Auth
    }
    router.push('/login');
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
    >
      Sair
    </button>
  );
}
