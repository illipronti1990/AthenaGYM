'use client';

import { useEffect, useState } from 'react';
import type { Room } from '@athena/shared';
import { operationsApi } from '@/modules/operations/services/operationsApi';

export function RoomForm({ accessToken }: { accessToken: string }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reload = () => operationsApi.rooms(accessToken).then(setRooms).catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
  useEffect(() => { reload(); }, [accessToken]);
  async function toggle(room: Room) {
    await operationsApi.updateRoom(accessToken, room.id, { status: room.status === 'active' ? 'maintenance' : 'active' });
    reload();
  }
  return <div className="space-y-4">{error ? <p className="text-sm text-red-600">{error}</p> : null}<div className="grid gap-3 md:grid-cols-2">{rooms.map((room) => <div key={room.id} className="rounded border border-[var(--border)] p-4"><div className="flex justify-between"><strong>{room.name}</strong><span className="text-xs text-[var(--muted)]">{room.status}</span></div><p className="mt-1 text-sm text-[var(--muted)]">{room.area || 'Área não informada'} · capacidade {room.capacity}</p><button className="athena-btn athena-btn-secondary mt-3" onClick={() => toggle(room)}>{room.status === 'active' ? 'Enviar para manutenção' : 'Ativar sala'}</button></div>)}</div></div>;
}
