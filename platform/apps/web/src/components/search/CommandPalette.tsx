'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import type { GlobalSearchHit } from '@athena/shared';
import { polishApi } from '@/modules/polish/services/polishApi';
import { flattenNavItems } from '@/config/navigation';
import { useLayout } from '@/components/layout/LayoutProvider';

type Result =
  | { kind: 'nav'; href: string; title: string; subtitle: string; icon: ReactNode }
  | { kind: 'hit'; hit: GlobalSearchHit };

export function CommandPalette({ accessToken }: { accessToken: string }) {
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useLayout();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<GlobalSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const navItems = useMemo(() => flattenNavItems(), []);

  useEffect(() => {
    if (!searchOpen) {
      setQ('');
      setHits([]);
      setActive(0);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSearchOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, setSearchOpen]);

  const navResults = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) {
      return navItems.slice(0, 8).map((item) => ({
        kind: 'nav' as const,
        href: item.href,
        title: item.label,
        subtitle: 'Navegação',
        icon: <item.icon size={16} />,
      }));
    }
    return navItems
      .filter((item) => {
        const hay = `${item.label} ${(item.keywords || []).join(' ')}`.toLowerCase();
        return hay.includes(query);
      })
      .slice(0, 8)
      .map((item) => ({
        kind: 'nav' as const,
        href: item.href,
        title: item.label,
        subtitle: 'Navegação',
        icon: <item.icon size={16} />,
      }));
  }, [q, navItems]);

  useEffect(() => {
    if (!searchOpen || q.trim().length < 2) {
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
    }, 200);
    return () => clearTimeout(t);
  }, [q, searchOpen, accessToken]);

  const results: Result[] = useMemo(() => {
    const apiHits: Result[] = hits.map((hit) => ({ kind: 'hit', hit }));
    return [...navResults, ...apiHits].slice(0, 20);
  }, [navResults, hits]);

  useEffect(() => {
    setActive(0);
  }, [q, results.length]);

  function go(r: Result) {
    const href = r.kind === 'nav' ? r.href : r.hit.href;
    setSearchOpen(false);
    setQ('');
    router.push(href);
  }

  if (!searchOpen) return null;

  return (
    <div
      className="athena-command-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSearchOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-label="Pesquisa global"
        className="athena-command-dialog"
        data-testid="command-palette"
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4">
          <Search size={18} className="text-[var(--muted)]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter' && results[active]) {
                e.preventDefault();
                go(results[active]);
              }
            }}
            placeholder="Pesquisar alunos, treinos, financeiro, agenda…"
            className="w-full bg-transparent py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
            data-testid="command-input"
          />
          <kbd className="athena-kbd">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-auto py-2">
          {loading ? <p className="px-4 py-2 text-sm text-[var(--muted)]">Buscando…</p> : null}
          {!loading && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--muted)]">Nenhum resultado</p>
          ) : null}
          {results.map((r, i) => {
            const title = r.kind === 'nav' ? r.title : r.hit.title;
            const subtitle =
              r.kind === 'nav'
                ? r.subtitle
                : `${r.hit.type}${r.hit.subtitle ? ` · ${r.hit.subtitle}` : ''}`;
            return (
              <button
                key={r.kind === 'nav' ? `nav-${r.href}-${r.title}` : `hit-${r.hit.type}-${r.hit.id}`}
                type="button"
                className={`athena-command-item ${i === active ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
              >
                <span className="text-[var(--gold)]">
                  {r.kind === 'nav' ? r.icon : null}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium text-[var(--text)]">{title}</span>
                  <span className="block truncate text-xs text-[var(--muted)]">{subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted)]">
          ↑↓ navegar · Enter abrir · Esc fechar · Ctrl+K
        </p>
      </div>
    </div>
  );
}
