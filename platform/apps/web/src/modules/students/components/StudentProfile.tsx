'use client';

import { useEffect, useState } from 'react';
import { STUDENT_STATUSES, STUDENT_STATUS_LABELS, formatCpf } from '@athenas/shared';
import type { Student } from '@athenas/shared';
import { StudentAvatar } from './StudentAvatar';
import { StudentStatusBadge } from './StudentStatus';
import { StudentTimeline } from './StudentTimeline';
import { StudentForm } from './StudentForm';
import {
  changeStudentStatus,
  getStudent,
  getStudentHistory,
} from '../services/studentsApi';
import { useToast } from '@/components/ui/Toast';
import { TableSkeleton } from '@/components/ui/Skeleton';

type Tab = 'data' | 'history' | 'finance' | 'workouts' | 'assessments';

export function StudentProfile({
  accessToken,
  studentId,
  unitId,
}: {
  accessToken: string;
  studentId: string;
  unitId: string;
}) {
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>('data');
  const [student, setStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<
    Array<{
      id: string;
      oldStatus: string | null;
      newStatus: string;
      reason: string | null;
      createdAt: string;
    }>
  >([]);
  const [editing, setEditing] = useState(false);

  async function load() {
    try {
      const [s, h] = await Promise.all([
        getStudent(accessToken, studentId),
        getStudentHistory(accessToken, studentId),
      ]);
      setStudent(s);
      setHistory(h);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao carregar', 'error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, studentId]);

  if (!student) return <TableSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <StudentAvatar name={student.fullName} photoUrl={student.photoUrl} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{student.fullName}</h1>
          <p className="text-sm text-zinc-600">
            {student.registrationNumber}
            {student.cpf ? ` · ${formatCpf(student.cpf)}` : ''}
            {student.planName ? ` · ${student.planName}` : ' · Plano —'}
            {student.trainerName ? ` · ${student.trainerName}` : ' · Professor —'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StudentStatusBadge status={student.status} />
            <select
              className="rounded border border-zinc-300 px-2 py-1 text-sm"
              value={student.status}
              onChange={async (e) => {
                try {
                  const s = await changeStudentStatus(
                    accessToken,
                    studentId,
                    e.target.value,
                    'ui_change',
                  );
                  setStudent(s);
                  push('Status atualizado');
                  setHistory(await getStudentHistory(accessToken, studentId));
                } catch (err) {
                  push(err instanceof Error ? err.message : 'Falha', 'error');
                }
              }}
            >
              {STUDENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STUDENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded border border-zinc-300 px-3 py-1 text-sm"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? 'Cancelar edição' : 'Editar'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
        {(
          [
            ['data', 'Dados'],
            ['history', 'Histórico'],
            ['finance', 'Financeiro'],
            ['workouts', 'Treinos'],
            ['assessments', 'Avaliações'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === id ? 'bg-[#A3001B] text-white' : 'bg-zinc-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'data' &&
        (editing ? (
          <StudentForm
            accessToken={accessToken}
            unitId={unitId || student.unitId}
            studentId={student.id}
            initial={{
              fullName: student.fullName,
              socialName: student.socialName || '',
              cpf: student.cpf || '',
              rg: student.rg || '',
              birthDate: student.birthDate || '',
              gender: student.gender || '',
              email: student.email || '',
              phone: student.phone || '',
              whatsapp: student.whatsapp || '',
              status: student.status,
              planName: student.planName || '',
              trainerName: student.trainerName || '',
              notes: student.notes || '',
              zipcode: student.address?.zipcode || '',
              street: student.address?.street || '',
              number: student.address?.number || '',
              district: student.address?.district || '',
              city: student.address?.city || '',
              state: student.address?.state || '',
            }}
          />
        ) : (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Item label="E-mail" value={student.email} />
            <Item label="Telefone" value={student.phone} />
            <Item label="WhatsApp" value={student.whatsapp} />
            <Item label="Último acesso" value={student.lastAccessAt} />
            <Item label="Observações" value={student.notes} />
          </dl>
        ))}

      {tab === 'history' && <StudentTimeline items={history} />}

      {(tab === 'finance' || tab === 'workouts' || tab === 'assessments') && (
        <p className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
          Módulo em breve — preparado para integração futura.
        </p>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-900">
        {value ? (label.includes('acesso') ? new Date(value).toLocaleString('pt-BR') : value) : '—'}
      </dd>
    </div>
  );
}
