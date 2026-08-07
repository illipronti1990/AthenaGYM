'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { AccessRules } from '@movvo/shared';
import { Button } from '@movvo/ui';
import { useToast } from '@/components/ui/Toast';
import { acessoApi } from '../services/acessoApi';

export function AccessRulesForm({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rules, setRules] = useState<AccessRules | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    acessoApi
      .rules(accessToken)
      .then(setRules)
      .catch(() => push('Falha ao carregar regras', 'error'));
  }, [accessToken, push]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rules) return;
    setBusy(true);
    try {
      const updated = await acessoApi.updateRules(accessToken, {
        maxCheckinsPerDay: rules.maxCheckinsPerDay,
        minIntervalMinutes: rules.minIntervalMinutes,
        blockOverdue: rules.blockOverdue,
        blockExpiredPlan: rules.blockExpiredPlan,
        blockFrozen: rules.blockFrozen,
        graceDays: rules.graceDays,
        allowedWeekdays: rules.allowedWeekdays,
        allowedHoursJson: rules.allowedHoursJson,
        unitId: rules.unitId || undefined,
      });
      setRules(updated);
      push('Regras salvas');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao salvar', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (!rules) return <p className="text-sm text-[var(--muted)]">Carregando regras…</p>;

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4" data-testid="access-rules-form">
      <label className="block text-sm">
        Máx. check-ins / dia
        <input
          type="number"
          min={1}
          className="movvo-input mt-1 block w-full"
          value={rules.maxCheckinsPerDay}
          onChange={(e) => setRules({ ...rules, maxCheckinsPerDay: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm">
        Intervalo mínimo (min)
        <input
          type="number"
          min={0}
          className="movvo-input mt-1 block w-full"
          value={rules.minIntervalMinutes}
          onChange={(e) => setRules({ ...rules, minIntervalMinutes: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm">
        Dias de carência
        <input
          type="number"
          min={0}
          className="movvo-input mt-1 block w-full"
          value={rules.graceDays}
          onChange={(e) => setRules({ ...rules, graceDays: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm">
        Horário início
        <input
          type="time"
          className="movvo-input mt-1 block w-full"
          value={rules.allowedHoursJson.start}
          onChange={(e) =>
            setRules({
              ...rules,
              allowedHoursJson: { ...rules.allowedHoursJson, start: e.target.value },
            })
          }
        />
      </label>
      <label className="block text-sm">
        Horário fim
        <input
          type="time"
          className="movvo-input mt-1 block w-full"
          value={rules.allowedHoursJson.end}
          onChange={(e) =>
            setRules({
              ...rules,
              allowedHoursJson: { ...rules.allowedHoursJson, end: e.target.value },
            })
          }
        />
      </label>
      <Toggle
        label="Bloquear inadimplente"
        checked={rules.blockOverdue}
        onChange={(v) => setRules({ ...rules, blockOverdue: v })}
      />
      <Toggle
        label="Bloquear plano expirado"
        checked={rules.blockExpiredPlan}
        onChange={(v) => setRules({ ...rules, blockExpiredPlan: v })}
      />
      <Toggle
        label="Bloquear matrícula congelada"
        checked={rules.blockFrozen}
        onChange={(v) => setRules({ ...rules, blockFrozen: v })}
      />
      <Button type="submit" disabled={busy}>
        {busy ? 'Salvando…' : 'Salvar regras'}
      </Button>
    </form>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
