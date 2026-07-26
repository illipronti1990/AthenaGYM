import type { ReactNode } from 'react';

/** Wrapper that ensures a visible :focus-visible ring (WCAG 2.2). */
export function FocusRing({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`athena-focus-ring ${className}`.trim()}>{children}</span>;
}
