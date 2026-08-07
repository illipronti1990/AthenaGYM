'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { PartnerAccessRequest, PartnerIntegration, PartnerProvider } from '@movvo/shared';
import { Button } from '@movvo/ui';
import { operationsApi } from '../services/operationsApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ux/ConfirmProvider';

const PROVIDER_LABEL: Record<PartnerProvider, string> = {
  wellhub: 'Wellhub',
  totalpass: 'TotalPass',
};

type Filter = 'pending' | 'all' | 'approved' | 'rejected';

export function PartnersPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const confirm = useConfirm();
  const [integrations, setIntegrations] = useState<PartnerIntegration[] | null>(null);
  const [requests, setRequests] = useState<PartnerAccessRequest[] | null>(null);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [provider, setProvider] = useState<PartnerProvider>('wellhub');
  const [memberDocument, setMemberDocument] = useState('');

  async function load() {
    try {
      const [ints, reqs] = await Promise.all([
        operationsApi.partnerIntegrations(accessToken),
        operationsApi.partnerAccessRequests(
          accessToken,
          filter === 'all' ? undefined : filter,
        ),
      ]);
      setIntegrations(ints);
      setRequests(reqs);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar parceiros', 'error');
      setIntegrations([]);
      setRequests([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, filter]);

  const pendingCount = useMemo(
    () => (filter === 'pending' ? (requests?.length ?? 0) : null),
    [filter, requests],
  );

  async function toggleIntegration(item: PartnerIntegration) {
    try {
      await operationsApi.updatePartnerIntegration(accessToken, {
        provider: item.provider,
        enabled: !item.enabled,
        externalGymId: item.externalGymId,
      });
      push(`${PROVIDER_LABEL[item.provider]} ${item.enabled ? 'desativado' : 'ativado'}`);
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao atualizar integração', 'error');
    }
  }

  async function onApprove(id: string) {
    setBusyId(id);
    try {
      await operationsApi.approvePartnerAccess(accessToken, id);
      push('Acesso aprovado');
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao aprovar', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(id: string) {
    const ok = await confirm({
      title: 'Recusar este login externo?',
      message: 'O beneficiário não poderá acessar até uma nova solicitação.',
      confirmLabel: 'Recusar',
      danger: true,
    });
    if (!ok) return;
    setBusyId(id);
    try {
      await operationsApi.rejectPartnerAccess(accessToken, id, 'Recusado na recepção');
      push('Acesso recusado');
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao recusar', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function onSimulate(e: FormEvent) {
    e.preventDefault();
    if (!memberName.trim()) {
      push('Informe o nome do beneficiário', 'error');
      return;
    }
    try {
      await operationsApi.createPartnerAccessRequest(accessToken, {
        provider,
        memberName: memberName.trim(),
        memberDocument: memberDocument.trim() || undefined,
      });
      push('Solicitação registrada — aguardando aprovação');
      setMemberName('');
      setMemberDocument('');
      setFilter('pending');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao registrar', 'error');
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-2">
        {!integrations ? (
          <TableSkeleton rows={2} />
        ) : integrations.length === 0 ? (
          <p className="text-sm text-[var(--muted)] sm:col-span-2">
            Nenhuma integração configurada ainda.
          </p>
        ) : (
          integrations.map((item) => (
            <div
              key={item.id}
              className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4"
              data-testid={`partner-card-${item.provider}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="movvo-title text-lg">{PROVIDER_LABEL[item.provider]}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Status:{' '}
                    <span className="text-[var(--gold)]">
                      {item.enabled ? item.status : 'desativado'}
                    </span>
                  </p>
                  {item.externalGymId ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">ID academia: {item.externalGymId}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void toggleIntegration(item)}
                  data-testid={`toggle-${item.provider}`}
                >
                  {item.enabled ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="movvo-title text-xl">Aprovar logins externos</h2>
            <p className="text-sm text-[var(--muted)]">
              Libere ou recuse check-ins Wellhub e TotalPass na recepção
              {pendingCount != null ? ` · ${pendingCount} pendente(s)` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['pending', 'all', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`movvo-chip-nav ${filter === f ? 'bg-[var(--primary)] text-white' : ''}`}
                onClick={() => setFilter(f)}
                data-testid={`filter-${f}`}
              >
                {f === 'pending'
                  ? 'Pendentes'
                  : f === 'all'
                    ? 'Todos'
                    : f === 'approved'
                      ? 'Aprovados'
                      : 'Recusados'}
              </button>
            ))}
          </div>
        </div>

        {!requests ? (
          <TableSkeleton />
        ) : requests.length === 0 ? (
          <p className="rounded-[12px] border border-[var(--border)] p-6 text-sm text-[var(--muted)]">
            Nenhuma solicitação neste filtro. Use o formulário abaixo para simular um login parceiro.
          </p>
        ) : (
          <div className="movvo-list overflow-x-auto">
            <table className="movvo-table" data-testid="partner-requests-table">
              <thead>
                <tr>
                  <th>Parceiro</th>
                  <th>Beneficiário</th>
                  <th>Documento</th>
                  <th>Horário</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{PROVIDER_LABEL[r.provider]}</td>
                    <td>{r.memberName}</td>
                    <td>{r.memberDocument || '—'}</td>
                    <td>{new Date(r.createdAt).toLocaleString('pt-BR')}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => void onApprove(r.id)}
                            data-testid={`approve-partner-${r.id}`}
                          >
                            {busyId === r.id ? '…' : 'Aprovar'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="border-[var(--primary)] text-[var(--primary-hover)]"
                            disabled={busyId === r.id}
                            onClick={() => void onReject(r.id)}
                            data-testid={`reject-partner-${r.id}`}
                          >
                            Recusar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">
                          {r.rejectReason || r.decidedAt
                            ? new Date(r.decidedAt || r.createdAt).toLocaleString('pt-BR')
                            : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="movvo-title mb-3 text-lg">Registrar login parceiro</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Use para testar ou registrar manualmente um check-in que chegou pela Wellhub/TotalPass.
        </p>
        <form
          onSubmit={onSimulate}
          className="grid max-w-2xl gap-3 sm:grid-cols-2"
          data-testid="partner-sim-form"
        >
          <select
            className="movvo-input"
            value={provider}
            onChange={(e) => setProvider(e.target.value as PartnerProvider)}
            data-testid="partner-provider"
          >
            <option value="wellhub">Wellhub</option>
            <option value="totalpass">TotalPass</option>
          </select>
          <input
            required
            className="movvo-input"
            placeholder="Nome do beneficiário"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            data-testid="partner-member-name"
          />
          <input
            className="movvo-input sm:col-span-2"
            placeholder="Documento (opcional)"
            value={memberDocument}
            onChange={(e) => setMemberDocument(e.target.value)}
            data-testid="partner-member-document"
          />
          <Button type="submit" className="sm:col-span-2" data-testid="partner-sim-submit">
            Enviar para aprovação
          </Button>
        </form>
      </section>
    </div>
  );
}
