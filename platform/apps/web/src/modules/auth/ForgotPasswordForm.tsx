'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Button } from '@athena/ui';
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
      <label className="text-sm font-medium text-[var(--muted)]">
        E-mail
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="athena-input mt-1"
          data-testid="forgot-email"
        />
      </label>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Enviando…' : 'Enviar link'}
      </Button>
      <Link href="/login" className="athena-link text-center text-sm text-[var(--gold)]">
        Voltar ao login
      </Link>
    </form>
  );
}
