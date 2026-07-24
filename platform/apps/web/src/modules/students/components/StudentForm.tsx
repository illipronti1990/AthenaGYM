'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { STUDENT_STATUSES, STUDENT_STATUS_LABELS, isValidCpf } from '@athenas/shared';
import { createStudent, updateStudent } from '../services/studentsApi';
import { useToast } from '@/components/ui/Toast';

type Tab = 'personal' | 'contact' | 'address' | 'emergency' | 'notes';

const tabs: { id: Tab; label: string }[] = [
  { id: 'personal', label: 'Dados Pessoais' },
  { id: 'contact', label: 'Contato' },
  { id: 'address', label: 'Endereço' },
  { id: 'emergency', label: 'Emergência' },
  { id: 'notes', label: 'Observações' },
];

export function StudentForm({
  accessToken,
  unitId,
  initial,
  studentId,
}: {
  accessToken: string;
  unitId: string;
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
  const [form, setForm] = useState({
    fullName: initial?.fullName || '',
    socialName: initial?.socialName || '',
    cpf: initial?.cpf || '',
    rg: initial?.rg || '',
    birthDate: initial?.birthDate || '',
    gender: initial?.gender || '',
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
    district: initial?.district || '',
    city: initial?.city || '',
    state: initial?.state || '',
    emergencyName: initial?.emergencyName || '',
    emergencyPhone: initial?.emergencyPhone || '',
    emergencyRel: initial?.emergencyRel || '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    setLoading(true);
    try {
      const payload = {
        unitId,
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
        address: {
          zipcode: form.zipcode || undefined,
          street: form.street || undefined,
          number: form.number || undefined,
          district: form.district || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
        },
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

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-testid="student-form">
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === t.id ? 'bg-[#A3001B] text-white' : 'bg-zinc-100 text-zinc-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'personal' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome completo" value={form.fullName} onChange={(v) => set('fullName', v)} required />
          <Field label="Nome social" value={form.socialName} onChange={(v) => set('socialName', v)} />
          <Field label="CPF" value={form.cpf} onChange={(v) => set('cpf', v)} />
          <Field label="RG" value={form.rg} onChange={(v) => set('rg', v)} />
          <Field label="Nascimento" value={form.birthDate} onChange={(v) => set('birthDate', v)} type="date" />
          <Field label="Gênero" value={form.gender} onChange={(v) => set('gender', v)} />
          <label className="text-sm font-medium">
            Status
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            >
              {STUDENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STUDENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <Field label="Plano (placeholder)" value={form.planName} onChange={(v) => set('planName', v)} />
          <Field label="Professor (placeholder)" value={form.trainerName} onChange={(v) => set('trainerName', v)} />
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
          <Field label="CEP" value={form.zipcode} onChange={(v) => set('zipcode', v)} />
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
          <Field label="Telefone" value={form.emergencyPhone} onChange={(v) => set('emergencyPhone', v)} />
        </div>
      )}

      {tab === 'notes' && (
        <label className="block text-sm font-medium">
          Observações
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={5}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[#A3001B] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
      />
    </label>
  );
}
