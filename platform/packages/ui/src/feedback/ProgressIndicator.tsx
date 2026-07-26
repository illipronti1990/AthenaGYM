'use client';

export function ProgressIndicator({
  value,
  label,
  className = '',
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`athena-progress ${className}`} data-testid="progress-indicator">
      {label ? (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>{label}</span>
          <span className="text-[var(--muted)]">{pct}%</span>
        </div>
      ) : null}
      <div className="athena-progress-track">
        <div className="athena-progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
