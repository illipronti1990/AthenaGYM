'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md';
export type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'athena-btn-primary',
  secondary: 'athena-btn-secondary',
  success: 'athena-btn-success',
  danger: 'athena-btn-danger',
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
        <Loader2 size={16} className="athena-spin" aria-hidden />
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
    resolved === 'success' ? 'athena-btn-success' : resolved === 'error' ? 'athena-btn-danger' : variantClass[variant];

  return (
    <button
      type={type}
      className={`athena-btn athena-btn-animated ${v} ${size === 'sm' ? 'athena-btn-sm' : ''} ${className}`}
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
