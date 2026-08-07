'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { FormInput } from './fields';
import {
  formatCepMask,
  formatCnpjMask,
  formatCpfMask,
  formatCurrencyInput,
  formatPhoneMask,
  onlyDigits,
  parseCurrencyInput,
} from './masks';

type FieldState = 'idle' | 'valid' | 'invalid' | 'warning';

export function CpfInput({
  label = 'CPF',
  value,
  onChange,
  state,
  hint,
  disabled,
}: {
  label?: ReactNode;
  value: string;
  onChange: (masked: string, digits: string) => void;
  state?: FieldState;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <FormInput
      label={label}
      value={formatCpfMask(value)}
      onChange={(e) => {
        const digits = onlyDigits(e.target.value).slice(0, 11);
        onChange(formatCpfMask(digits), digits);
      }}
      inputMode="numeric"
      autoComplete="off"
      state={state}
      hint={hint}
      disabled={disabled}
      data-testid="cpf-input"
    />
  );
}

export function PhoneInput({
  label = 'Telefone',
  value,
  onChange,
  state,
  hint,
}: {
  label?: ReactNode;
  value: string;
  onChange: (masked: string, digits: string) => void;
  state?: FieldState;
  hint?: string;
}) {
  const digits = onlyDigits(value);
  const valid = digits.length >= 10 && digits.length <= 11;
  return (
    <FormInput
      label={label}
      value={formatPhoneMask(value)}
      onChange={(e) => {
        const d = onlyDigits(e.target.value).slice(0, 11);
        onChange(formatPhoneMask(d), d);
      }}
      inputMode="tel"
      state={state ?? (digits.length === 0 ? 'idle' : valid ? 'valid' : 'invalid')}
      hint={hint ?? (digits.length === 0 ? undefined : valid ? 'Número válido' : 'Telefone incompleto')}
      data-testid="phone-input"
    />
  );
}

export function CnpjInput({
  label = 'CNPJ',
  value,
  onChange,
}: {
  label?: ReactNode;
  value: string;
  onChange: (masked: string, digits: string) => void;
}) {
  return (
    <FormInput
      label={label}
      value={formatCnpjMask(value)}
      onChange={(e) => {
        const d = onlyDigits(e.target.value).slice(0, 14);
        onChange(formatCnpjMask(d), d);
      }}
      inputMode="numeric"
    />
  );
}

export function CepInput({
  label = 'CEP',
  value,
  onChange,
  onLookup,
  lookingUp = false,
  state,
  hint,
}: {
  label?: ReactNode;
  value: string;
  onChange: (masked: string, digits: string) => void;
  onLookup?: (digits: string) => void | Promise<void>;
  lookingUp?: boolean;
  state?: FieldState;
  hint?: string;
}) {
  useEffect(() => {
    const digits = onlyDigits(value);
    if (digits.length !== 8 || !onLookup) return;
    const t = setTimeout(() => void onLookup(digits), 400);
    return () => clearTimeout(t);
  }, [value, onLookup]);

  return (
    <FormInput
      label={label}
      value={formatCepMask(value)}
      onChange={(e) => {
        const d = onlyDigits(e.target.value).slice(0, 8);
        onChange(formatCepMask(d), d);
      }}
      inputMode="numeric"
      state={state}
      hint={lookingUp ? 'Buscando endereço…' : hint}
      data-testid="cep-input"
    />
  );
}

export function CurrencyInput({
  label = 'Valor (R$)',
  value,
  onChange,
  state,
  hint,
}: {
  label?: ReactNode;
  value: number;
  onChange: (n: number) => void;
  state?: FieldState;
  hint?: string;
}) {
  return (
    <FormInput
      label={label}
      value={formatCurrencyInput(value)}
      onChange={(e) => onChange(parseCurrencyInput(e.target.value))}
      inputMode="decimal"
      state={state}
      hint={hint}
      data-testid="currency-input"
    />
  );
}

export function DatePicker({
  label = 'Data',
  value,
  onChange,
  state,
  hint,
  showShortcuts = true,
}: {
  label?: ReactNode;
  value: string;
  onChange: (isoDate: string) => void;
  state?: FieldState;
  hint?: string;
  showShortcuts?: boolean;
}) {
  function shift(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().slice(0, 10));
  }

  return (
    <div className="movvo-field">
      <FormInput
        label={label}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        state={state}
        hint={hint}
        data-testid="date-input"
      />
      {showShortcuts ? (
        <div className="movvo-date-shortcuts">
          <button type="button" className="movvo-chip-mini" onClick={() => shift(0)}>
            Hoje
          </button>
          <button type="button" className="movvo-chip-mini" onClick={() => shift(-1)}>
            Ontem
          </button>
          <button type="button" className="movvo-chip-mini" onClick={() => shift(1)}>
            Amanhã
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TimePicker({
  label = 'Horário',
  value,
  onChange,
}: {
  label?: ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FormInput label={label} type="time" value={value} onChange={(e) => onChange(e.target.value)} />
  );
}

export function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione ou digite…',
}: {
  label?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes((q || value).toLowerCase()),
  );
  return (
    <div className="movvo-field">
      {label ? <span className="movvo-label">{label}</span> : null}
      <input
        className="movvo-input"
        list="movvo-combobox-list"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setQ(e.target.value);
          onChange(e.target.value);
        }}
      />
      <datalist id="movvo-combobox-list">
        {filtered.slice(0, 40).map((o) => (
          <option key={o.value} value={o.label} />
        ))}
      </datalist>
    </div>
  );
}
