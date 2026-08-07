'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ClassEnrollment, Schedule } from '@movvo/shared';
import {
  canCancelClassReservation,
  CLASS_CANCEL_CUTOFF_MINUTES,
  classCancelBlockMessage,
} from '@movvo/shared';
import { useToast } from '@/components/ui/Toast';
import { operationsApi } from '@/modules/operations/services/operationsApi';

type UpcomingItem = {
  schedule: Schedule;
  enrollment: ClassEnrollment;
  canCancel?: boolean;
  cancelBlockedReason?: string | null;
};

type PortalData = {
  student: { fullName: string };
  upcoming: UpcomingItem[];
  openClasses: Schedule[];
  cancelCutoffMinutes?: number;
};

export function StudentAgenda({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [data, setData] = useState<PortalData | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoadError(null);
      const next = await operationsApi.portalAgenda(accessToken);
      setData(next);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao carregar agenda';
      setLoadError(message);
      push(message, 'error');
    }
  }, [accessToken, push]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onAgendaChanged = () => {
      void reload();
    };
    window.addEventListener('movvo-agenda-changed', onAgendaChanged);
    return () => window.removeEventListener('movvo-agenda-changed', onAgendaChanged);
  }, [reload]);

  async function enroll(scheduleId: string) {
    if (busyId) return;
    setBusyId(scheduleId);
    try {
      const enrollment = await operationsApi.portalEnroll(accessToken, scheduleId);
      push(
        enrollment.status === 'waitlist' ? 'Você entrou na fila de espera.' : 'Reserva confirmada.',
        'ok',
      );
      await reload();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Não foi possível reservar', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(scheduleId: string, startAt: string) {
    if (busyId) return;
    const blocked = classCancelBlockMessage(startAt);
    if (blocked) {
      push(blocked, 'error');
      return;
    }
    setBusyId(scheduleId);
    try {
      await operationsApi.portalCancelEnroll(accessToken, scheduleId);
      push('Reserva cancelada.', 'ok');
      await reload();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Não foi possível cancelar', 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (loadError && !data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--danger)]">{loadError}</p>
        <button type="button" className="movvo-btn movvo-btn-secondary" onClick={() => void reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando agenda…</p>;

  const cutoff = data.cancelCutoffMinutes ?? CLASS_CANCEL_CUTOFF_MINUTES;

  return (
    <div className="space-y-6" data-testid="student-agenda">
      <p className="text-sm text-[var(--muted)]">
        Olá, {data.student.fullName}. Confira seus próximos compromissos.
      </p>
      <p className="text-xs text-[var(--muted)]">
        Cancelamentos só são permitidos até {cutoff} minutos antes do início da aula.
      </p>

      <section>
        <h3 className="mb-2 font-semibold">Minha agenda</h3>
        {data.upcoming.map(({ schedule, enrollment, canCancel, cancelBlockedReason }) => {
          const allowed =
            typeof canCancel === 'boolean' ? canCancel : canCancelClassReservation(schedule.startAt);
          const reason = cancelBlockedReason ?? classCancelBlockMessage(schedule.startAt);
          return (
            <div
              key={schedule.id}
              className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border)] p-3"
            >
              <span>
                {new Date(schedule.startAt).toLocaleString('pt-BR')} · {schedule.title}
                <small className="ml-2 text-[var(--muted)]">{enrollment.status}</small>
                {!allowed && reason ? (
                  <small className="mt-1 block text-[var(--danger)]">{reason}</small>
                ) : null}
              </span>
              <button
                type="button"
                className="movvo-btn movvo-btn-secondary"
                disabled={!allowed || busyId === schedule.id}
                title={!allowed ? reason || undefined : undefined}
                data-testid={`cancel-class-${schedule.id}`}
                onClick={() => void cancel(schedule.id, schedule.startAt)}
              >
                {busyId === schedule.id ? 'Cancelando…' : 'Cancelar'}
              </button>
            </div>
          );
        })}
        {!data.upcoming.length ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma reserva ativa.</p>
        ) : null}
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Aulas disponíveis</h3>
        {data.openClasses.map((schedule) => (
          <div
            key={schedule.id}
            className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border)] p-3"
          >
            <span>
              {new Date(schedule.startAt).toLocaleString('pt-BR')} · {schedule.title}
            </span>
            <button
              type="button"
              className="movvo-btn movvo-btn-primary"
              disabled={busyId === schedule.id}
              data-testid={`reserve-class-${schedule.id}`}
              onClick={() => void enroll(schedule.id)}
            >
              {busyId === schedule.id ? 'Reservando…' : 'Reservar'}
            </button>
          </div>
        ))}
        {!data.openClasses.length ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma aula aberta no momento.</p>
        ) : null}
      </section>
    </div>
  );
}
