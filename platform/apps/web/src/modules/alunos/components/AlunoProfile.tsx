'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { STUDENT_STATUSES, STUDENT_STATUS_LABELS, formatCpf, resolveStudentDisplayStatus } from '@movvo/shared';
import type { Student, Student360Summary, StudentTimelineEvent } from '@movvo/shared';
import { Button, Card, ConfirmDialog, SkeletonForm } from '@movvo/ui';
import { AlunoAvatar } from './AlunoAvatar';
import { AlunoStatusBadge } from './AlunoStatus';
import { AlunoTimeline } from './AlunoTimeline';
import { AlunoForm } from './AlunoForm';
import { AlunoFinancePanel } from './AlunoFinancePanel';
import { AlunoWorkoutsPanel } from './AlunoWorkoutsPanel';
import { AlunoAssessmentsPanel } from './AlunoAssessmentsPanel';
import { AlunoProfile360 } from './AlunoProfile360';
import { AlunoDocumentsPanel } from './AlunoDocumentsPanel';
import { AlunoCommunicationBar } from './AlunoCommunicationBar';
import { MinhaEvolucao } from '@/modules/treinos/evolucao/MinhaEvolucao';
import { EntityTimeline } from '@/modules/polish/components/EntityTimeline';
import {
  changeAlunoStatus,
  deleteAluno,
  getAluno,
  getAlunoSummary,
  getAlunoTimeline,
  uploadAlunoPhoto,
} from '../services/alunosApi';
import { useToast } from '@/components/ui/Toast';
import {
  ContextualActions,
  whatsappChargeUrl,
} from '@/components/ux/ContextualActions';

type Tab = 'data' | 'history' | 'finance' | 'workouts' | 'assessments' | 'evolution' | 'documents';

export function AlunoProfile({
  accessToken,
  studentId,
  unitId,
}: {
  accessToken: string;
  studentId: string;
  unitId: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>('data');
  const [student, setStudent] = useState<Student | null>(null);
  const [timeline, setTimeline] = useState<StudentTimelineEvent[]>([]);
  const [summary, setSummary] = useState<Student360Summary | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteAluno(accessToken, studentId);
      push('Aluno excluído');
      router.push('/app/alunos');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao excluir', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function load() {
    try {
      const [s, tl, sm] = await Promise.all([
        getAluno(accessToken, studentId),
        getAlunoTimeline(accessToken, studentId),
        getAlunoSummary(accessToken, studentId),
      ]);
      setStudent(s);
      setTimeline(tl as StudentTimelineEvent[]);
      setSummary(sm);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao carregar', 'error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, studentId]);

  if (!student) return <SkeletonForm fields={6} />;

  const chargeUrl = whatsappChargeUrl(student.whatsapp || student.phone, student.fullName);
  const contextual = [
    student.status === 'delinquent' && chargeUrl
      ? {
          id: 'whatsapp-charge',
          label: 'Enviar cobrança por WhatsApp',
          onClick: () => window.open(chargeUrl, '_blank', 'noopener,noreferrer'),
          variant: 'primary' as const,
        }
      : null,
    {
      id: 'new-workout',
      label: 'Criar novo treino',
      onClick: () => setTab('workouts'),
      variant: 'secondary' as const,
    },
    {
      id: 'reassess',
      label: 'Agendar reavaliação',
      onClick: () => setTab('assessments'),
      variant: 'secondary' as const,
    },
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
  }>;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmDelete}
        title={`Excluir ${student.fullName}?`}
        message="Essa ação não poderá ser desfeita."
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void onDelete()}
      />

      <Button
        type="button"
        variant="secondary"
        className="text-[var(--gold)]"
        onClick={() => router.push('/app/alunos')}
        data-testid="back-to-students"
      >
        ← Voltar
      </Button>

      <ContextualActions actions={contextual} />

      <header className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          onClick={() => {
            const input = document.getElementById('student-photo-input') as HTMLInputElement | null;
            input?.click();
          }}
          title="Alterar foto"
        >
          <AlunoAvatar name={student.fullName} photoUrl={student.photoUrl} size={72} />
        </button>
        <input
          id="student-photo-input"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void uploadAlunoPhoto(accessToken, studentId, file)
              .then((s) => {
                setStudent(s);
                push('Foto atualizada.');
              })
              .catch((err) => push(err instanceof Error ? err.message : 'Falha no upload', 'error'));
            e.target.value = '';
          }}
        />
        <div className="min-w-0 flex-1">
          <h1 className="movvo-title text-2xl">{student.fullName}</h1>
          <p className="text-sm text-[var(--muted)]">
            {student.registrationNumber}
            {student.cpf ? ` · ${formatCpf(student.cpf)}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AlunoStatusBadge
              status={student.status}
              displayStatus={resolveStudentDisplayStatus(
                student.status,
                summary?.nextDueDate,
              )}
            />
            <select
              className="movvo-input w-auto"
              value={student.status}
              onChange={async (e) => {
                try {
                  const s = await changeAlunoStatus(
                    accessToken,
                    studentId,
                    e.target.value,
                    'ui_change',
                  );
                  setStudent(s);
                  push('Status atualizado');
                  setTimeline(
                    (await getAlunoTimeline(accessToken, studentId)) as StudentTimelineEvent[],
                  );
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
            <Button type="button" variant="secondary" onClick={() => setEditing((v) => !v)}>
              {editing ? 'Cancelar edição' : 'Editar'}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleting}
              onClick={() => setConfirmDelete(true)}
              data-testid="delete-student"
            >
              Excluir
            </Button>
          </div>
          <div className="mt-3">
            <AlunoCommunicationBar
              fullName={student.fullName}
              phone={student.phone}
              whatsapp={student.whatsapp}
              email={student.email}
            />
          </div>
        </div>
      </header>

      <AlunoProfile360
        planName={student.planName}
        trainerName={student.trainerName}
        monthlyFee={summary?.monthlyFee ?? null}
        summary={summary}
      />

      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        {(
          [
            ['data', 'Dados'],
            ['history', 'Histórico'],
            ['finance', 'Financeiro'],
            ['workouts', 'Treinos'],
            ['assessments', 'Avaliações'],
            ['evolution', 'Minha Evolução'],
            ['documents', 'Documentos'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`movvo-tab ${tab === id ? 'movvo-tab-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'data' &&
        (editing ? (
          <AlunoForm
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
              maritalStatus: student.maritalStatus || '',
              profession: student.profession || '',
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
              complement: student.address?.complement || '',
              district: student.address?.district || '',
              city: student.address?.city || '',
              state: student.address?.state || '',
              emergencyName: student.emergencyContacts?.[0]?.name || '',
              emergencyPhone: student.emergencyContacts?.[0]?.phone || '',
              emergencyRel: student.emergencyContacts?.[0]?.relationship || '',
            }}
          />
        ) : (
          <Card>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Item label="E-mail" value={student.email} />
              <Item label="Telefone" value={student.phone} />
              <Item label="WhatsApp" value={student.whatsapp} />
              <Item label="Estado civil" value={student.maritalStatus} />
              <Item label="Profissão" value={student.profession} />
              <Item label="Último acesso" value={student.lastAccessAt} date />
              <Item label="Observações" value={student.notes} />
            </dl>
          </Card>
        ))}

      {tab === 'history' && (
        <div className="space-y-6">
          <AlunoTimeline items={timeline} />
          <div>
            <h3 className="movvo-title mb-2 text-sm">Auditoria</h3>
            <EntityTimeline accessToken={accessToken} entity="student" id={studentId} />
          </div>
        </div>
      )}

      {tab === 'finance' && (
        <AlunoFinancePanel
          accessToken={accessToken}
          studentId={student.id}
          unitId={unitId || student.unitId}
          planName={student.planName}
        />
      )}

      {tab === 'workouts' && (
        <AlunoWorkoutsPanel accessToken={accessToken} studentId={student.id} />
      )}

      {tab === 'assessments' && (
        <AlunoAssessmentsPanel
          accessToken={accessToken}
          studentId={student.id}
          unitId={unitId || student.unitId}
        />
      )}

      {tab === 'evolution' && (
        <MinhaEvolucao accessToken={accessToken} studentId={student.id} />
      )}

      {tab === 'documents' && (
        <AlunoDocumentsPanel
          accessToken={accessToken}
          studentId={student.id}
          documents={student.documents || []}
          onUploaded={() => void load()}
        />
      )}
    </div>
  );
}

function Item({
  label,
  value,
  date,
}: {
  label: string;
  value: string | null | undefined;
  date?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</dt>
      <dd className="font-medium text-[var(--text)]">
        {value
          ? date
            ? new Date(value).toLocaleString('pt-BR')
            : value
          : '—'}
      </dd>
    </div>
  );
}
