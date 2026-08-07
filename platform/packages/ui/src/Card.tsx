import type { HTMLAttributes, ReactNode } from 'react';

export function Card({
  hover = false,
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean; children: ReactNode }) {
  return (
    <div className={`movvo-card ${hover ? 'movvo-card-hover' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
