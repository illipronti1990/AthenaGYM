'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Plan, StudentListItem } from '@movvo/shared';
import { PLAN_TYPE_LABELS, type PlanType } from '@movvo/shared';
import {
  Button,
  FormInput,
  FormRow,
  FormSection,
  FormSelect,
  SignaturePad,
  Wizard,
  formatCurrencyBRL,
  type WizardStep,
} from '@movvo/ui';
import { listAlunos } from '@/modules/alunos/services/alunosApi';
import { matriculasApi } from '../services/matriculasApi';
import { useToast } from '@/components/ui/Toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { ContractPreview } from './ContractPreview';

const STEPS: WizardStep[] = [
  { id: 'student', title: 'Aluno', description: 'Buscar ou cadastrar' },
  { id: 'plan', title: 'Plano', description: 'Escolher o plano' },
  { id: 'extras', title: 'Detalhes', description: 'Desconto' },
  { id: 'payment', title: 'Pagamento', description: 'Forma de pagamento' },
  { id: 'contract', title: 'Contrato', description: 'Revisar e assinar' },
  { id: 'done', title: 'Concluir', description: 'Finalizar matrícula' },
];

const DRAFT_KEY = 'movvo_enrollment_wizard_draft';

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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [planId, setPlanId] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useUnsavedChanges(dirty && step < STEPS.length - 1);

  useEffect(() => {
    void Promise.all([
      matriculasApi.plans(accessToken),
      listAlunos(accessToken, { pageSize: '50' }),
    ])
      .then(([p, s]) => {
        setPlans(p.filter((x) => x.active !== false));
        setStudents(s.items || []);
      })
      .catch((e) => push(e instanceof Error ? e.message : 'Falha ao carregar', 'error'));

    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Record<string, unknown>;
        if (typeof d.fullName === 'string') setFullName(d.fullName);
        if (typeof d.phone === 'string') setPhone(d.phone);
        if (typeof d.planId === 'string') setPlanId(d.planId);
        if (typeof d.discountPercent === 'number') setDiscountPercent(d.discountPercent);
        if (typeof d.paymentMethod === 'string') setPaymentMethod(d.paymentMethod);
      }
    } catch {
      /* ignore */
    }
  }, [accessToken, push]);

  useEffect(() => {
    if (!dirty) return;
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ fullName, phone, planId, discountPercent, paymentMethod }),
    );
  }, [dirty, fullName, phone, planId, discountPercent, paymentMethod]);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === planId), [plans, planId]);
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === studentId),
    [students, studentId],
  );
  const discountAmount = selectedPlan ? (selectedPlan.price * discountPercent) / 100 : 0;
  const finalPrice = selectedPlan ? Math.max(0, selectedPlan.price - discountAmount) : 0;

  function markDirty() {
    setDirty(true);
  }

  const canNext =
    step === 0
      ? mode === 'search'
        ? Boolean(studentId)
        : fullName.trim().length >= 2
      : step === 1
        ? Boolean(planId)
        : step === 4
          ? Boolean(signatureData)
          : true;

  async function finish() {
    if (!selectedPlan) {
      push('Selecione um plano', 'error');
      return;
    }
    setBusy(true);
    try {
      const result = await matriculasApi.complete(accessToken, {
        studentId: mode === 'search' ? studentId : undefined,
        fullName: mode === 'new' ? fullName : selectedStudent?.fullName,
        phone: mode === 'new' ? phone || undefined : undefined,
        cpf: mode === 'new' ? cpf || undefined : undefined,
        unitId: unitId || undefined,
        planId: selectedPlan.id,
        discountPercent,
        discountAmount,
        paymentMethod,
        signatureData: signatureData || undefined,
        signedName: mode === 'new' ? fullName : selectedStudent?.fullName,
      });
      sessionStorage.removeItem(DRAFT_KEY);
      setDirty(false);
      push('Matrícula concluída com sucesso');
      router.push(`/app/matriculas/${result.enrollment.id}`);
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
      canNext={canNext}
      onFinish={() => void finish()}
      finishLabel="Concluir matrícula"
    >
      {step === 0 ? (
        <FormSection title="Aluno">
          <div className="mb-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === 'search' ? 'primary' : 'secondary'}
              onClick={() => setMode('search')}
            >
              Buscar aluno
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'new' ? 'primary' : 'secondary'}
              onClick={() => setMode('new')}
            >
              Novo aluno
            </Button>
          </div>
          {mode === 'search' ? (
            <FormSelect
              label="Aluno"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                markDirty();
              }}
              options={[
                { value: '', label: 'Selecione…' },
                ...students.map((s) => ({ value: s.id, label: s.fullName })),
              ]}
            />
          ) : (
            <FormRow>
              <FormInput
                label="Nome"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  markDirty();
                }}
              />
              <FormInput
                label="Telefone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  markDirty();
                }}
              />
              <FormInput
                label="CPF"
                value={cpf}
                onChange={(e) => {
                  setCpf(e.target.value);
                  markDirty();
                }}
              />
            </FormRow>
          )}
        </FormSection>
      ) : null}

      {step === 1 ? (
        <FormSection title="Plano">
          <div className="grid gap-3 md:grid-cols-2">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  setPlanId(plan.id);
                  markDirty();
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  planId === plan.id
                    ? 'border-[var(--primary)] bg-[rgba(160,0,24,0.08)]'
                    : 'border-[var(--border)] bg-[var(--card)]'
                }`}
                data-testid={`pick-plan-${plan.id}`}
              >
                <p className="font-semibold">{plan.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {PLAN_TYPE_LABELS[plan.planType as PlanType] || plan.planType} · {plan.durationDays}{' '}
                  dias
                </p>
                <p className="mt-2 text-[var(--gold)]">{formatCurrencyBRL(plan.price)}</p>
              </button>
            ))}
          </div>
        </FormSection>
      ) : null}

      {step === 2 ? (
        <FormSection title="Detalhes">
          <FormRow>
            <FormInput
              label="Desconto (%)"
              type="number"
              min={0}
              max={100}
              value={String(discountPercent)}
              onChange={(e) => {
                setDiscountPercent(Number(e.target.value) || 0);
                markDirty();
              }}
            />
            <div>
              <p className="movvo-label">Valor final</p>
              <p className="text-xl text-[var(--gold)]">{formatCurrencyBRL(finalPrice)}</p>
            </div>
          </FormRow>
        </FormSection>
      ) : null}

      {step === 3 ? (
        <FormSection title="Pagamento">
          <FormSelect
            label="Forma de pagamento"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              markDirty();
            }}
            options={[
              { value: 'pix', label: 'PIX' },
              { value: 'cartao', label: 'Cartão' },
              { value: 'boleto', label: 'Boleto' },
              { value: 'dinheiro', label: 'Dinheiro' },
              { value: 'debito_automatico', label: 'Débito automático' },
            ]}
          />
        </FormSection>
      ) : null}

      {step === 4 ? (
        <FormSection title="Contrato e assinatura">
          <ContractPreview
            studentName={mode === 'new' ? fullName : selectedStudent?.fullName || '—'}
            cpf={cpf || '—'}
            planName={selectedPlan?.name || '—'}
            price={finalPrice}
            unitLabel="Unidade atual"
          />
          <div className="mt-4">
            <SignaturePad
              label="Assinatura do aluno"
              onSave={(data) => {
                setSignatureData(data);
                markDirty();
                push('Assinatura capturada');
              }}
            />
            {signatureData ? (
              <p className="mt-2 text-sm text-[var(--success)]">Assinatura pronta para envio.</p>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">Assine e clique em salvar no pad.</p>
            )}
          </div>
        </FormSection>
      ) : null}

      {step === 5 ? (
        <FormSection title="Resumo">
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Aluno:</strong>{' '}
              {mode === 'new' ? fullName : selectedStudent?.fullName || '—'}
            </li>
            <li>
              <strong>Plano:</strong> {selectedPlan?.name || '—'}
            </li>
            <li>
              <strong>Valor:</strong> {formatCurrencyBRL(finalPrice)}
            </li>
            <li>
              <strong>Pagamento:</strong> {paymentMethod}
            </li>
            <li>
              <strong>Assinatura:</strong> {signatureData ? 'Registrada' : 'Pendente'}
            </li>
          </ul>
        </FormSection>
      ) : null}
    </Wizard>
  );
}
