'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FormInput, FormRow, FormSection } from '@athena/ui';
import { matriculasApi } from '../services/matriculasApi';
import { useToast } from '@/components/ui/Toast';

export function FreezeForm({
  accessToken,
  enrollmentId,
}: {
  accessToken: string;
  enrollmentId: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await matriculasApi.freeze(accessToken, enrollmentId, {
        startDate,
        endDate,
        reason,
        notes: notes || undefined,
      });
      push('Matrícula congelada');
      router.push(`/app/matriculas/${enrollmentId}`);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao congelar', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <FormSection title="Congelamento">
        <FormRow>
          <FormInput
            label="Início"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <FormInput
            label="Fim"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </FormRow>
        <FormInput
          label="Motivo"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <FormInput label="Observação" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit" loading={busy} className="mt-3">
          Confirmar congelamento
        </Button>
      </FormSection>
    </form>
  );
}
