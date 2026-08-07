'use client';

import type { FormHTMLAttributes, ReactNode } from 'react';

export function Form({
  children,
  className = '',
  ...props
}: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return (
    <form className={`movvo-form ${className}`} {...props}>
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
    <section className={`movvo-form-section ${className}`} data-testid="form-section">
      <header className="movvo-form-section-head">
        <h3 className="movvo-h3 text-[var(--gold)]">{title}</h3>
        {description ? <p className="movvo-muted mt-1 text-sm">{description}</p> : null}
      </header>
      <div className="movvo-form-section-body">{children}</div>
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
    <div className={`movvo-form-row movvo-form-row-${cols} ${className}`} data-testid="form-row">
      {children}
    </div>
  );
}

export function FormActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`movvo-form-actions ${className}`}>{children}</div>;
}

export function FormProgress({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="movvo-form-progress" data-testid="form-progress">
      <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
        <span>{label || 'Progresso do cadastro'}</span>
        <span>{pct}% concluído</span>
      </div>
      <div className="movvo-progress-track">
        <div className="movvo-progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
