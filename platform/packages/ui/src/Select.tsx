import type { SelectHTMLAttributes, ReactNode } from 'react';

export function Select({
  label,
  className = '',
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  children: ReactNode;
}) {
  const select = (
    <select id={id} className={`movvo-input ${className}`} {...props}>
      {children}
    </select>
  );
  if (!label) return select;
  return (
    <label className="block text-sm" htmlFor={id}>
      <span className="movvo-label">{label}</span>
      {select}
    </label>
  );
}
