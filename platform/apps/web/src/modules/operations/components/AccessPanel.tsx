'use client';

import { useEffect, useState } from 'react';
import type { AccessDevice, Room } from '@athena/shared';
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
      {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
      <section>
        <h2 className="athena-title mb-2 text-sm">Dispositivos / catracas</h2>
        <ul className="divide-y divide-[var(--border)]">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {d.provider} · {d.manufacturer || '—'} · {d.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => open(d.id)}
                className="athena-btn athena-btn-secondary"
              >
                Abrir catraca
              </button>
            </li>
          ))}
          {devices.length === 0 ? (
            <li className="py-4 text-sm text-[var(--muted)]">Nenhum dispositivo (rode migration 0007).</li>
          ) : null}
        </ul>
      </section>
      <section>
        <h2 className="athena-title mb-2 text-sm">Salas</h2>
        <ul className="divide-y divide-[var(--border)] text-sm">
          {rooms.map((r) => (
            <li key={r.id} className="flex justify-between py-2">
              <span>
                {r.name} {r.area ? `(${r.area})` : ''}
              </span>
              <span className="text-[var(--muted)]">cap. {r.capacity}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
