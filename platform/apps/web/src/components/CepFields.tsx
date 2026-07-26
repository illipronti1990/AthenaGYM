'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCep, lookupCep, onlyDigits, type CepAddress } from '@/utils/cep';

export type CepAddressFields = {
  zipCode: string;
  street: string;
  district: string;
  city: string;
  state: string;
  number?: string;
};

type Props = {
  value: CepAddressFields;
  onChange: (next: CepAddressFields) => void;
  /** Extra classes for the grid wrapper */
  className?: string;
  showNumber?: boolean;
  autoLookup?: boolean;
  testIdPrefix?: string;
};

export function CepFields({
  value,
  onChange,
  className = '',
  showNumber = true,
  autoLookup = true,
  testIdPrefix = 'cep',
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLookup = useRef('');

  function patch(partial: Partial<CepAddressFields>) {
    onChange({ ...value, ...partial });
  }

  async function search(raw?: string) {
    const digits = onlyDigits(raw ?? value.zipCode);
    if (digits.length !== 8) {
      setError('Informe um CEP com 8 dígitos');
      return;
    }
    if (lastLookup.current === digits && !error) return;
    setLoading(true);
    setError(null);
    try {
      const addr: CepAddress = await lookupCep(digits);
      lastLookup.current = digits;
      onChange({
        ...value,
        zipCode: addr.zipcode,
        street: addr.street || value.street,
        district: addr.district || value.district,
        city: addr.city || value.city,
        state: addr.state || value.state,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CEP não encontrado');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoLookup) return;
    const digits = onlyDigits(value.zipCode);
    if (digits.length !== 8) return;
    if (digits === lastLookup.current) return;
    const t = setTimeout(() => {
      void search(digits);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.zipCode, autoLookup]);

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--muted)]">CEP</span>
        <div className="flex gap-2">
          <input
            className="athena-input w-full"
            value={value.zipCode}
            onChange={(e) => {
              lastLookup.current = '';
              patch({ zipCode: formatCep(e.target.value) });
            }}
            onBlur={() => {
              if (onlyDigits(value.zipCode).length === 8) void search();
            }}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            data-testid={`${testIdPrefix}-zip`}
          />
          <button
            type="button"
            className="athena-btn athena-btn-secondary whitespace-nowrap"
            disabled={loading || onlyDigits(value.zipCode).length !== 8}
            onClick={() => void search()}
            data-testid={`${testIdPrefix}-lookup`}
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        <span className="mt-1 block text-xs text-[var(--muted)]">
          ViaCEP (Correios) — preenche rua, bairro, cidade e UF
        </span>
        {error ? (
          <span className="mt-1 block text-xs text-[var(--primary-hover)]">{error}</span>
        ) : null}
      </label>

      <label className="block text-sm sm:col-span-1">
        <span className="mb-1 block text-[var(--muted)]">Rua</span>
        <input
          className="athena-input w-full"
          value={value.street}
          onChange={(e) => patch({ street: e.target.value })}
          data-testid={`${testIdPrefix}-street`}
        />
      </label>

      {showNumber ? (
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Número</span>
          <input
            className="athena-input w-full"
            value={value.number || ''}
            onChange={(e) => patch({ number: e.target.value })}
            data-testid={`${testIdPrefix}-number`}
          />
        </label>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--muted)]">Bairro</span>
        <input
          className="athena-input w-full"
          value={value.district}
          onChange={(e) => patch({ district: e.target.value })}
          data-testid={`${testIdPrefix}-district`}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--muted)]">Cidade</span>
        <input
          className="athena-input w-full"
          value={value.city}
          onChange={(e) => patch({ city: e.target.value })}
          data-testid={`${testIdPrefix}-city`}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--muted)]">UF</span>
        <input
          className="athena-input w-full uppercase"
          value={value.state}
          maxLength={2}
          onChange={(e) => patch({ state: e.target.value.toUpperCase() })}
          data-testid={`${testIdPrefix}-state`}
        />
      </label>
    </div>
  );
}
