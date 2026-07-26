import { LogoAthena } from './LogoAthena';

export function AthenaLoader({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="athena-login-loader" role="status" aria-live="polite" data-testid="athena-loader">
      <div className="athena-login-loader-mark">
        <LogoAthena tone="mark" size="mark" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
