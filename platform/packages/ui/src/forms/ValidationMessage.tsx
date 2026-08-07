import type { ReactNode } from 'react';

export function ValidationMessage({
  state = 'idle',
  children,
}: {
  state?: 'idle' | 'valid' | 'invalid' | 'warning';
  children?: ReactNode;
}) {
  if (!children || state === 'idle') return null;
  return (
    <span
      className={`movvo-field-hint ${
        state === 'valid' ? 'is-ok' : state === 'invalid' ? 'is-error' : 'is-warn'
      }`}
      data-testid="validation-message"
    >
      {state === 'valid' ? '✔ ' : state === 'invalid' ? '❌ ' : '⚠ '}
      {children}
    </span>
  );
}
