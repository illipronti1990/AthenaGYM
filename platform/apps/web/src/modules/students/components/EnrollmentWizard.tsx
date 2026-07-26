'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Plan } from '@athena/shared';
import {
  Button,
  CurrencyInput,
  DatePicker,
  FormInput,
  FormRow,
  FormSection,
  FormSelect,
  Wizard,
  type WizardStep,
} from '@athena/ui';
import { createStudent } from '../services/studentsApi';
import { salesApi } from '@/modules/sales/services/salesApi';
import { financeApi } from '@/modules/finance/services/financeApi';
import { useToast } from '@/components/ui/Toast';
import { formsApi } from '@/modules/forms/services/formsApi';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

const STEPS: WizardStep[] = [
  { id: 'student', title: 'Aluno', description: 'Dados essenciais do aluno' },
  { id: 'plan', title: 'Plano', description: 'Escolha o plano da matrícula' },
  { id: 'payment', title: 'Pagamento', description: 'Gere a primeira cobrança' },
  { id: 'done', title: 'Concluir', description: 'Revise e finalize' },
];

export function EnrollmentWizard({
  accessToken,
  unitId,
}: {
  accessToken: string;
  unitId: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [planName, setPlanName] = useState('');
  const [amount, setAmount] = useState(129);
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [studentId, setStudentId] = useState<string | null>(null);

  useUnsavedChanges(dirty && !studentId);

  useEffect(() => {
    void salesApi.plans(accessToken).then((p) => setPlans(p.filter((x) => x.active !== false)));
  }, [accessToken]);

  useEffect(() => {
    const selected = plans.find((p) => p.name === planName);
    if (selected) setAmount(selected.price);
  }, [planName, plans]);

  async function finish() {
    setBusy(true);
    try {
      let id = studentId;
      if (!id) {
        const created = await createStudent(accessToken, {
          fullName,
          phone: phone || undefined,
          status: 'active',
          planName: planName || undefined,
          ...(unitId ? { unitId } : {}),
        });
        id = created.id;
        setStudentId(id);
      }

      if (amount > 0) {
        await financeApi.createReceivable(accessToken, {
          studentId: id,
          description: planName ? `Matrícula — ${planName}` : 'Matrícula',
          amount,
          dueDate,
        });
      }

      await formsApi
        .createTemplate(accessToken, {
          kind: 'enrollment',
          name: `Matrícula ${planName || 'padrão'}`,
          payload: { planName, amount },
        })
        .catch(() => null);

      setDirty(false);
      push('Matrícula concluída com sucesso.');
      router.push(`/app/students/${id}`);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha na matrícula', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Wizard
      steps={STEPS}
      current={step}
      onChange={setStep}
      busy={busy}
      canNext={
        step === 0
          ? Boolean(fullName.trim())
          : step === 1
            ? Boolean(planName)
            : true
      }
      onFinish={() => void finish()}
      finishLabel="Finalizar matrícula"
    >
      {step === 0 ? (
        <FormSection title="Aluno">
          <FormRow>
            <FormInput
              label="Nome completo"
              value={fullName}
              onChange={(e) => {
                setDirty(true);
                setFullName(e.target.value);
              }}
              required
            />
            <FormInput
              label="Telefone"
              value={phone}
              onChange={(e) => {
                setDirty(true);
                setPhone(e.target.value);
              }}
            />
          </FormRow>
        </FormSection>
      ) : null}

      {step === 1 ? (
        <FormSection title="Plano">
          <FormSelect
            label="Plano"
            value={planName}
            onChange={(e) => {
              setDirty(true);
              setPlanName(e.target.value);
            }}
            options={[
              { value: '', label: 'Selecione…' },
              ...plans.map((p) => ({
                value: p.name,
                label: `${p.name} · ${p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
              })),
            ]}
          />
        </FormSection>
      ) : null}

      {step === 2 ? (
        <FormSection title="Pagamento">
          <FormRow>
            <CurrencyInput
              label="Valor da 1ª cobrança"
              value={amount}
              onChange={(n) => {
                setDirty(true);
                setAmount(n);
              }}
            />
            <DatePicker
              label="Vencimento"
              value={dueDate}
              onChange={(v) => {
                setDirty(true);
                setDueDate(v);
              }}
            />
          </FormRow>
        </FormSection>
      ) : null}

      {step === 3 ? (
        <FormSection title="Resumo">
          <ul className="space-y-2 text-sm text-[var(--text)]">
            <li>
              <strong>Aluno:</strong> {fullName}
            </li>
            <li>
              <strong>Plano:</strong> {planName || '—'}
            </li>
            <li>
              <strong>Cobrança:</strong>{' '}
              {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {dueDate}
            </li>
          </ul>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Ao finalizar, o aluno é criado, a cobrança é gerada e um template da matrícula fica disponível.
          </p>
          <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => setStep(0)}>
            Revisar dados
          </Button>
        </FormSection>
      ) : null}
    </Wizard>
  );
}
