'use client';

import type { FormHTMLAttributes, ReactNode } from 'react';

export function Form({
  children,
  className = '',
  ...props
}: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return (
    <form className={`athena-form ${className}`} {...props}>
      {children}
    </form>
  );
}

export function FormSection({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`athena-form-section ${className}`} data-testid="form-section">
      <header className="athena-form-section-head">
        <h3 className="athena-h3 text-[var(--gold)]">{title}</h3>
        {description ? <p className="athena-muted mt-1 text-sm">{description}</p> : null}
      </header>
      <div className="athena-form-section-body">{children}</div>
    </section>
  );
}

export function FormRow({
  children,
  cols = 2,
  className = '',
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div className={`athena-form-row athena-form-row-${cols} ${className}`} data-testid="form-row">
      {children}
    </div>
  );
}

export function FormActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`athena-form-actions ${className}`}>{children}</div>;
}

export function FormProgress({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="athena-form-progress" data-testid="form-progress">
      <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
        <span>{label || 'Progresso do cadastro'}</span>
        <span>{pct}% concluído</span>
      </div>
      <div className="athena-progress-track">
        <div className="athena-progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
