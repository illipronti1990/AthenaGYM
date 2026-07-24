'use client';

import { FormEvent, useEffect, useState } from 'react';
import { operationsApi } from '../services/operationsApi';

export function CheckinPanel({ accessToken }: { accessToken: string }) {
  const [studentId, setStudentId] = useState('');
  const [qr, setQr] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof operationsApi.checkins>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function refreshHistory() {
    setHistory(await operationsApi.checkins(accessToken));
  }

  useEffect(() => {
    refreshHistory().catch(() => undefined);
  }, [accessToken]);

  async function onManual(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    try {
      const c = await operationsApi.createCheckin(accessToken, {
        studentId,
        unitId: '22222222-2222-2222-2222-222222222222',
        method: 'manual',
      });
      setOk(`Check-in ${c.id}`);
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function onQr() {
    setError(null);
    try {
      const r = await operationsApi.generateQr(
        accessToken,
        studentId,
        '22222222-2222-2222-2222-222222222222',
      );
      setQr(r.token);
      setExpiresAt(r.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function onCheckinQr() {
    if (!qr) return;
    setError(null);
    try {
      const c = await operationsApi.createCheckin(accessToken, {
        studentId,
        unitId: '22222222-2222-2222-2222-222222222222',
        method: 'qr',
        qrToken: qr,
      });
      setOk(`Check-in QR ${c.id}`);
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onManual} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Student ID
          <input
            className="mt-1 block w-72 rounded border border-zinc-300 px-2 py-1.5 font-mono text-xs"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="rounded bg-[#A3001B] px-3 py-1.5 text-sm font-semibold text-white">
          Check-in manual
        </button>
        <button
          type="button"
          onClick={onQr}
          disabled={!studentId}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
        >
          Gerar QR (30s)
        </button>
        <button
          type="button"
          onClick={onCheckinQr}
          disabled={!qr}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
        >
          Validar QR
        </button>
      </form>
      {qr ? (
        <p className="break-all rounded bg-zinc-900 p-3 font-mono text-xs text-zinc-100">
          {qr}
          {expiresAt ? (
            <span className="mt-2 block text-zinc-400">expira {new Date(expiresAt).toLocaleTimeString('pt-BR')}</span>
          ) : null}
        </p>
      ) : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div>
        <h2 className="mb-2 font-semibold">Histórico</h2>
        <ul className="divide-y divide-zinc-200 text-sm">
          {history.slice(0, 20).map((h) => (
            <li key={h.id} className="flex justify-between py-2">
              <span>
                {h.method} · {h.direction} · {h.studentId.slice(0, 8)}…
              </span>
              <span className="text-zinc-500">{new Date(h.createdAt).toLocaleString('pt-BR')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
