'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { apiResetPassword } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

export function ForgotPasswordForm() {
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiResetPassword(email);
      push('Se o e-mail existir, enviamos o link de reset');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha no reset', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <label className="text-sm font-medium text-zinc-700">
        E-mail
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          data-testid="forgot-email"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-[#A3001B] px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Enviando…' : 'Enviar link'}
      </button>
      <Link href="/login" className="text-center text-sm text-zinc-600">
        Voltar ao login
      </Link>
    </form>
  );
}
