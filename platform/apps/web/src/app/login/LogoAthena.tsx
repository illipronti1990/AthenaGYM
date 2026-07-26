type LogoTone = 'gold' | 'white' | 'brand' | 'mark';

const SRC: Record<LogoTone, string> = {
  gold: '/brand/logo-gold.svg',
  white: '/brand/logo-white.svg',
  brand: '/brand/logo.svg',
  mark: '/brand/logo-mark.svg',
};

export function LogoAthena({
  tone = 'gold',
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
        ? { width: 240, height: 42 }
        : size === 'sm'
          ? { width: 140, height: 28 }
          : { width: 200, height: 36 };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[tone]}
      alt="ATHENA"
      width={dims.width}
      height={dims.height}
      className={`athena-login-logo ${className}`.trim()}
      decoding="async"
    />
  );
}
