import type { ResolvedCompanyBranding } from '@athena/shared';

/** Apply tenant brand tokens to :root (CSS variables). */
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

  const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (favicon && branding.faviconUrl) {
    favicon.href = branding.faviconUrl;
  }
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
