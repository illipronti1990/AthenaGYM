import type { CSSProperties } from 'react';

/** Canonical loading spinner — use instead of ad-hoc loaders in hubs. */
export function Spinner({
  size = 24,
  className = '',
  label,
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`athena-spinner ${className}`}
      role="status"
      aria-label={label || 'Carregando'}
      data-testid="spinner"
      style={
        {
          width: size,
          height: size,
          borderWidth: Math.max(2, Math.round(size / 12)),
        } as CSSProperties
      }
    />
  );
}
