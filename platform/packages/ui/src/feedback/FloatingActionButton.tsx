'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Tooltip } from './Tooltip';

export function FloatingActionButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        className={`athena-fab ${className}`}
        aria-label={label}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  );
}
