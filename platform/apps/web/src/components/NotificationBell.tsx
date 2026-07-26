'use client';

import { useEffect, useState } from 'react';
import type { AppNotification } from '@athena/shared';
import { engagementApi } from '@/modules/engagement/services/engagementApi';

export function NotificationBell({ accessToken }: { accessToken: string }) {
  const [open, setOpen] = useState(false);
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

  async function mark(id: string) {
    try {
      await engagementApi.markRead(accessToken, id);
      await load();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border)] text-lg text-[var(--gold)] transition hover:border-[var(--gold)] hover:text-[var(--gold-light)]"
        aria-label="Notificações"
        title="Notificações"
      >
        <span aria-hidden>🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-auto rounded border border-zinc-200 bg-white shadow-lg">
          <div className="border-b px-3 py-2 text-sm font-semibold">Central de notificações</div>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-zinc-500">Nenhuma notificação</p>
          ) : (
            <ul>
              {items.slice(0, 20).map((n) => (
                <li
                  key={n.id}
                  className={`border-b border-zinc-100 px-3 py-2 text-sm ${
                    n.readAt ? 'text-zinc-500' : 'text-zinc-900'
                  }`}
                >
                  <div className="font-medium">{n.title}</div>
                  <div className="text-xs text-zinc-600">{n.body}</div>
                  {!n.readAt && (
                    <button
                      type="button"
                      className="mt-1 text-xs text-[#A3001B] underline"
                      onClick={() => void mark(n.id)}
                    >
                      Marcar lida
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
