'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { STUDENT_STATUSES, STUDENT_STATUS_LABELS, isValidCpf, normalizeCpf } from '@movvo/shared';
import type { Plan, UserListItem } from '@movvo/shared';
import {
  Button,
  Form,
  FormActions,
  FormInput,
  FormProgress,
  FormRow,
  FormSection,
  FormSelect,
  Textarea,
  CpfInput,
  PhoneInput,
  CepInput,
  DatePicker,
} from '@movvo/ui';
import { createAluno, updateAluno } from '../services/alunosApi';
import { salesApi } from '@/modules/sales/services/salesApi';
import { apiGetMe, apiListUsers } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { formsApi } from '@/modules/forms/services/formsApi';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

const MARITAL_OPTIONS = [
  { value: '', label: 'Selecione…' },
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União estável' },
] as const;

const GENDER_OPTIONS = [
  { value: '', label: 'Selecione…' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informado', label: 'Prefiro não informar' },
] as const;

function isTrainerUser(u: UserListItem) {
  return u.roles.some((r) => {
    const n = r.toLowerCase();
    return (
      n.includes('professor') ||
      n.includes('trainer') ||
      n.includes('treinador') ||
      n.includes('personal')
    );
  });
}

export function AlunoForm({
  accessToken,
  unitId: initialUnitId,
  units = [],
  initial,
  studentId,
}: {
  accessToken: string;
  unitId: string;
  units?: Array<{ id: string; name: string }>;
  studentId?: string;
  initial?: Partial<{
    fullName: string;
    socialName: string;
    cpf: string;
    rg: string;
    birthDate: string;
    gender: string;
    maritalStatus: string;
    profession: string;
    email: string;
    phone: string;
    whatsapp: string;
    status: string;
    planName: string;
    trainerName: string;
    notes: string;
    zipcode: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
    emergencyName: string;
    emergencyPhone: string;
    emergencyRel: string;
  }>;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [unitId, setUnitId] = useState(initialUnitId);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trainers, setTrainers] = useState<UserListItem[]>([]);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepHint, setCepHint] = useState<string | undefined>();
  const [existing, setExisting] = useState<{
    id: string;
    fullName: string;
    status: string;
  } | null>(null);
  const [form, setForm] = useState({
    fullName: initial?.fullName || '',
    socialName: initial?.socialName || '',
    cpf: initial?.cpf || '',
    rg: initial?.rg || '',
    birthDate: initial?.birthDate || '',
    gender: normalizeGender(initial?.gender || ''),
    maritalStatus: initial?.maritalStatus || '',
    profession: initial?.profession || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    whatsapp: initial?.whatsapp || '',
    status: initial?.status || 'pre_registration',
    planName: initial?.planName || '',
    trainerName: initial?.trainerName || '',
    notes: initial?.notes || '',
    zipcode: initial?.zipcode || '',
    street: initial?.street || '',
    number: initial?.number || '',
    complement: initial?.complement || '',
    district: initial?.district || '',
    city: initial?.city || '',
    state: initial?.state || '',
    emergencyName: initial?.emergencyName || '',
    emergencyPhone: initial?.emergencyPhone || '',
    emergencyRel: initial?.emergencyRel || '',
  });

  useUnsavedChanges(dirty && !loading);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (isUuid(initialUnitId)) setUnitId(initialUnitId);
  }, [initialUnitId]);

  useEffect(() => {
    void (async () => {
      try {
        const [p, users] = await Promise.all([
          salesApi.plans(accessToken).catch(() => [] as Plan[]),
          apiListUsers(accessToken).catch(() => [] as UserListItem[]),
        ]);
        setPlans(p.filter((x) => x.active !== false));
        setTrainers(users.filter(isTrainerUser));
      } catch {
        /* selects vazios */
      }
    })();
  }, [accessToken]);

  useEffect(() => {
    if (isUuid(unitId)) return;
    void (async () => {
      try {
        const me = await apiGetMe(accessToken);
        const resolved =
          [me.auth.defaultUnitId, me.profile.defaultUnitId, ...me.auth.unitIds, me.units[0]?.id].find(
            isUuid,
          ) || '';
        if (resolved) setUnitId(resolved);
      } catch {
        /* ignore */
      }
    })();
  }, [accessToken, unitId]);

  const onLookupCep = useCallback(
    async (digits: string) => {
      setCepLoading(true);
      setCepHint(undefined);
      try {
        const addr = await formsApi.lookupCep(accessToken, digits);
        setDirty(true);
        setForm((prev) => ({
          ...prev,
          zipcode: addr.zipcode,
          street: addr.street || prev.street,
          district: addr.district || prev.district,
          city: addr.city || prev.city,
          state: addr.state || prev.state,
        }));
        setCepHint('Endereço preenchido automaticamente');
      } catch (e) {
        setCepHint(e instanceof Error ? e.message : 'CEP não encontrado');
      } finally {
        setCepLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    const digits = normalizeCpf(form.cpf);
    if (digits.length !== 11 || !isValidCpf(digits) || studentId) {
      setExisting(null);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await formsApi.lookupCpf(accessToken, digits);
          if (res.exists && res.student) {
            setExisting({
              id: res.student.id,
              fullName: res.student.fullName,
              status: res.student.status,
            });
          } else {
            setExisting(null);
          }
        } catch {
          setExisting(null);
        }
      })();
    }, 450);
    return () => clearTimeout(t);
  }, [accessToken, form.cpf, studentId]);

  const progress = useMemo(() => {
    const checks = [
      form.fullName.trim(),
      form.cpf && isValidCpf(form.cpf),
      form.phone || form.whatsapp,
      form.email,
      form.zipcode,
      form.planName,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [form]);

  const cpfState =
    !form.cpf ? 'idle' : isValidCpf(form.cpf) ? (existing ? 'warning' : 'valid') : 'invalid';
  const cpfHint = !form.cpf
    ? undefined
    : !isValidCpf(form.cpf)
      ? 'CPF inválido'
      : existing
        ? 'CPF já cadastrado'
        : 'CPF válido';

  const save = useCallback(async () => {
    if (!form.fullName.trim()) {
      push('Nome obrigatório', 'error');
      return;
    }
    if (form.cpf && !isValidCpf(form.cpf)) {
      push('CPF inválido', 'error');
      return;
    }
    if (!isUuid(unitId) && units.length > 0) {
      push('Selecione a unidade', 'error');
      return;
    }
    setLoading(true);
    try {
      const addressPayload = {
        zipcode: form.zipcode || undefined,
        street: form.street || undefined,
        number: form.number || undefined,
        complement: form.complement || undefined,
        district: form.district || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
      };
      const hasAddress = Object.values(addressPayload).some(Boolean);
      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        socialName: form.socialName || undefined,
        cpf: form.cpf || undefined,
        rg: form.rg || undefined,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        maritalStatus: form.maritalStatus || undefined,
        profession: form.profession || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        status: form.status,
        planName: form.planName || undefined,
        trainerName: form.trainerName || undefined,
        notes: form.notes || undefined,
        address: hasAddress ? addressPayload : undefined,
        emergencyContacts: form.emergencyName
          ? [
              {
                name: form.emergencyName,
                phone: form.emergencyPhone || undefined,
                relationship: form.emergencyRel || undefined,
              },
            ]
          : undefined,
      };
      if (isUuid(unitId)) payload.unitId = unitId;

      const saved = studentId
        ? await updateAluno(accessToken, studentId, payload)
        : await createAluno(accessToken, payload);
      setDirty(false);
      push(studentId ? 'Aluno atualizado' : 'Aluno cadastrado com sucesso.');
      router.push(`/app/alunos/${saved.id}`);
      router.refresh();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao salvar', 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, form, push, router, studentId, unitId, units.length, setDirty]);

  useEffect(() => {
    function onSave() {
      void save();
    }
    window.addEventListener('athena:save', onSave);
    return () => window.removeEventListener('athena:save', onSave);
  }, [save]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await save();
  }

  const planOptions = ensureOption(
    plans.map((p) => ({ value: p.name, label: `${p.name} · ${formatMoney(p.price)}` })),
    form.planName,
  );
  const trainerOptions = ensureOption(
    trainers.map((t) => ({
      value: t.fullName || t.email || t.id,
      label: t.fullName || t.email || t.id.slice(0, 8),
    })),
    form.trainerName,
  );

  return (
    <Form onSubmit={onSubmit} data-testid="student-form">
      <FormProgress value={progress} />

      {existing ? (
        <div className="movvo-existing-student" data-testid="existing-student-banner">
          <div>
            <p className="font-medium text-[var(--text)]">Este aluno já existe.</p>
            <p className="text-sm text-[var(--muted)]">
              {existing.fullName} · {STUDENT_STATUS_LABELS[existing.status as keyof typeof STUDENT_STATUS_LABELS] || existing.status}
            </p>
          </div>
          <Link href={`/app/alunos/${existing.id}`}>
            <Button type="button" variant="secondary" size="sm">
              Abrir cadastro
            </Button>
          </Link>
        </div>
      ) : null}

      <FormSection title="Dados Pessoais">
        <FormRow>
          {units.length > 0 ? (
            <FormSelect
              label="Unidade"
              value={unitId}
              onChange={(e) => {
                setDirty(true);
                setUnitId(e.target.value);
              }}
              options={[
                { value: '', label: 'Selecione…' },
                ...units.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
          ) : (
            <div />
          )}
          <FormInput
            label="Nome completo"
            value={form.fullName}
            onChange={(e) => patch('fullName', e.target.value)}
            required
            state={form.fullName.trim() ? 'valid' : 'idle'}
          />
        </FormRow>
        <FormRow>
          <FormInput
            label="Nome social"
            value={form.socialName}
            onChange={(e) => patch('socialName', e.target.value)}
          />
          <CpfInput
            value={form.cpf}
            onChange={(masked) => patch('cpf', masked)}
            state={cpfState === 'warning' ? 'invalid' : cpfState}
            hint={cpfHint}
          />
        </FormRow>
        <FormRow cols={3}>
          <FormInput label="RG" value={form.rg} onChange={(e) => patch('rg', e.target.value)} />
          <DatePicker
            label="Data de nascimento"
            value={form.birthDate}
            onChange={(v) => patch('birthDate', v)}
            showShortcuts={false}
          />
          <FormSelect
            label="Gênero"
            value={form.gender}
            onChange={(e) => patch('gender', e.target.value)}
            options={[...GENDER_OPTIONS]}
          />
        </FormRow>
        <FormRow>
          <FormSelect
            label="Estado civil"
            value={form.maritalStatus}
            onChange={(e) => patch('maritalStatus', e.target.value)}
            options={[...MARITAL_OPTIONS]}
          />
          <FormInput
            label="Profissão"
            value={form.profession}
            onChange={(e) => patch('profession', e.target.value)}
          />
        </FormRow>
        <FormRow>
          <FormSelect
            label="Status"
            value={form.status}
            onChange={(e) => patch('status', e.target.value)}
            options={STUDENT_STATUSES.map((s) => ({
              value: s,
              label: STUDENT_STATUS_LABELS[s],
            }))}
          />
          <FormSelect
            label="Plano"
            value={form.planName}
            onChange={(e) => patch('planName', e.target.value)}
            options={[{ value: '', label: 'Selecione…' }, ...planOptions]}
          />
        </FormRow>
        <FormRow cols={1}>
          <FormSelect
            label="Professor"
            value={form.trainerName}
            onChange={(e) => patch('trainerName', e.target.value)}
            options={[{ value: '', label: 'Selecione…' }, ...trainerOptions]}
          />
        </FormRow>
      </FormSection>

      <FormSection title="Contato">
        <FormRow>
          <PhoneInput
            label="Telefone"
            value={form.phone}
            onChange={(masked) => patch('phone', masked)}
          />
          <PhoneInput
            label="WhatsApp"
            value={form.whatsapp}
            onChange={(masked) => patch('whatsapp', masked)}
          />
        </FormRow>
        <FormRow cols={1}>
          <FormInput
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => patch('email', e.target.value)}
            state={
              !form.email
                ? 'idle'
                : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                  ? 'valid'
                  : 'invalid'
            }
            hint={
              !form.email
                ? undefined
                : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                  ? 'E-mail válido'
                  : 'E-mail inválido'
            }
          />
        </FormRow>
      </FormSection>

      <FormSection title="Endereço">
        <FormRow>
          <CepInput
            value={form.zipcode}
            onChange={(masked) => patch('zipcode', masked)}
            onLookup={onLookupCep}
            lookingUp={cepLoading}
            state={cepHint?.includes('não') || cepHint?.includes('Falha') ? 'invalid' : cepHint ? 'valid' : 'idle'}
            hint={cepHint}
          />
          <FormInput
            label="Número"
            value={form.number}
            onChange={(e) => patch('number', e.target.value)}
          />
          <FormInput
            label="Complemento"
            value={form.complement}
            onChange={(e) => patch('complement', e.target.value)}
          />
        </FormRow>
        <FormRow cols={1}>
          <FormInput
            label="Rua"
            value={form.street}
            onChange={(e) => patch('street', e.target.value)}
          />
        </FormRow>
        <FormRow cols={3}>
          <FormInput
            label="Bairro"
            value={form.district}
            onChange={(e) => patch('district', e.target.value)}
          />
          <FormInput
            label="Cidade"
            value={form.city}
            onChange={(e) => patch('city', e.target.value)}
          />
          <FormInput
            label="UF"
            value={form.state}
            onChange={(e) => patch('state', e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
          />
        </FormRow>
      </FormSection>

      <FormSection title="Emergência">
        <FormRow cols={3}>
          <FormInput
            label="Nome"
            value={form.emergencyName}
            onChange={(e) => patch('emergencyName', e.target.value)}
          />
          <FormInput
            label="Parentesco"
            value={form.emergencyRel}
            onChange={(e) => patch('emergencyRel', e.target.value)}
          />
          <PhoneInput
            label="Telefone"
            value={form.emergencyPhone}
            onChange={(masked) => patch('emergencyPhone', masked)}
          />
        </FormRow>
      </FormSection>

      <FormSection title="Observações">
        <Textarea
          label="Observações"
          value={form.notes}
          onChange={(e) => patch('notes', e.target.value)}
          rows={4}
        />
      </FormSection>

      <FormActions>
        <Button type="submit" loading={loading} loadingLabel="Salvando…">
          Salvar aluno
        </Button>
      </FormActions>
    </Form>
  );
}

function normalizeGender(raw: string) {
  const v = raw.trim().toLowerCase();
  if (!v) return '';
  if (v.startsWith('masc')) return 'masculino';
  if (v.startsWith('fem')) return 'feminino';
  if (v.includes('outro')) return 'outro';
  if (v.includes('não') || v.includes('nao') || v.includes('inform')) return 'nao_informado';
  if (GENDER_OPTIONS.some((o) => o.value === v)) return v;
  return v;
}

function formatMoney(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function ensureOption(
  options: Array<{ value: string; label: string }>,
  current: string,
) {
  if (!current) return options;
  if (options.some((o) => o.value === current)) return options;
  return [{ value: current, label: current }, ...options];
}
