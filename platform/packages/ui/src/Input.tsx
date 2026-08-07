import type { InputHTMLAttributes, ReactNode } from 'react';

export function Input({
  label,
  className = '',
  id,
  state,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  state?: 'idle' | 'valid' | 'invalid';
  hint?: string;
}) {
  const stateClass =
    state === 'valid' ? 'movvo-input-valid' : state === 'invalid' ? 'movvo-input-invalid' : '';
  const input = (
    <input id={id} className={`movvo-input ${stateClass} ${className}`} {...props} />
  );

  if (!label && !hint) return input;

  return (
    <label className="block text-sm" htmlFor={id}>
      {label ? <span className="movvo-label">{label}</span> : null}
      {input}
      {hint ? (
        <span className={`movvo-field-hint ${state === 'valid' ? 'is-ok' : state === 'invalid' ? 'is-error' : ''}`}>
          {state === 'valid' ? '✔ ' : state === 'invalid' ? '❌ ' : ''}
          {hint}
        </span>
      ) : null}
    </label>
  );
}
