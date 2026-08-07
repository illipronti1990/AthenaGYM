'use client';

export function BrandLoader({ label = 'Carregando Movvo…' }: { label?: string }) {
  return (
    <div className="athena-login-loader" role="status" aria-live="polite" data-testid="brand-loader">
      <span className="athena-login-loader-ring" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** @deprecated Use BrandLoader */
export const AthenaLoader = BrandLoader;
