import type { ReactNode } from 'react';

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 12, fontSize: 13 }}>
      <ol style={{ display: 'flex', flexWrap: 'wrap', gap: 6, listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 ? <span className="athena-muted">/</span> : null}
            {item.href ? (
              <a href={item.href} className="athena-link">
                {item.label}
              </a>
            ) : (
              <span className="athena-muted">{item.label}</span>
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

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={className} style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
      <div
        style={{
          fontWeight: 800,
          letterSpacing: '0.18em',
          color: 'var(--gold)',
          fontSize: '1.15rem',
        }}
      >
        ATHENA
      </div>
      <div className="athena-muted" style={{ fontSize: 11, marginTop: 4 }}>
        GYM PLATFORM
      </div>
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(0,0,0,0.55)',
        padding: 16,
      }}
    >
      <div className="athena-card" style={{ width: '100%', maxWidth: 520 }} role="dialog" aria-modal>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 className="athena-title" style={{ margin: 0, fontSize: '1.1rem' }}>
            {title}
          </h2>
          <button type="button" className="athena-btn athena-btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Dialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="athena-muted" style={{ fontSize: 14, marginBottom: 16 }}>
        {message}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="athena-btn athena-btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="athena-btn athena-btn-primary" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
