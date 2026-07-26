import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  const v =
    variant === 'secondary'
      ? 'athena-btn-secondary'
      : variant === 'ghost'
        ? 'athena-btn-ghost'
        : 'athena-btn-primary';
  return (
    <button type="button" className={`athena-btn ${v} ${className}`} {...props}>
      {children}
    </button>
  );
}
