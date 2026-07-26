import type { CSSProperties } from 'react';

type LogoVariant = 'horizontal' | 'compact';

export function Logo({
  variant = 'horizontal',
  className = '',
  href = '/brand',
}: {
  variant?: LogoVariant;
  className?: string;
  /** Base path for brand assets (default /brand) */
  href?: string;
}) {
  const src = variant === 'compact' ? `${href}/logo-small.svg` : `${href}/logo.svg`;
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
      <img src={src} alt="ATHENA GYM Plataforma" style={style} />
    </div>
  );
}
