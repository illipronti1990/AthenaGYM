'use client';

import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import type { AppNotification } from '@athena/shared';
import { EmptyState, Tooltip } from '@athena/ui';
import { engagementApi } from '@/modules/engagement/services/engagementApi';
import { useLayout } from './LayoutProvider';

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

export function NotificationPanel({ accessToken }: { accessToken: string }) {
  const { notificationsOpen, setNotificationsOpen } = useLayout();
  const [items, setItems] = useState<AppNotification[]>([]);

  async function load() {
    try {
      setItems(await engagementApi.notifications(accessToken));
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const unread = items.filter((n) => !n.readAt).length;
  const today = items.filter((n) => isToday(n.createdAt));
  const earlier = items.filter((n) => !isToday(n.createdAt));

  async function mark(id: string) {
    try {
      await engagementApi.markRead(accessToken, id);
      await load();
    } catch {
      /* ignore */
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
          <aside className="athena-notification-drawer" data-testid="notification-panel">
            <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div>
                <h2 className="athena-h3">Notificações</h2>
                <p className="athena-caption">{unread} não lidas</p>
              </div>
              <button
                type="button"
                className="athena-btn athena-btn-secondary athena-btn-sm"
                onClick={() => setNotificationsOpen(false)}
              >
                Fechar
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-3">
              {items.length === 0 ? (
                <EmptyState
                  title="Nenhuma notificação"
                  description="Check-ins, pagamentos e matrículas aparecem aqui."
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

function NotificationRow({
  n,
  onMark,
}: {
  n: AppNotification;
  onMark: () => void;
}) {
  return (
    <li
      className={`rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-3 text-sm transition duration-150 hover:border-[var(--gold)] ${
        n.readAt ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <Check size={16} className="mt-0.5 shrink-0 text-[var(--success)]" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-[var(--text)]">{n.title}</p>
            <span className="shrink-0 text-xs text-[var(--muted)]">{relativeTime(n.createdAt)}</span>
          </div>
          {n.body ? <p className="mt-1 text-xs text-[var(--muted)]">{n.body}</p> : null}
          {!n.readAt ? (
            <button type="button" className="mt-2 text-xs text-[var(--gold)] underline" onClick={onMark}>
              Marcar lida
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
