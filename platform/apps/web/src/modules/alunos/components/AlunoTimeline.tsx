import type { StudentTimelineEvent, StudentTimelineKind } from '@athena/shared';
import { STUDENT_TIMELINE_KIND_LABELS } from '@athena/shared';
import {
  Activity,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LogIn,
  UserCheck,
} from 'lucide-react';

const icons: Record<StudentTimelineKind, typeof LogIn> = {
  checkin: LogIn,
  payment: CreditCard,
  assessment: Activity,
  workout: Dumbbell,
  enrollment: UserCheck,
  status: ClipboardList,
};

export function AlunoTimeline({ items }: { items: StudentTimelineEvent[] }) {
  if (!items.length) {
    return <p className="text-sm text-[var(--muted)]">Sem histórico ainda.</p>;
  }

  return (
    <ol className="space-y-4" data-testid="student-timeline">
      {items.map((event, index) => {
        const Icon = icons[event.kind] || ClipboardList;
        const prevDate = items[index - 1]?.occurredAt;
        const showDate =
          !prevDate ||
          new Date(event.occurredAt).toDateString() !== new Date(prevDate).toDateString();

        return (
          <li key={event.id}>
            {showDate ? (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {new Date(event.occurredAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </p>
            ) : null}
            <div className="flex gap-3 border-l border-[var(--border)] pl-4">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(160,0,24,0.15)] text-[var(--gold)]"
                aria-hidden
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0 pb-1">
                <p className="text-sm font-medium text-[var(--text)]">
                  {event.title}
                  <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                    {STUDENT_TIMELINE_KIND_LABELS[event.kind]}
                  </span>
                </p>
                {event.description ? (
                  <p className="text-sm text-[var(--muted)]">{event.description}</p>
                ) : null}
                <p className="text-xs text-[var(--muted)]">
                  {new Date(event.occurredAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
