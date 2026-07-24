'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { DEV_TOKEN_COOKIE } from '@/lib/auth/constants';

const REMEMBER_KEY = 'athenas.rememberEmail';
const DEV_AUTH = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function setDevTokenCookie(token: string) {
  const maxAge = 12 * 60 * 60;
  document.cookie = `${DEV_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) setEmail(saved);
    else if (DEV_AUTH) setEmail('teste@athenas.local');
    if (params.get('reason') === 'timeout') {
      push('Sessão expirada por inatividade', 'error');
    }
  }, [params, push]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (remember) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);

    try {
      if (DEV_AUTH) {
        const res = await fetch(`${API_URL}/auth/dev-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          accessToken?: string;
          message?: string | string[];
        };
        if (!res.ok || !body.accessToken) {
          const msg = Array.isArray(body.message)
            ? body.message.join(', ')
            : body.message || 'Login inválido';
          setError(msg);
          push('Login inválido', 'error');
          return;
        }
        setDevTokenCookie(body.accessToken);
      } else {
        const supabase = createClient();
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          setError(err.message);
          push('Login inválido', 'error');
          return;
        }
      }
      push('Bem-vindo');
      router.push('/app');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3" data-testid="login-form">
      <label className="text-sm font-medium text-zinc-700">
        E-mail
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
          placeholder={DEV_AUTH ? 'teste@athenas.local' : 'admin@athenas.gym'}
          data-testid="login-email"
        />
      </label>
      <label className="text-sm font-medium text-zinc-700">
        Senha
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
          data-testid="login-password"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Lembrar usuário
      </label>
      {DEV_AUTH ? (
        <p className="text-xs text-amber-700">
          DEV auth ativo — user: teste@athenas.local / teste123 (dados no Supabase)
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" data-testid="login-error">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-[#A3001B] px-4 py-2 font-semibold text-white disabled:opacity-60"
        data-testid="login-submit"
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
      <Link href="/forgot-password" className="text-center text-sm text-[#A3001B]">
        Esqueci minha senha
      </Link>
      <div className="mt-2 space-y-2 border-t border-zinc-200 pt-3">
        <p className="text-xs text-zinc-500">MFA (em breve)</p>
        <button
          type="button"
          disabled
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-400"
        >
          Continuar com Google (em breve)
        </button>
        <button
          type="button"
          disabled
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-400"
        >
          Continuar com Microsoft (em breve)
        </button>
      </div>
    </form>
  );
}
