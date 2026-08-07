import type { CSSProperties } from 'react';

type LogoVariant = 'horizontal' | 'compact';
type LogoTone = 'brand' | 'gold' | 'white';

const SRC: Record<LogoTone, { horizontal: string; compact: string }> = {
  brand: { horizontal: 'logo.svg', compact: 'logo-small.svg' },
  gold: { horizontal: 'logo-gold.svg', compact: 'logo-mark.svg' },
  white: { horizontal: 'logo-white.svg', compact: 'logo-mark.svg' },
};

export function Logo({
  variant = 'horizontal',
  tone = 'brand',
  className = '',
  href = '/brand',
}: {
  variant?: LogoVariant;
  tone?: LogoTone;
  className?: string;
  /** Base path for brand assets (default /brand) */
  href?: string;
}) {
  const file = variant === 'compact' ? SRC[tone].compact : SRC[tone].horizontal;
  const src = `${href}/${file}`;
  const style: CSSProperties =
    variant === 'compact'
      ? { width: 40, height: 40, display: 'block' }
      : { width: '100%', maxWidth: 220, height: 'auto', display: 'block' };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: className.includes('justify-start') ? 'flex-start' : 'center',
        padding: className.includes('p-0') || className.includes('!p-0')
          ? 0
          : variant === 'compact'
            ? 8
            : '20px 16px',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Movvo ERP" style={style} data-testid="ui-logo" />
    </div>
  );
}
