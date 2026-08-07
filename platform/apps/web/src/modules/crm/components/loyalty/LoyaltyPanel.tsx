'use client';

import { useEffect, useState } from 'react';
import type { LoyaltyAccount, LoyaltyEarnRule, LoyaltyReward } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

export function LoyaltyPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [earnRules, setEarnRules] = useState<LoyaltyEarnRule[]>([]);
  const [studentId, setStudentId] = useState('');
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [earnEvent, setEarnEvent] = useState('');
  const [redeemRewardId, setRedeemRewardId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([crmApi.loyaltyRewards(accessToken), crmApi.loyaltyEarnRules(accessToken)])
      .then(([r, e]) => {
        setRewards(r);
        setEarnRules(e);
        if (e[0] && !earnEvent) setEarnEvent(e[0].event);
      })
      .catch((e) => push(e instanceof Error ? e.message : 'Falha ao carregar fidelidade', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, push]);

  async function lookupAccount() {
    if (!studentId) return;
    try {
      setAccount(await crmApi.loyaltyAccount(accessToken, studentId));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Aluno não encontrado', 'error');
    }
  }

  async function onEarn() {
    if (!studentId || !earnEvent) return;
    setLoading(true);
    try {
      const updated = await crmApi.loyaltyEarn(accessToken, { studentId, event: earnEvent });
      setAccount(updated);
      push('Pontos concedidos');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao conceder pontos', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function onRedeem() {
    if (!studentId || !redeemRewardId) return;
    setLoading(true);
    try {
      await crmApi.loyaltyRedeem(accessToken, { studentId, rewardId: redeemRewardId });
      setAccount(await crmApi.loyaltyAccount(accessToken, studentId));
      push('Pontos resgatados com sucesso');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao resgatar pontos', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="loyalty-panel">
      <Card>
        <h2 className="movvo-title mb-3 text-sm">Consultar aluno</h2>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="ID do aluno"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="movvo-input w-72 font-mono text-xs"
            data-testid="loyalty-student-id"
          />
          <Button variant="secondary" type="button" onClick={() => void lookupAccount()}>
            Consultar
          </Button>
        </div>
        {account && (
          <div className="mt-3 rounded-[10px] bg-[var(--background)] px-4 py-3 text-sm">
            <p className="text-[var(--text)]">
              Pontos: <strong className="text-[var(--gold)]">{account.points}</strong> · Nível:{' '}
              <strong>{account.tier}</strong>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                value={earnEvent}
                onChange={(e) => setEarnEvent(e.target.value)}
                className="movvo-input"
              >
                <option value="">Evento de acúmulo</option>
                {earnRules.map((r) => (
                  <option key={r.id} value={r.event}>
                    {r.event} (+{r.points} pts)
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                type="button"
                disabled={loading || !studentId || !earnEvent}
                onClick={() => void onEarn()}
              >
                Conceder pontos
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                value={redeemRewardId}
                onChange={(e) => setRedeemRewardId(e.target.value)}
                className="movvo-input"
              >
                <option value="">Selecionar recompensa</option>
                {rewards.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.pointsCost} pts)
                  </option>
                ))}
              </select>
              <Button
                type="button"
                disabled={loading || !redeemRewardId}
                onClick={() => void onRedeem()}
              >
                Resgatar
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="movvo-title mb-3 text-sm">Recompensas disponíveis</h2>
          <ul className="space-y-2 text-sm">
            {rewards.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <span className="text-[var(--text)]">{r.name}</span>
                <span className="text-[var(--gold)]">{r.pointsCost} pts</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="movvo-title mb-3 text-sm">Regras de acúmulo</h2>
          <ul className="space-y-2 text-sm">
            {earnRules.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <span className="text-[var(--text)]">{r.event}</span>
                <span className="text-[var(--gold)]">+{r.points} pts</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
