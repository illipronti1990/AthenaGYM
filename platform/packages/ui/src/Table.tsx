import type { ReactNode, TableHTMLAttributes } from 'react';

export function Table({
  children,
  className = '',
  ...props
}: TableHTMLAttributes<HTMLTableElement> & { children: ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid var(--border)' }}>
      <table
        className={className}
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '0.75rem 1rem',
        color: 'var(--gold)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        fontWeight: 700,
      }}
    >
      {children}
    </th>
  );
}

export function Td({ children }: { children: ReactNode }) {
  return (
    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
      {children}
    </td>
  );
}
