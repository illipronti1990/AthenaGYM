'use client';

import type { ReactNode } from 'react';

export function AnimatedCard({
  hover = true,
  className = '',
  children,
}: {
  hover?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`athena-card ${hover ? 'athena-card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}
