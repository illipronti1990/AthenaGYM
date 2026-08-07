'use client';

import { useState } from 'react';
import { Button, Card } from '@athena/ui';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

export function PortalNpsForm({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (score === null) return;
    setLoading(true);
    try {
      await crmApi.submitNps(accessToken, { score, comment: comment || undefined });
      setSubmitted(true);
      push('Obrigado pela avaliação!');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao enviar avaliação', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="py-8 text-center">
        <p className="text-lg font-semibold text-[var(--gold)]">Obrigado pelo seu feedback!</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Sua resposta foi registrada com sucesso.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-6" data-testid="portal-nps-form">
      <div>
        <p className="mb-3 text-sm text-[var(--muted)]">
          De 0 a 10, o quanto você indicaria nossa academia para um amigo ou familiar?
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className={`h-10 w-10 rounded-[10px] border text-sm font-semibold transition-colors ${
                score === n
                  ? 'border-[var(--gold)] bg-[var(--gold)] text-[var(--bg)]'
                  : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--gold)]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-[var(--muted)]">
          <span>Muito improvável</span>
          <span>Muito provável</span>
        </div>
      </div>
      <textarea
        placeholder="Deixe um comentário (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="athena-input w-full"
      />
      <Button disabled={score === null || loading} onClick={() => void onSubmit()}>
        {loading ? 'Enviando…' : 'Enviar avaliação'}
      </Button>
    </Card>
  );
}
