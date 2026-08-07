'use client';

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ValidationMessage } from './ValidationMessage';

type FieldState = 'idle' | 'valid' | 'invalid' | 'warning';

function FieldShell({
  label,
  hint,
  state = 'idle',
  htmlFor,
  children,
}: {
  label?: ReactNode;
  hint?: string;
  state?: FieldState;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label className="movvo-field" htmlFor={htmlFor}>
      {label ? <span className="movvo-label">{label}</span> : null}
      {children}
      <ValidationMessage state={state}>{hint}</ValidationMessage>
    </label>
  );
}

export function Textarea({
  label,
  hint,
  state = 'idle',
  className = '',
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  hint?: string;
  state?: FieldState;
}) {
  return (
    <FieldShell label={label} hint={hint} state={state} htmlFor={id}>
      <textarea
        id={id}
        className={`movvo-input movvo-textarea ${state === 'valid' ? 'movvo-input-valid' : state === 'invalid' ? 'movvo-input-invalid' : ''} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function Checkbox({
  label,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={`movvo-check ${className}`}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Switch({
  label,
  checked,
  onCheckedChange,
  className = '',
}: {
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <label className={`movvo-switch ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`movvo-switch-track ${checked ? 'is-on' : ''}`}
        onClick={() => onCheckedChange(!checked)}
      >
        <span className="movvo-switch-thumb" />
      </button>
      <span>{label}</span>
    </label>
  );
}

export function RadioGroup({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label?: ReactNode;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="movvo-field">
      {label ? <legend className="movvo-label">{label}</legend> : null}
      <div className="movvo-radio-group">
        {options.map((o) => (
          <label key={o.value} className="movvo-check">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FormSelect({
  label,
  hint,
  state = 'idle',
  className = '',
  id,
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  hint?: string;
  state?: FieldState;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <FieldShell label={label} hint={hint} state={state} htmlFor={id}>
      <select id={id} className={`movvo-input ${className}`} {...props}>
        {options.map((o) => (
          <option key={`${o.value}-${o.label}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function FormInput({
  label,
  hint,
  state = 'idle',
  className = '',
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  hint?: string;
  state?: FieldState;
}) {
  const stateClass =
    state === 'valid' ? 'movvo-input-valid' : state === 'invalid' ? 'movvo-input-invalid' : '';
  return (
    <FieldShell label={label} hint={hint} state={state} htmlFor={id}>
      <input id={id} className={`movvo-input ${stateClass} ${className}`} {...props} />
    </FieldShell>
  );
}
