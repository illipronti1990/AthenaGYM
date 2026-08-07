'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Plan } from '@movvo/shared';
import { Button, FormSection, FormSelect, formatCurrencyBRL } from '@movvo/ui';
import { matriculasApi } from '../services/matriculasApi';
import { useToast } from '@/components/ui/Toast';

export function ChangePlanForm({
  accessToken,
  enrollmentId,
  currentPlanId,
}: {
  accessToken: string;
  enrollmentId: string;
  currentPlanId: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void matriculasApi.plans(accessToken).then((p) => {
      setPlans(p.filter((x) => x.active !== false && x.id !== currentPlanId));
    });
  }, [accessToken, currentPlanId]);

  const selected = plans.find((p) => p.id === planId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!planId) return;
    setBusy(true);
    try {
      const res = await matriculasApi.changePlan(accessToken, enrollmentId, { planId });
      push(
        `Plano alterado. Diferença: ${formatCurrencyBRL(res.proration)} (crédito ${formatCurrencyBRL(res.credit)})`,
      );
      router.push(`/app/matriculas/${enrollmentId}`);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha na troca', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <FormSection title="Trocar plano">
        <FormSelect
          label="Novo plano"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          options={[
            { value: '', label: 'Selecione…' },
            ...plans.map((p) => ({
              value: p.id,
              label: `${p.name} — ${formatCurrencyBRL(p.price)}`,
            })),
          ]}
        />
        {selected ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Duração {selected.durationDays} dias · A diferença será calculada por prorata.
          </p>
        ) : null}
        <Button type="submit" loading={busy} disabled={!planId} className="mt-3">
          Confirmar troca
        </Button>
      </FormSection>
    </form>
  );
}
