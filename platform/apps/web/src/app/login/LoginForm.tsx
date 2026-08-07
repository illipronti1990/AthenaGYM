'use client';

import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { DEV_TOKEN_COOKIE } from '@/lib/auth/constants';
import { LOCKOUT_MS, REMEMBER_KEY } from './constants';
import { useCapsLock } from './hooks/useCapsLock';
import { useLoginAttempts } from './hooks/useLoginAttempts';

const DEV_AUTH = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function setDevTokenCookie(token: string) {
  const maxAge = 12 * 60 * 60;
  document.cookie = `${DEV_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

async function reportLoginEvent(payload: {
  email: string;
  success: boolean;
  reason?: string;
}) {
  try {
    await fetch(`${API_URL}/auth/login-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Browser': typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    /* non-blocking */
  }
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { push } = useToast();
  const emailId = useId();
  const passwordId = useId();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { capsLockOn, onKeyEvent } = useCapsLock();
  const attempts = useLoginAttempts();

  useEffect(() => {
    const saved =
      localStorage.getItem(REMEMBER_KEY) || localStorage.getItem('athena.rememberEmail');
    if (saved) setEmail(saved);
    else if (DEV_AUTH) setEmail('teste@athena.local');
    if (params.get('reason') === 'timeout') {
      push('Sessão expirada por inatividade', 'error');
    }
    const t = window.setTimeout(() => emailRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [params, push]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (attempts.locked || loading) return;

    setLoading(true);
    setError(null);
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, email);
      localStorage.removeItem('athena.rememberEmail');
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem('athena.rememberEmail');
    }

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
          const result = attempts.registerFailure();
          const lockMins = Math.ceil(LOCKOUT_MS / 60_000);
          const msg = result.locked
            ? `Muitas tentativas. Tente novamente em ${lockMins} minuto(s).`
            : 'Email ou senha inválidos.';
          setError(msg);
          push(msg, 'error');
          void reportLoginEvent({ email, success: false, reason: 'invalid_credentials' });
          return;
        }
        setDevTokenCookie(body.accessToken);
      } else {
        const supabase = createClient();
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          const result = attempts.registerFailure();
          const lockMins = Math.ceil(LOCKOUT_MS / 60_000);
          const msg = result.locked
            ? `Muitas tentativas. Tente novamente em ${lockMins} minuto(s).`
            : 'Email ou senha inválidos.';
          setError(msg);
          push(msg, 'error');
          void reportLoginEvent({ email, success: false, reason: err.message });
          return;
        }
      }

      attempts.registerSuccess();
      void reportLoginEvent({ email, success: true });
      push('Bem-vindo ao Movvo.', 'ok');
      router.push('/app');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || attempts.locked;

  return (
    <form
      onSubmit={onSubmit}
      method="post"
      action="/login"
      className="movvo-login-form"
      data-testid="login-form"
      noValidate
    >
      <div className="movvo-login-field">
        <label htmlFor={emailId}>E-mail</label>
        <div className="movvo-login-input-wrap">
          <Mail size={18} aria-hidden className="movvo-login-input-icon" />
          <input
            ref={emailRef}
            id={emailId}
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyUp={onKeyEvent}
            placeholder="Digite seu e-mail"
            className="movvo-login-input"
            disabled={disabled}
            data-testid="login-email"
          />
        </div>
      </div>

      <div className="movvo-login-field">
        <label htmlFor={passwordId}>Senha</label>
        <div className="movvo-login-input-wrap">
          <Lock size={18} aria-hidden className="movvo-login-input-icon" />
          <input
            id={passwordId}
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={onKeyEvent}
            placeholder="Digite sua senha"
            className="movvo-login-input movvo-login-input-password"
            disabled={disabled}
            data-testid="login-password"
          />
          <button
            type="button"
            className="movvo-login-eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={0}
            data-testid="login-toggle-password"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {capsLockOn ? (
          <p className="movvo-login-capslock" role="status" data-testid="caps-lock-warning">
            Caps Lock ativado
          </p>
        ) : null}
      </div>

      <label className="movvo-login-remember">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          disabled={disabled}
        />
        Lembrar e-mail
      </label>

      {DEV_AUTH ? (
        <p className="movvo-login-dev">
          DEV · teste@athena.local / teste123 · aluno: renan.aluno@athena.local · professora: bruna.professora@athena.local / teste123
        </p>
      ) : null}

      {attempts.locked ? (
        <p className="movvo-login-error" role="alert" data-testid="login-locked">
          Conta temporariamente bloqueada. Aguarde {attempts.lockMinutes} minuto(s).
        </p>
      ) : null}

      {error && !attempts.locked ? (
        <p className="movvo-login-error" role="alert" data-testid="login-error">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        className="movvo-login-submit"
        data-testid="login-submit"
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className="movvo-login-spinner" aria-hidden />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </button>

      <Link href="/forgot-password" className="movvo-login-forgot">
        Esqueci minha senha
      </Link>
    </form>
  );
}
