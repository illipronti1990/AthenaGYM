'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md';
export type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'movvo-btn-primary',
  secondary: 'movvo-btn-secondary',
  success: 'movvo-btn-success',
  danger: 'movvo-btn-danger',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  loading = false,
  loadingLabel,
  status = 'idle',
  successLabel = 'Salvo',
  errorLabel = 'Erro',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  status?: ButtonStatus;
  successLabel?: string;
  errorLabel?: string;
}) {
  const resolved: ButtonStatus = loading || status === 'loading' ? 'loading' : status;
  const busy = resolved === 'loading';

  let content: ReactNode = children;
  if (resolved === 'loading') {
    content = (
      <>
        <Loader2 size={16} className="movvo-spin" aria-hidden />
        {loadingLabel || 'Salvando…'}
      </>
    );
  } else if (resolved === 'success') {
    content = (
      <>
        <Check size={16} aria-hidden />
        {successLabel}
      </>
    );
  } else if (resolved === 'error') {
    content = (
      <>
        <AlertTriangle size={16} aria-hidden />
        {errorLabel}
      </>
    );
  }

  const v =
    resolved === 'success' ? 'movvo-btn-success' : resolved === 'error' ? 'movvo-btn-danger' : variantClass[variant];

  return (
    <button
      type={type}
      className={`movvo-btn movvo-btn-animated ${v} ${size === 'sm' ? 'movvo-btn-sm' : ''} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {content}
    </button>
  );
}

/** Alias for product copy / PX-4 naming */
export const AnimatedButton = Button;
