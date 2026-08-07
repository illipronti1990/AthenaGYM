'use client';

import type { EnrollmentEvent } from '@movvo/shared';

export function EnrollmentTimeline({ events }: { events: EnrollmentEvent[] }) {
  if (!events.length) {
    return <p className="text-sm text-[var(--muted)]">Sem histórico ainda.</p>;
  }
  return (
    <ol className="space-y-3" data-testid="enrollment-timeline">
      {events.map((ev) => (
        <li key={ev.id} className="border-l-2 border-[var(--border)] pl-3">
          <p className="text-xs text-[var(--muted)]">
            {new Date(ev.occurredAt).toLocaleString('pt-BR')}
          </p>
          <p className="font-medium">{ev.title}</p>
          {ev.description ? <p className="text-sm text-[var(--muted)]">{ev.description}</p> : null}
        </li>
      ))}
    </ol>
  );
}
