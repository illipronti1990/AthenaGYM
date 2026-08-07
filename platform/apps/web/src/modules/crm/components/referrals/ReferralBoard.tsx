'use client';

import { useEffect, useState } from 'react';
import type { Referral } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  rewarded: 'Recompensado',
  expired: 'Expirado',
};

function referralTitle(r: Referral): string {
  if (r.notes) return r.notes;
  if (r.referredStudentId) return `Aluno ${r.referredStudentId.slice(0, 8)}`;
  if (r.referredLeadId) return `Lead ${r.referredLeadId.slice(0, 8)}`;
  return `Indicação ${r.id.slice(0, 8)}`;
}

export function ReferralBoard({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewardingId, setRewardingId] = useState<string | null>(null);

  async function load() {
    try {
      setReferrals(await crmApi.referrals(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar indicações', 'error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onReward(id: string) {
    setRewardingId(id);
    try {
      await crmApi.rewardReferral(accessToken, id);
      push('Recompensa aplicada');
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao recompensar indicação', 'error');
    } finally {
      setRewardingId(null);
    }
  }

  const grouped = {
    pending: referrals.filter((r) => r.status === 'pending'),
    rewarded: referrals.filter((r) => r.status === 'rewarded'),
    expired: referrals.filter((r) => r.status === 'expired'),
  };

  return (
    <div className="grid gap-4 md:grid-cols-3" data-testid="referral-board">
      {(Object.keys(grouped) as (keyof typeof grouped)[]).map((status) => (
        <Card key={status}>
          <h2 className="movvo-title mb-3 text-sm">
            {STATUS_LABEL[status]}{' '}
            <span className="font-normal text-[var(--muted)]">({grouped[status].length})</span>
          </h2>
          <ul className="space-y-2 text-sm">
            {grouped[status].map((r) => (
              <li key={r.id} className="rounded-[10px] bg-[var(--background)] px-3 py-2">
                <p className="font-medium text-[var(--text)]">{referralTitle(r)}</p>
                <p className="text-xs text-[var(--muted)]">
                  Indicador: {r.referrerStudentId.slice(0, 8)}
                  {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString('pt-BR')}` : ''}
                </p>
                {status === 'pending' && (
                  <Button
                    variant="secondary"
                    type="button"
                    className="mt-2"
                    disabled={rewardingId === r.id}
                    onClick={() => void onReward(r.id)}
                  >
                    {rewardingId === r.id ? 'Aplicando…' : 'Recompensar'}
                  </Button>
                )}
              </li>
            ))}
            {grouped[status].length === 0 && (
              <li className="text-[var(--muted)]">Nenhuma indicação</li>
            )}
          </ul>
        </Card>
      ))}
    </div>
  );
}
