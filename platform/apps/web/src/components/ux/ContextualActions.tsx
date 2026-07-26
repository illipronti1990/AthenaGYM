'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@athena/ui';

export type ContextualAction = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
};

export function ContextualActions({
  title = 'Próximas ações',
  actions,
}: {
  title?: string;
  actions: ContextualAction[];
}) {
  if (!actions.length) return null;

  return (
    <div className="athena-contextual" data-testid="contextual-actions">
      <p className="athena-contextual-label">{title}</p>
      {actions.map((a) => {
        const btn = (
          <Button
            key={a.id}
            type="button"
            size="sm"
            variant={a.variant || 'secondary'}
            onClick={a.onClick}
          >
            {a.label}
          </Button>
        );
        if (a.href) {
          return (
            <Link key={a.id} href={a.href}>
              <Button type="button" size="sm" variant={a.variant || 'secondary'}>
                {a.label}
              </Button>
            </Link>
          );
        }
        return btn;
      })}
    </div>
  );
}

export function whatsappChargeUrl(phone: string | null | undefined, studentName: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const text = encodeURIComponent(
    `Olá ${studentName}! Identificamos mensalidade em atraso na ATHENA GYM. Podemos ajudar a regularizar?`,
  );
  return `https://wa.me/55${digits.replace(/^55/, '')}?text=${text}`;
}

export function ContextualShell({ children }: { children: ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}
