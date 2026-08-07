'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Contract } from '@movvo/shared';
import { Button } from '@movvo/ui';
import { matriculasApi } from '@/modules/matriculas/services/matriculasApi';
import { useToast } from '@/components/ui/Toast';

export function ContractsListPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<Contract[]>([]);

  useEffect(() => {
    void matriculasApi
      .contracts(accessToken)
      .then(setItems)
      .catch((e) => push(e instanceof Error ? e.message : 'Falha contratos', 'error'));
  }, [accessToken, push]);

  return (
    <div className="overflow-auto rounded-2xl border border-[var(--border)]">
      <table className="movvo-dg-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Status</th>
            <th>Assinado</th>
            <th>PDF</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.contractNumber}</td>
              <td>{c.status}</td>
              <td>{c.signedAt ? new Date(c.signedAt).toLocaleString('pt-BR') : '—'}</td>
              <td>
                {c.pdfUrl ? (
                  <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="movvo-link text-[var(--gold)]">
                    Abrir PDF
                  </a>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
          {!items.length ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-[var(--muted)]">
                Nenhum contrato.{' '}
                <Link href="/app/matriculas/nova" className="movvo-link text-[var(--gold)]">
                  Nova matrícula
                </Link>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <div className="p-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            void matriculasApi.contracts(accessToken).then(setItems).catch((e) => push(String(e), 'error'))
          }
        >
          Atualizar
        </Button>
      </div>
    </div>
  );
}
