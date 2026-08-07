'use client';

import { useEffect, useState } from 'react';
import type { AutomationFlow } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

export function AutomationStub({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);

  async function load() {
    try {
      setAutomations(await crmApi.automations(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar automações', 'error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onRun(id: string) {
    setRunningId(id);
    try {
      await crmApi.runAutomation(accessToken, id);
      push('Automação executada');
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao executar automação', 'error');
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="space-y-4" data-testid="automation-stub">
      <p className="text-sm text-[var(--muted)]">
        Automações de marketing e reengajamento. Configuração avançada disponível em breve.
      </p>
      {automations.length === 0 && (
        <Card>
          <p className="text-sm text-[var(--muted)]">Nenhuma automação configurada.</p>
        </Card>
      )}
      <ul className="movvo-list text-sm">
        {automations.map((a) => (
          <li key={a.id} className="movvo-list-item">
            <div>
              <p className="font-medium text-[var(--text)]">{a.name}</p>
              <p className="text-xs text-[var(--muted)]">Gatilho: {a.triggerEvent}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-semibold"
                style={{ color: a.active ? 'var(--success)' : 'var(--muted)' }}
              >
                {a.active ? 'ativa' : 'inativa'}
              </span>
              <Button
                variant="secondary"
                type="button"
                disabled={runningId === a.id || !a.active}
                onClick={() => void onRun(a.id)}
              >
                {runningId === a.id ? 'Executando…' : 'Executar'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
