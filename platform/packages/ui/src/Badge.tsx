import type { ReactNode } from 'react';

export function Badge({
  tone = 'primary',
  children,
  className = '',
}: {
  tone?: 'primary' | 'gold';
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`athena-badge ${tone === 'gold' ? 'athena-badge-gold' : 'athena-badge-primary'} ${className}`}
    >
      {children}
    </span>
  );
}
