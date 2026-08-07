'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Modality } from '@movvo/shared';
import { operationsApi } from '@/modules/operations/services/operationsApi';

export function ModalityForm({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Modality[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#C9A227');
  const [error, setError] = useState<string | null>(null);
  const reload = () => operationsApi.modalities(accessToken).then(setItems).catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
  useEffect(() => { reload(); }, [accessToken]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    await operationsApi.createModality(accessToken, { name, color });
    setName('');
    reload();
  }
  return <div className="space-y-5">{error ? <p className="text-sm text-red-600">{error}</p> : null}<form onSubmit={submit} className="flex flex-wrap items-end gap-3"><label className="text-sm">Nome<input className="movvo-input mt-1 block" value={name} onChange={(e) => setName(e.target.value)} required /></label><label className="text-sm">Cor<input className="mt-1 block h-10 w-16" type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label><button className="movvo-btn movvo-btn-primary">Adicionar</button></form><div className="grid gap-2 sm:grid-cols-2">{items.map((item) => <div key={item.id} className="rounded border border-[var(--border)] p-3"><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: item.color }} />{item.name}<span className="float-right text-xs text-[var(--muted)]">{item.defaultCapacity} vagas</span></div>)}</div></div>;
}
