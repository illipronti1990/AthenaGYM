import type { HTMLAttributes, ReactNode } from 'react';

export function Card({
  hover = false,
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean; children: ReactNode }) {
  return (
    <div className={`athena-card ${hover ? 'athena-card-hover' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
