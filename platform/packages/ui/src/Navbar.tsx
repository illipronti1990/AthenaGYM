import type { ReactNode } from 'react';

export function Navbar({
  left,
  right,
  className = '',
}: {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`athena-navbar ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>{left}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
    </header>
  );
}
