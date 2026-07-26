import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="athena-empty">
      <p className="athena-title" style={{ margin: 0, fontSize: '1rem' }}>
        {title}
      </p>
      {description ? (
        <p className="athena-muted" style={{ marginTop: 8, fontSize: '0.875rem' }}>
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}
