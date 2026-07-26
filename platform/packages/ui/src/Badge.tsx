import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone =
  | 'primary'
  | 'gold'
  | 'ativo'
  | 'inadimplente'
  | 'cancelado'
  | 'novo';

const toneClass: Record<BadgeTone, string> = {
  primary: 'athena-badge-primary',
  gold: 'athena-badge-gold',
  ativo: 'athena-badge-ativo',
  inadimplente: 'athena-badge-inadimplente',
  cancelado: 'athena-badge-cancelado',
  novo: 'athena-badge-novo',
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
    <span className={`athena-badge ${toneClass[tone]} ${className}`} {...props}>
      {children}
    </span>
  );
}
