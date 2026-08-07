'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CANCEL_REASONS } from '@movvo/shared';
import { Button, FormInput, FormSection, FormSelect } from '@movvo/ui';
import { matriculasApi } from '../services/matriculasApi';
import { useToast } from '@/components/ui/Toast';

export function CancelForm({
  accessToken,
  enrollmentId,
}: {
  accessToken: string;
  enrollmentId: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [reason, setReason] = useState('mudanca');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await matriculasApi.cancel(accessToken, enrollmentId, {
        reason,
        notes: notes || undefined,
      });
      push('Matrícula cancelada');
      router.push(`/app/matriculas/${enrollmentId}`);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao cancelar', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <FormSection title="Cancelamento">
        <FormSelect
          label="Motivo"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={CANCEL_REASONS.map((r) => ({ value: r.value, label: r.label }))}
        />
        <FormInput label="Observação" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit" variant="danger" loading={busy} className="mt-3">
          Confirmar cancelamento
        </Button>
      </FormSection>
    </form>
  );
}
