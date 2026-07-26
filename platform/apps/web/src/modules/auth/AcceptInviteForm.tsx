'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@athena/ui';
import { apiAcceptInvite } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

export function AcceptInviteForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { push } = useToast();
  const [token, setToken] = useState(params.get('token') || '');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiAcceptInvite({ token, password, fullName: fullName || undefined });
      push('Conta criada — faça login');
      router.push('/login');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Convite inválido', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <label className="text-sm font-medium text-[var(--muted)]">
        Token do convite
        <input
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="athena-input mt-1"
        />
      </label>
      <label className="text-sm font-medium text-[var(--muted)]">
        Nome
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="athena-input mt-1"
        />
      </label>
      <label className="text-sm font-medium text-[var(--muted)]">
        Senha
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="athena-input mt-1"
        />
      </label>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Criando…' : 'Criar senha e entrar'}
      </Button>
    </form>
  );
}
