'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FormSection } from '@athena/ui';
import { matriculasApi } from '../services/matriculasApi';
import { useToast } from '@/components/ui/Toast';

export function RenewForm({
  accessToken,
  enrollmentId,
}: {
  accessToken: string;
  enrollmentId: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  async function renew() {
    setBusy(true);
    try {
      await matriculasApi.renew(accessToken, enrollmentId, {});
      push('Matrícula renovada');
      router.push(`/app/matriculas/${enrollmentId}`);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao renovar', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormSection title="Renovação">
      <p className="mb-3 text-sm text-[var(--muted)]">
        A renovação estende a vigência pelo período do plano atual e gera a cobrança correspondente.
      </p>
      <Button type="button" loading={busy} onClick={() => void renew()}>
        Confirmar renovação
      </Button>
    </FormSection>
  );
}
