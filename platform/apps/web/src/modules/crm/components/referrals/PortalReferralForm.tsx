'use client';

import { FormEvent, useState } from 'react';
import { Button, Card } from '@movvo/ui';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

export function PortalReferralForm({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [referredName, setReferredName] = useState('');
  const [referredPhone, setReferredPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await crmApi.submitReferral(accessToken, {
        referredName,
        referredPhone: referredPhone || undefined,
        notes: notes || undefined,
      });
      setSubmitted(true);
      push('Indicação registrada! Obrigado.');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao registrar indicação', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="py-8 text-center">
        <p className="text-lg font-semibold text-[var(--gold)]">Indicação enviada!</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Assim que seu amigo se matricular, você receberá sua recompensa.
        </p>
      </Card>
    );
  }

  return (
    <Card data-testid="portal-referral-form">
      <p className="mb-4 text-sm text-[var(--muted)]">
        Indique um amigo e ganhe pontos de fidelidade quando ele se matricular!
      </p>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input
          required
          placeholder="Nome do amigo"
          value={referredName}
          onChange={(e) => setReferredName(e.target.value)}
          className="movvo-input"
          data-testid="referral-name"
        />
        <input
          placeholder="Telefone / WhatsApp"
          value={referredPhone}
          onChange={(e) => setReferredPhone(e.target.value)}
          className="movvo-input"
        />
        <textarea
          placeholder="Observações (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="movvo-input"
        />
        <Button type="submit" disabled={loading || !referredName}>
          {loading ? 'Enviando…' : 'Indicar amigo'}
        </Button>
      </form>
    </Card>
  );
}
