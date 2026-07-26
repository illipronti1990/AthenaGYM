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
    state === 'valid' ? 'athena-input-valid' : state === 'invalid' ? 'athena-input-invalid' : '';
  const input = (
    <input id={id} className={`athena-input ${stateClass} ${className}`} {...props} />
  );

  if (!label && !hint) return input;

  return (
    <label className="block text-sm" htmlFor={id}>
      {label ? <span className="athena-label">{label}</span> : null}
      {input}
      {hint ? (
        <span className={`athena-field-hint ${state === 'valid' ? 'is-ok' : state === 'invalid' ? 'is-error' : ''}`}>
          {state === 'valid' ? '✔ ' : state === 'invalid' ? '❌ ' : ''}
          {hint}
        </span>
      ) : null}
    </label>
  );
}
