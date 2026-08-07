'use client';

import { formatCurrencyBRL } from '@movvo/ui';

export function ContractPreview({
  studentName,
  cpf,
  planName,
  price,
  unitLabel,
}: {
  studentName: string;
  cpf: string;
  planName: string;
  price: number;
  unitLabel: string;
}) {
  const today = new Date().toLocaleDateString('pt-BR');
  return (
    <div
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm leading-relaxed"
      data-testid="contract-preview"
    >
      <h3 className="movvo-title mb-3 text-lg text-[var(--gold)]">Contrato de Matrícula</h3>
      <p>
        Eu, <strong>{studentName}</strong>, CPF <strong>{cpf}</strong>, declaro estar ciente das
        condições do plano <strong>{planName}</strong> no valor de{' '}
        <strong>{formatCurrencyBRL(price)}</strong>, na unidade <strong>{unitLabel}</strong>, com
        data de adesão em <strong>{today}</strong>.
      </p>
      <p className="mt-3 text-[var(--muted)]">
        Ao assinar digitalmente, o contrato será gerado em PDF e vinculado à matrícula.
      </p>
    </div>
  );
}
