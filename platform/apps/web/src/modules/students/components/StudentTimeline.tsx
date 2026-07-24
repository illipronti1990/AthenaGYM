import { STUDENT_STATUS_LABELS, type StudentStatus } from '@athenas/shared';

type Item = {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  createdAt: string;
};

export function StudentTimeline({ items }: { items: Item[] }) {
  if (!items.length) {
    return <p className="text-sm text-zinc-500">Sem histórico ainda.</p>;
  }
  return (
    <ol className="space-y-3 border-l border-zinc-200 pl-4" data-testid="student-timeline">
      {items.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full bg-[#A3001B]" />
          <p className="text-sm font-medium">
            {h.oldStatus
              ? `${STUDENT_STATUS_LABELS[h.oldStatus as StudentStatus] || h.oldStatus} → `
              : ''}
            {STUDENT_STATUS_LABELS[h.newStatus as StudentStatus] || h.newStatus}
          </p>
          <p className="text-xs text-zinc-500">
            {new Date(h.createdAt).toLocaleString('pt-BR')}
            {h.reason ? ` · ${h.reason}` : ''}
          </p>
        </li>
      ))}
    </ol>
  );
}
