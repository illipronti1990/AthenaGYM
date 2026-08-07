type LogoTone = 'gold' | 'white' | 'brand' | 'mark' | 'dark' | 'light';

const SRC: Record<LogoTone, string> = {
  gold: '/brand/logo-gold.svg',
  white: '/brand/logo-white.svg',
  brand: '/brand/logo.svg',
  mark: '/brand/logo-mark.svg',
  dark: '/brand/logo-dark.svg',
  light: '/brand/logo-light.svg',
};

export function LogoMovvo({
  tone = 'dark',
  className = '',
  size = 'md',
}: {
  tone?: LogoTone;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'mark';
}) {
  const dims =
    size === 'mark'
      ? { width: 56, height: 56 }
      : size === 'lg'
        ? { width: 240, height: 55 }
        : size === 'sm'
          ? { width: 140, height: 32 }
          : { width: 200, height: 46 };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[tone]}
      alt="Movvo ERP"
      width={dims.width}
      height={dims.height}
      className={`movvo-login-logo athena-login-logo ${className}`.trim()}
      decoding="async"
      data-testid="logo-movvo"
    />
  );
}

/** @deprecated Use LogoMovvo */
export const LogoAthena = LogoMovvo;
