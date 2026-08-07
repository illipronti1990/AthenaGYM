'use client';

import type { Schedule } from '@movvo/shared';

export function ConflictBanner({ items }: { items: Schedule[] }) {
  const conflicts = items.filter((item, index) => items.some((other, otherIndex) => otherIndex > index && item.roomId && item.roomId === other.roomId && new Date(item.startAt) < new Date(other.endAt) && new Date(other.startAt) < new Date(item.endAt)));
  if (!conflicts.length) return null;
  return <div className="rounded border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-200">Atenção: existem horários sobrepostos na mesma sala.</div>;
}
