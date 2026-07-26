import type { CSSProperties } from 'react';

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`athena-skeleton ${className}`} style={{ height: 16, ...style }} />;
}

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="athena-muted">
      <Skeleton style={{ width: 24, height: 24, borderRadius: 999 }} />
      <span className="athena-body">{label}</span>
    </div>
  );
}
