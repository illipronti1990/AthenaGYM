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
    <div className={`movvo-card ${hover ? 'movvo-card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}
