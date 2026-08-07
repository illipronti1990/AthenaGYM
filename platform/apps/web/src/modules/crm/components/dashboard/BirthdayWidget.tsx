'use client';

import { useEffect, useState } from 'react';
import { Card } from '@movvo/ui';
import type { Birthday } from '../../services/crmApi';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

function birthdayLabel(b: Birthday): string {
  const raw = b.date || b.birthDate;
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function BirthdayWidget({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);

  useEffect(() => {
    crmApi
      .birthdays(accessToken)
      .then(setBirthdays)
      .catch((e) => push(e instanceof Error ? e.message : 'Falha ao carregar aniversariantes', 'error'));
  }, [accessToken, push]);

  return (
    <Card data-testid="birthday-widget">
      <h2 className="movvo-title mb-3 text-sm">Aniversariantes da semana</h2>
      {birthdays.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhum aniversariante nesta semana.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {birthdays.map((b) => (
            <li key={b.studentId} className="flex items-center justify-between">
              <span className="text-[var(--text)]">{b.fullName}</span>
              <span className="text-xs text-[var(--gold)]">{birthdayLabel(b)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
