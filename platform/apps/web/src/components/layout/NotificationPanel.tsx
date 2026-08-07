'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck } from 'lucide-react';
import type { AppNotification } from '@athena/shared';
import { EmptyStatePreset, ErrorState, Tooltip } from '@athena/ui';
import { engagementApi } from '@/modules/engagement/services/engagementApi';
import { useLayout } from './LayoutProvider';

const DOMAIN_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'finance', label: 'Financeiro' },
  { id: 'student', label: 'Alunos' },
  { id: 'checkin', label: 'Check-ins' },
  { id: 'inventory', label: 'Estoque' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'integration', label: 'Integrações' },
] as const;

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function domainOf(n: AppNotification): string {
  const t = `${n.type} ${n.title} ${n.body}`.toLowerCase();
  if (/finance|receb|pagar|mensal|cobran/.test(t)) return 'finance';
  if (/aluno|student|matríc/.test(t)) return 'student';
  if (/check.?in|acesso|catraca/.test(t)) return 'checkin';
  if (/estoque|produto|invent/.test(t)) return 'inventory';
  if (/agenda|aula|reserva/.test(t)) return 'agenda';
  if (/integra|wellhub|totalpass|webhook/.test(t)) return 'integration';
  return 'all';
}

function hrefFor(n: AppNotification): string | null {
  const d = domainOf(n);
  if (d === 'finance') return '/app/financeiro/receber';
  if (d === 'student') return '/app/alunos';
  if (d === 'checkin') return '/app/acesso';
  if (d === 'inventory') return '/app/estoque';
  if (d === 'agenda') return '/app/agenda';
  if (d === 'integration') return '/app/integracoes';
  return null;
}

export function NotificationPanel({ accessToken }: { accessToken: string }) {
  const { notificationsOpen, setNotificationsOpen } = useLayout();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof DOMAIN_FILTERS)[number]['id']>('all');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setError(null);
      setItems(await engagementApi.notifications(accessToken));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar notificações');
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    const tick = () => {
      if (document.visibilityState === 'visible') void load();
    };
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((n) => domainOf(n) === filter)),
    [items, filter],
  );
  const unread = items.filter((n) => !n.readAt).length;
  const today = filtered.filter((n) => isToday(n.createdAt));
  const earlier = filtered.filter((n) => !isToday(n.createdAt));

  async function mark(id: string) {
    try {
      await engagementApi.markRead(accessToken, id);
      await load();
    } catch {
      /* ignore */
    }
  }

  async function markAll() {
    setBusy(true);
    try {
      await engagementApi.markAllRead(accessToken);
      await load();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Tooltip content="Notificações">
        <button
          type="button"
          className="athena-icon-btn"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          aria-label="Notificações"
          data-testid="notifications-toggle"
        >
          <Bell size={18} />
          {unread > 0 ? (
            <span className="athena-badge-dot">{unread > 9 ? '9+' : unread}</span>
          ) : null}
        </button>
      </Tooltip>

      {notificationsOpen ? (
        <>
          <button
            type="button"
            className="athena-drawer-backdrop"
            aria-label="Fechar notificações"
            onClick={() => setNotificationsOpen(false)}
          />
          <aside className="athena-notification-drawer" data-testid="notification-panel" aria-label="Central de notificações">
            <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 gap-2">
              <div>
                <h2 className="athena-h3">Notificações</h2>
                <p className="athena-caption">{unread} não lidas</p>
              </div>
              <div className="flex gap-2">
                {unread > 0 ? (
                  <button
                    type="button"
                    className="athena-btn athena-btn-secondary athena-btn-sm"
                    onClick={() => void markAll()}
                    disabled={busy}
                    data-testid="notifications-mark-all"
                  >
                    <CheckCheck size={14} /> Marcar todas
                  </button>
                ) : null}
                <button
                  type="button"
                  className="athena-btn athena-btn-secondary athena-btn-sm"
                  onClick={() => setNotificationsOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </header>
            <div className="flex flex-wrap gap-1 border-b border-[var(--border)] px-3 py-2">
              {DOMAIN_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`athena-btn athena-btn-sm ${filter === f.id ? 'athena-btn-primary' : 'athena-btn-secondary'}`}
                  onClick={() => setFilter(f.id)}
                  data-testid={`notif-filter-${f.id}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {error ? (
                <ErrorState title="Falha ao carregar" description={error} action={
                  <button type="button" className="athena-btn athena-btn-secondary" onClick={() => void load()}>
                    Tentar de novo
                  </button>
                } />
              ) : filtered.length === 0 ? (
                <EmptyStatePreset
                  preset="noNotifications"
                  icon={<Bell size={36} strokeWidth={1.5} />}
                />
              ) : (
                <>
                  {today.length > 0 ? (
                    <section className="mb-4">
                      <h3 className="athena-caption mb-2 px-1">Hoje</h3>
                      <ul className="space-y-2">
                        {today.map((n) => (
                          <NotificationRow key={n.id} n={n} onMark={() => void mark(n.id)} />
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {earlier.length > 0 ? (
                    <section>
                      <h3 className="athena-caption mb-2 px-1">Anteriores</h3>
                      <ul className="space-y-2">
                        {earlier.slice(0, 20).map((n) => (
                          <NotificationRow key={n.id} n={n} onMark={() => void mark(n.id)} />
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </>
              )}
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}

function NotificationRow({ n, onMark }: { n: AppNotification; onMark: () => void }) {
  const href = hrefFor(n);
  return (
    <li
      className={`rounded-xl border border-[var(--border)] p-3 ${n.readAt ? 'opacity-70' : 'bg-[var(--surface)]'}`}
      data-testid={`notification-${n.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text)]">{n.title}</p>
          <p className="text-xs text-[var(--muted)] mt-1">{n.body}</p>
          <p className="text-xs text-[var(--muted)] mt-2">{relativeTime(n.createdAt)}</p>
          {href ? (
            <Link href={href} className="text-xs text-[var(--gold)] mt-2 inline-block" onClick={onMark}>
              Abrir
            </Link>
          ) : null}
        </div>
        {!n.readAt ? (
          <button type="button" className="athena-icon-btn" aria-label="Marcar como lida" onClick={onMark}>
            <Check size={16} />
          </button>
        ) : null}
      </div>
    </li>
  );
}
