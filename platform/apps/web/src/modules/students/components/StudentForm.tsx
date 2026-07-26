'use client';

import { FormEvent, useEffect, useState, type HTMLAttributes } from 'react';
import { useRouter } from 'next/navigation';
import { STUDENT_STATUSES, STUDENT_STATUS_LABELS, isValidCpf } from '@athena/shared';
import type { Plan, UserListItem } from '@athena/shared';
import { Button } from '@athena/ui';
import { createStudent, updateStudent } from '../services/studentsApi';
import { salesApi } from '@/modules/sales/services/salesApi';
import { apiGetMe, apiListUsers } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { formatCep, lookupCep, onlyDigits } from '@/utils/cep';

type Tab = 'personal' | 'contact' | 'address' | 'emergency' | 'notes';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'personal', label: 'Dados Pessoais' },
  { id: 'contact', label: 'Contato' },
  { id: 'address', label: 'Endereço' },
  { id: 'emergency', label: 'Emergência' },
  { id: 'notes', label: 'Observações' },
];

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

export function StudentForm({
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
  const [tab, setTab] = useState<Tab>('personal');
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [unitId, setUnitId] = useState(initialUnitId);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trainers, setTrainers] = useState<UserListItem[]>([]);
  const [form, setForm] = useState({
    fullName: initial?.fullName || '',
    socialName: initial?.socialName || '',
    cpf: initial?.cpf || '',
    rg: initial?.rg || '',
    birthDate: initial?.birthDate || '',
    gender: normalizeGender(initial?.gender || ''),
    email: initial?.email || '',
    phone: initial?.phone || '',
    whatsapp: initial?.whatsapp || '',
    status: initial?.status || 'pre_registration',
    planName: initial?.planName || '',
    trainerName: initial?.trainerName || '',
    notes: initial?.notes || '',
    zipcode: initial?.zipcode ? formatCep(initial.zipcode) : '',
    street: initial?.street || '',
    number: initial?.number || '',
    district: initial?.district || '',
    city: initial?.city || '',
    state: initial?.state || '',
    emergencyName: initial?.emergencyName || '',
    emergencyPhone: initial?.emergencyPhone || '',
    emergencyRel: initial?.emergencyRel || '',
  });

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
        // selects ficam vazios; usuário ainda pode salvar sem plano/professor
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
        // API usará fallback da sessão
      }
    })();
  }, [accessToken, unitId]);

  useEffect(() => {
    const digits = onlyDigits(form.zipcode);
    if (digits.length !== 8) {
      setCepError(null);
      return;
    }
    const t = setTimeout(() => {
      void searchCep(digits);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.zipcode]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function searchCep(raw?: string) {
    const digits = onlyDigits(raw ?? form.zipcode);
    if (digits.length !== 8) {
      setCepError('Informe um CEP com 8 dígitos');
      return;
    }
    setCepLoading(true);
    setCepError(null);
    try {
      const addr = await lookupCep(digits);
      setForm((prev) => ({
        ...prev,
        zipcode: addr.zipcode,
        street: addr.street || prev.street,
        district: addr.district || prev.district,
        city: addr.city || prev.city,
        state: addr.state || prev.state,
      }));
    } catch (err) {
      setCepError(err instanceof Error ? err.message : 'CEP não encontrado');
    } finally {
      setCepLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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
      // Só envia unitId se for UUID válido; senão a API usa a unidade da sessão
      if (isUuid(unitId)) payload.unitId = unitId;

      const saved = studentId
        ? await updateStudent(accessToken, studentId, payload)
        : await createStudent(accessToken, payload);
      push(studentId ? 'Aluno atualizado' : 'Aluno cadastrado');
      router.push(`/app/students/${saved.id}`);
      router.refresh();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao salvar', 'error');
    } finally {
      setLoading(false);
    }
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
    <form onSubmit={onSubmit} className="space-y-4" data-testid="student-form">
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`athena-tab ${tab === t.id ? 'athena-tab-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {units.length > 0 ? (
            <SelectField
              label="Unidade"
              value={unitId}
              onChange={setUnitId}
              options={[
                { value: '', label: 'Selecione…' },
                ...units.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
          ) : null}
          <Field label="Nome completo" value={form.fullName} onChange={(v) => set('fullName', v)} required />
          <Field label="Nome social" value={form.socialName} onChange={(v) => set('socialName', v)} />
          <Field label="CPF" value={form.cpf} onChange={(v) => set('cpf', v)} />
          <Field label="RG" value={form.rg} onChange={(v) => set('rg', v)} />
          <Field label="Nascimento" value={form.birthDate} onChange={(v) => set('birthDate', v)} type="date" />
          <SelectField
            label="Gênero"
            value={form.gender}
            onChange={(v) => set('gender', v)}
            options={[...GENDER_OPTIONS]}
          />
          <SelectField
            label="Status"
            value={form.status}
            onChange={(v) => set('status', v)}
            options={STUDENT_STATUSES.map((s) => ({
              value: s,
              label: STUDENT_STATUS_LABELS[s],
            }))}
          />
          <SelectField
            label="Plano"
            value={form.planName}
            onChange={(v) => set('planName', v)}
            options={[{ value: '', label: 'Selecione…' }, ...planOptions]}
          />
          <SelectField
            label="Professor"
            value={form.trainerName}
            onChange={(v) => set('trainerName', v)}
            options={[{ value: '', label: 'Selecione…' }, ...trainerOptions]}
          />
        </div>
      )}

      {tab === 'contact' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="E-mail" value={form.email} onChange={(v) => set('email', v)} type="email" />
          <Field label="Telefone" value={form.phone} onChange={(v) => set('phone', v)} />
          <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => set('whatsapp', v)} />
        </div>
      )}

      {tab === 'address' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[var(--muted)] sm:col-span-2">
            CEP
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                value={form.zipcode}
                onChange={(e) => set('zipcode', formatCep(e.target.value))}
                onBlur={() => {
                  if (onlyDigits(form.zipcode).length === 8) void searchCep();
                }}
                placeholder="00000-000"
                inputMode="numeric"
                autoComplete="postal-code"
                className="athena-input max-w-[180px]"
                data-testid="student-cep"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={cepLoading || onlyDigits(form.zipcode).length !== 8}
                onClick={() => void searchCep()}
              >
                {cepLoading ? 'Buscando…' : 'Buscar CEP'}
              </Button>
            </div>
            <span className="mt-1 block text-xs text-[var(--muted)]">
              Consulta automática nos Correios (ViaCEP). Preenche rua, bairro, cidade e UF.
            </span>
            {cepError ? (
              <span className="mt-1 block text-xs text-[var(--primary-hover)]">{cepError}</span>
            ) : null}
          </label>
          <Field label="Rua" value={form.street} onChange={(v) => set('street', v)} />
          <Field label="Número" value={form.number} onChange={(v) => set('number', v)} />
          <Field label="Bairro" value={form.district} onChange={(v) => set('district', v)} />
          <Field label="Cidade" value={form.city} onChange={(v) => set('city', v)} />
          <Field label="UF" value={form.state} onChange={(v) => set('state', v)} />
        </div>
      )}

      {tab === 'emergency' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" value={form.emergencyName} onChange={(v) => set('emergencyName', v)} />
          <Field label="Parentesco" value={form.emergencyRel} onChange={(v) => set('emergencyRel', v)} />
          <Field
            label="Telefone"
            value={form.emergencyPhone}
            onChange={(v) => set('emergencyPhone', onlyDigits(v).slice(0, 11))}
            inputMode="numeric"
            maxLength={11}
            placeholder="11999999999"
          />
        </div>
      )}

      {tab === 'notes' && (
        <label className="block text-sm font-medium text-[var(--muted)]">
          Observações
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={5}
            className="athena-input mt-1"
          />
        </label>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-sm font-medium text-[var(--muted)]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="athena-input mt-1"
        data-testid={`student-${label.toLowerCase()}`}
      >
        {options.map((o) => (
          <option key={`${o.value}-${o.label}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  inputMode,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-[var(--muted)]">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        className="athena-input mt-1"
      />
    </label>
  );
}
