import type { SelectHTMLAttributes, ReactNode } from 'react';

export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={`athena-input ${className}`} {...props}>
      {children}
    </select>
  );
}
