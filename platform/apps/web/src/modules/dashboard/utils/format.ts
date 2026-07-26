export function money(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatKpi(value: number, format: 'currency' | 'number' | 'percent') {
  if (format === 'currency') return money(value);
  if (format === 'percent') return `${value.toLocaleString('pt-BR')}%`;
  return value.toLocaleString('pt-BR');
}

export function greetingEmoji(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return '☀️';
  if (hour >= 12 && hour < 18) return '🌤';
  return '🌙';
}
