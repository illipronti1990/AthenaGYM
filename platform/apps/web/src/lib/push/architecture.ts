/**
 * PX-7 — Push notifications architecture (browser first, native later).
 *
 * Flow:
 * 1. Request Notification permission
 * 2. Register service worker (`/sw.js`)
 * 3. Subscribe with VAPID public key → POST /push/subscriptions
 * 4. Server sends via Web Push; mobile app reuses same endpoint later
 *
 * Env:
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * - NEXT_PUBLIC_PUSH_ENABLED=true
 */

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
};

export function isPushConfigured() {
  return (
    process.env.NEXT_PUBLIC_PUSH_ENABLED === 'true' &&
    Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  );
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

/** Scaffold — wire SW + backend when VAPID keys are available. */
export async function preparePushSubscription(): Promise<PushSubscriptionPayload | null> {
  if (!isPushConfigured()) return null;
  const permission = await requestPushPermission();
  if (permission !== 'granted') return null;
  if (!('serviceWorker' in navigator)) return null;

  // Placeholder until /sw.js + PushManager subscribe is provisioned in prod.
  return null;
}
