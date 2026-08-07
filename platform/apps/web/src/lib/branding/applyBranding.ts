import type { ResolvedCompanyBranding } from '@movvo/shared';

/** Apply tenant brand tokens to :root (CSS variables + data attributes). */
export function applyBrandingToDocument(branding: ResolvedCompanyBranding) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.style.setProperty('--primary', branding.primaryColor);
  root.style.setProperty('--primary-dark', shade(branding.primaryColor, -18));
  root.style.setProperty('--primary-hover', shade(branding.primaryColor, 12));
  root.style.setProperty('--gold', branding.secondaryColor);
  root.style.setProperty('--gold-light', shade(branding.secondaryColor, 18));

  root.dataset.companyTheme = branding.theme;
  root.dataset.companyName = branding.displayName;

  applyLogo(root, branding.logoUrl);
  applyFavicon(branding.faviconUrl);
  applyBackgroundLogin(root, branding.backgroundLogin);
}

function applyLogo(root: HTMLElement, logoUrl: string) {
  if (!logoUrl) {
    root.style.removeProperty('--brand-logo-url');
    delete root.dataset.brandLogo;
    return;
  }
  // Raw URL for img[src] / JS; pair with url() for CSS backgrounds.
  root.style.setProperty('--brand-logo-url', logoUrl);
  root.style.setProperty('--brand-logo-image', `url("${cssEscapeUrl(logoUrl)}")`);
  root.dataset.brandLogo = logoUrl;
}

function applyFavicon(faviconUrl: string) {
  if (!faviconUrl || typeof document === 'undefined') return;

  const icon =
    document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
    document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
  if (icon) {
    icon.href = faviconUrl;
  }

  const apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (apple) {
    apple.href = faviconUrl;
  }
}

/**
 * backgroundLogin may be a named preset (`movvo-red`), a solid color (`#0B1B33`),
 * or an image URL (`/brand/login-bg.jpg` / https://...).
 */
function applyBackgroundLogin(root: HTMLElement, value: string) {
  if (!value) {
    root.style.removeProperty('--brand-background-login');
    root.style.removeProperty('--brand-login-bg');
    delete root.dataset.backgroundLogin;
    delete root.dataset.loginBgKind;
    return;
  }

  root.style.setProperty('--brand-background-login', value);
  root.dataset.backgroundLogin = value;

  if (isCssColor(value)) {
    root.style.setProperty('--brand-login-bg', value);
    root.dataset.loginBgKind = 'color';
    return;
  }

  if (isImageUrl(value)) {
    root.style.setProperty('--brand-login-bg', `url("${cssEscapeUrl(value)}")`);
    root.dataset.loginBgKind = 'image';
    return;
  }

  root.style.removeProperty('--brand-login-bg');
  root.dataset.loginBgKind = 'preset';
}

function isCssColor(value: string): boolean {
  return (
    value.startsWith('#') ||
    value.startsWith('rgb(') ||
    value.startsWith('rgba(') ||
    value.startsWith('hsl(') ||
    value.startsWith('hsla(')
  );
}

function isImageUrl(value: string): boolean {
  if (/^https?:\/\//i.test(value)) return true;
  if (value.startsWith('data:image/')) return true;
  if (value.startsWith('/') && /\.(png|jpe?g|webp|svg|gif|avif)(\?|#|$)/i.test(value)) {
    return true;
  }
  return /\.(png|jpe?g|webp|svg|gif|avif)(\?|#|$)/i.test(value);
}

function cssEscapeUrl(url: string): string {
  return url.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function shade(hex: string, percent: number): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const num = parseInt(raw, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round((255 * percent) / 100)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round((255 * percent) / 100)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round((255 * percent) / 100)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
