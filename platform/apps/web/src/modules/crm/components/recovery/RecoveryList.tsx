'use client';

import { useEffect, useState } from 'react';
import { Card } from '@movvo/ui';
import type { RecoveryStudent } from '../../services/crmApi';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

const SOURCE_LABEL: Record<string, string> = {
  cancelled: 'Cancelado',
  inactive: 'Inativo',
  low_checkin: 'Baixa frequência',
};

export function RecoveryList({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [students, setStudents] = useState<RecoveryStudent[]>([]);

  useEffect(() => {
    crmApi
      .recovery(accessToken)
      .then(setStudents)
      .catch((e) => push(e instanceof Error ? e.message : 'Falha ao carregar recuperação', 'error'));
  }, [accessToken, push]);

  function urgencyColor(days?: number): string {
    if (days == null) return 'var(--muted)';
    if (days >= 30) return 'var(--primary-hover)';
    if (days >= 14) return 'var(--gold)';
    return 'var(--muted)';
  }

  return (
    <div className="space-y-4" data-testid="recovery-list">
      {students.length === 0 && (
        <p className="text-sm text-[var(--muted)]">Nenhum aluno em recuperação no momento.</p>
      )}
      {students.map((s) => (
        <Card key={`${s.source || 'row'}-${s.studentId}`} hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--text)]">{s.fullName || s.studentName}</p>
              <p className="text-xs text-[var(--muted)]">
                {SOURCE_LABEL[s.source || ''] || s.status || 'Recuperação'}
                {s.reason || s.cancelReason ? ` · ${s.reason || s.cancelReason}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: urgencyColor(s.daysSince) }}>
                {s.daysSince != null ? `${s.daysSince}d` : '—'}
              </p>
              <p className="text-xs text-[var(--muted)]">sem atividade</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
