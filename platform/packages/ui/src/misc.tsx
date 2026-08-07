import type { ReactNode } from 'react';

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="movvo-caption" style={{ marginBottom: 16 }}>
      <ol style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 ? <span className="movvo-muted">/</span> : null}
            {item.href ? (
              <a href={item.href} className="movvo-link">
                {item.label}
              </a>
            ) : (
              <span className="movvo-muted">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Avatar({
  src,
  name,
  size = 36,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const initials = (name || 'A')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || 'avatar'}
        width={size}
        height={size}
        style={{ borderRadius: 999, objectFit: 'cover', border: '1px solid var(--border)' }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        color: 'var(--gold)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {initials}
    </div>
  );
}
