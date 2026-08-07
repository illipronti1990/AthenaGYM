'use client';

import { useEffect, useState } from 'react';
import type { DelinquencyReport } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { financeApi } from '../services/financeApi';
import { useToast } from '@/components/ui/Toast';
import { TableSkeleton } from '@/components/ui/Skeleton';

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, '');
}

function whatsappHref(phone: string, name: string, amount: number) {
  const digits = digitsOnly(phone);
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  const msg = encodeURIComponent(
    `Olá ${name}, identificamos um saldo em aberto de ${amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })}. Podemos ajudar com a regularização?`,
  );
  return `https://wa.me/${withCountry}?text=${msg}`;
}

export function DelinquencyPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [data, setData] = useState<DelinquencyReport | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await financeApi.delinquency(accessToken));
      } catch (e) {
        push(e instanceof Error ? e.message : 'Falha ao carregar inadimplência', 'error');
        setData({ count: 0, totalAmount: 0, revenueAtRiskPercent: 0, items: [] });
      }
    })();
  }, [accessToken, push]);

  if (!data) return <TableSkeleton rows={5} />;

  return (
    <div className="space-y-4" data-testid="delinquency-panel">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Inadimplentes</p>
          <p className="mt-2 text-2xl font-bold">{data.count}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Valor em atraso</p>
          <p className="mt-2 text-2xl font-bold text-[var(--danger,#dc2626)]">
            {data.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Receita em risco</p>
          <p className="mt-2 text-2xl font-bold">{data.revenueAtRiskPercent}%</p>
        </Card>
      </div>

      {data.items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhum aluno inadimplente no momento.</p>
      ) : (
        <ul className="movvo-list">
          {data.items.map((item) => (
            <li key={item.studentId} className="movvo-list-item flex-wrap gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.studentName}</p>
                <p className="text-sm text-[var(--muted)]">
                  {item.daysOverdue} dia{item.daysOverdue === 1 ? '' : 's'} ·{' '}
                  {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ·{' '}
                  {item.receivableIds.length} cobrança(s)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.phone ? (
                  <a
                    href={whatsappHref(item.phone, item.studentName, item.amount)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="movvo-btn movvo-btn-secondary movvo-btn-sm"
                  >
                    WhatsApp
                  </a>
                ) : null}
                {item.email ? (
                  <a
                    href={`mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(
                      'Regularização de mensalidade — Athena Gym',
                    )}&body=${encodeURIComponent(
                      `Olá ${item.studentName},\n\nIdentificamos um saldo em aberto de ${item.amount.toLocaleString(
                        'pt-BR',
                        { style: 'currency', currency: 'BRL' },
                      )}.\n\nPodemos ajudar com a regularização?`,
                    )}`}
                    className="movvo-btn movvo-btn-secondary movvo-btn-sm"
                  >
                    E-mail
                  </a>
                ) : null}
                {!item.phone && !item.email ? (
                  <Button type="button" variant="secondary" size="sm" disabled>
                    Sem contato
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
