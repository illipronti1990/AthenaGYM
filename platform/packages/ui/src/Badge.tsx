import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone =
  | 'primary'
  | 'gold'
  | 'ativo'
  | 'inadimplente'
  | 'cancelado'
  | 'novo';

const toneClass: Record<BadgeTone, string> = {
  primary: 'movvo-badge-primary',
  gold: 'movvo-badge-gold',
  ativo: 'movvo-badge-ativo',
  inadimplente: 'movvo-badge-inadimplente',
  cancelado: 'movvo-badge-cancelado',
  novo: 'movvo-badge-novo',
};

export function Badge({
  tone = 'primary',
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span className={`movvo-badge ${toneClass[tone]} ${className}`} {...props}>
      {children}
    </span>
  );
}
