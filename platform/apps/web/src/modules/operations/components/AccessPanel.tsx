'use client';

import { useEffect, useState } from 'react';
import type { AccessDevice, Room } from '@athenas/shared';
import { operationsApi } from '../services/operationsApi';

export function AccessPanel({ accessToken }: { accessToken: string }) {
  const [devices, setDevices] = useState<AccessDevice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([operationsApi.devices(accessToken), operationsApi.rooms(accessToken)])
      .then(([d, r]) => {
        setDevices(d);
        setRooms(r);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  async function open(deviceId: string) {
    setError(null);
    try {
      const r = await operationsApi.openGate(accessToken, deviceId);
      setMsg(r.message || (r.opened ? 'Catraca aberta' : 'Falha'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  return (
    <div className="space-y-8">
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <section>
        <h2 className="mb-2 font-semibold">Dispositivos / catracas</h2>
        <ul className="divide-y divide-zinc-200">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-zinc-500">
                  {d.provider} · {d.manufacturer || '—'} · {d.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => open(d.id)}
                className="rounded border border-zinc-300 px-2 py-1 hover:border-[#A3001B]"
              >
                Abrir catraca
              </button>
            </li>
          ))}
          {devices.length === 0 ? (
            <li className="py-4 text-sm text-zinc-500">Nenhum dispositivo (rode migration 0007).</li>
          ) : null}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Salas</h2>
        <ul className="divide-y divide-zinc-200 text-sm">
          {rooms.map((r) => (
            <li key={r.id} className="flex justify-between py-2">
              <span>
                {r.name} {r.area ? `(${r.area})` : ''}
              </span>
              <span className="text-zinc-500">cap. {r.capacity}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
