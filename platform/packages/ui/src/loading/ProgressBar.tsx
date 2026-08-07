'use client';

import { ProgressIndicator } from '../feedback/ProgressIndicator';

/** Alias aligned with DesignTokens loading primitives. */
export function ProgressBar({
  value,
  label,
  className = '',
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  return <ProgressIndicator value={value} label={label} className={className} />;
}
