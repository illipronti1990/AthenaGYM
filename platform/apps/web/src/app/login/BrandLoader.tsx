'use client';

export function BrandLoader({ label = 'Carregando Movvo…' }: { label?: string }) {
  return (
    <div className="movvo-login-loader" role="status" aria-live="polite" data-testid="brand-loader">
      <span className="movvo-login-loader-ring" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}
