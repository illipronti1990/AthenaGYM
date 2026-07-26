'use client';

import { motion } from 'motion/react';
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
    <motion.div
      className={`athena-card ${hover ? 'athena-card-hover' : ''} ${className}`}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
