import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
  icon,
  illustration,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  illustration?: ReactNode;
}) {
  return (
    <div className="movvo-empty" data-testid="empty-state">
      {illustration || icon ? (
        <div className="movvo-empty-icon" aria-hidden>
          {illustration || icon}
        </div>
      ) : null}
      <p className="movvo-h3" style={{ color: 'var(--gold)' }}>
        {title}
      </p>
      {description ? (
        <p className="movvo-muted" style={{ marginTop: 8, fontSize: '0.875rem' }}>
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

export function SuccessState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="movvo-state movvo-state-success">
      <p className="movvo-h3">✔ {title}</p>
      {description ? <p className="movvo-muted mt-2 text-sm">{description}</p> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="movvo-state movvo-state-error" data-testid="error-state">
      <p className="movvo-h3">⚠ {title}</p>
      {description ? <p className="movvo-muted mt-2 text-sm">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="movvo-offline-banner" role="status" data-testid="offline-banner">
      <span className="movvo-offline-dot" />
      Sem conexão. Tentando reconectar…
    </div>
  );
}
