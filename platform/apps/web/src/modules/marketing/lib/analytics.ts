type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return;

  try {
    window.gtag?.('event', name, payload);
  } catch {
    /* ignore */
  }

  try {
    window.clarity?.('event', name);
  } catch {
    /* ignore */
  }

  try {
    if (name === 'demo_form_submit') window.fbq?.('track', 'Lead');
    else if (name === 'demo_cta_click') window.fbq?.('track', 'Schedule');
    else window.fbq?.('trackCustom', name, payload);
  } catch {
    /* ignore */
  }
}
