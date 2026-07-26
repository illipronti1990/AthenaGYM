'use client';

export function PageLoader({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="athena-page-loader" role="status" aria-live="polite" data-testid="page-loader">
      <div className="athena-page-loader-spinner" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}
