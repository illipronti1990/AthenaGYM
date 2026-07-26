import { STUDENT_STATUS_LABELS, type StudentStatus } from '@athena/shared';

type Item = {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  createdAt: string;
};

export function StudentTimeline({ items }: { items: Item[] }) {
  if (!items.length) {
    return <p className="text-sm text-[var(--muted)]">Sem histórico ainda.</p>;
  }
  return (
    <ol className="space-y-3 border-l border-[var(--border)] pl-4" data-testid="student-timeline">
      {items.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
          <p className="text-sm font-medium text-[var(--text)]">
            {h.oldStatus
              ? `${STUDENT_STATUS_LABELS[h.oldStatus as StudentStatus] || h.oldStatus} → `
              : ''}
            {STUDENT_STATUS_LABELS[h.newStatus as StudentStatus] || h.newStatus}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {new Date(h.createdAt).toLocaleString('pt-BR')}
            {h.reason ? ` · ${h.reason}` : ''}
          </p>
        </li>
      ))}
    </ol>
  );
}
