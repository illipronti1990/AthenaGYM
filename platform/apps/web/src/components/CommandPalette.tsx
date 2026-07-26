'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GlobalSearchHit } from '@athena/shared';
import { polishApi } from '@/modules/polish/services/polishApi';

export function CommandPalette({ accessToken }: { accessToken: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<GlobalSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const res = await polishApi.search(accessToken, q.trim());
          setHits(res.hits);
        } catch {
          setHits([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 250);
    return () => clearTimeout(t);
  }, [q, open, accessToken]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[12vh]">
      <div
        role="dialog"
        aria-label="Pesquisa global"
        className="w-full max-w-xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar alunos, contratos, pagamentos, treinos…"
          className="w-full border-b border-zinc-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-zinc-700"
        />
        <div className="max-h-80 overflow-auto">
          {loading && <p className="px-4 py-3 text-sm text-zinc-500">Buscando…</p>}
          {!loading && q.trim().length >= 2 && hits.length === 0 && (
            <p className="px-4 py-3 text-sm text-zinc-500">Nenhum resultado</p>
          )}
          {hits.map((h) => (
            <button
              key={`${h.type}-${h.id}`}
              type="button"
              className="flex w-full flex-col items-start border-b border-zinc-100 px-4 py-2 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              onClick={() => {
                setOpen(false);
                setQ('');
                router.push(h.href);
              }}
            >
              <span className="text-sm font-medium">{h.title}</span>
              <span className="text-xs text-zinc-500">
                {h.type}
                {h.subtitle ? ` · ${h.subtitle}` : ''}
              </span>
            </button>
          ))}
        </div>
        <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-400 dark:border-zinc-800">
          Esc para fechar · Enter para abrir
        </p>
      </div>
    </div>
  );
}
