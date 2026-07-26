export function onlyDigits(value: string) {
  return String(value || '').replace(/\D/g, '');
}

export function formatCpfMask(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatCnpjMask(value: string) {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function formatPhoneMask(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export function formatCepMask(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatCurrencyBRL(centsOrNumber: number) {
  return centsOrNumber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Parse user typing into decimal BRL number */
export function parseCurrencyInput(raw: string): number {
  const digits = onlyDigits(raw);
  if (!digits) return 0;
  return Number(digits) / 100;
}

export function formatCurrencyInput(value: number): string {
  const cents = Math.round((Number.isFinite(value) ? value : 0) * 100);
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercentMask(value: string) {
  const d = onlyDigits(value).slice(0, 5);
  if (d.length <= 2) return d;
  return `${d.slice(0, -2)},${d.slice(-2)}`;
}

export function formatWeightMask(value: string) {
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return value;
  return String(n);
}
