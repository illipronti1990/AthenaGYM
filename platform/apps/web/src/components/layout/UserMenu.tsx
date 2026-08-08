'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, movvoIcons } from '@movvo/ui';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DEV_TOKEN_COOKIE } from '@/lib/auth/constants';
import { useTheme } from '@/components/ThemeProvider';

export function UserMenu({ userName }: { userName?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { resolved, toggle } = useTheme();
  const display = userName || 'Usuário';

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function logout() {
    document.cookie = `${DEV_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    try {
      await createClient().auth.signOut();
    } catch {
      /* ignore */
    }
    router.push('/login');
    router.refresh();
  }

  const Profile = movvoIcons.profile;
  const Settings = movvoIcons.settings;
  const Help = movvoIcons.help;
  const Logout = movvoIcons.logout;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="movvo-user-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="user-menu"
      >
        <Avatar name={display} size={28} />
        <span className="hidden max-w-[120px] truncate text-sm sm:inline">{display.split(' ')[0]}</span>
        <ChevronDown size={14} className="text-[var(--muted)]" aria-hidden />
      </button>

      {open ? (
        <div className="movvo-user-menu" role="menu">
          <Link href="/app/profile" className="movvo-user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <Profile size={16} /> Meu Perfil
          </Link>
          <Link href="/app/settings" className="movvo-user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <Settings size={16} /> Configurações
          </Link>
          <button
            type="button"
            className="movvo-user-menu-item"
            role="menuitem"
            onClick={() => {
              toggle();
              setOpen(false);
            }}
          >
            {resolved === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            Tema {resolved === 'dark' ? 'claro' : 'escuro'}
          </button>
          <Link href="/app/help" className="movvo-user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <Help size={16} /> Ajuda
          </Link>
          <button type="button" className="movvo-user-menu-item is-danger" role="menuitem" onClick={() => void logout()}>
            <Logout size={16} /> Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
