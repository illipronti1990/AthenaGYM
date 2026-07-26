import { OAUTH_SCOPES, WEBHOOK_RETRY_MINUTES } from '@athena/shared';

export function isValidScope(scope: string): boolean {
  return (OAUTH_SCOPES as readonly string[]).includes(scope);
}

export function filterValidScopes(scopes: string[]): string[] {
  return [...new Set(scopes.filter(isValidScope))];
}

export function hasScope(granted: string[], required: string | string[]): boolean {
  const need = Array.isArray(required) ? required : [required];
  return need.every((s) => granted.includes(s));
}

export function nextWebhookDelayMinutes(attempt: number): number | null {
  if (attempt < 0) return WEBHOOK_RETRY_MINUTES[0];
  if (attempt >= WEBHOOK_RETRY_MINUTES.length) return null;
  return WEBHOOK_RETRY_MINUTES[attempt];
}

export function isRateLimited(count: number, limit: number): boolean {
  return count >= limit;
}

export function parseScopeString(scope?: string): string[] | null {
  if (!scope?.trim()) return null;
  return filterValidScopes(scope.split(/[\s,]+/).filter(Boolean));
}

export function signWebhookPayload(secret: string, body: string, hmac: (s: string, b: string) => string): string {
  return hmac(secret, body);
}

export function verifyWebhookSignature(
  secret: string,
  body: string,
  signature: string,
  hmac: (s: string, b: string) => string,
): boolean {
  const expected = hmac(secret, body);
  return signature === expected || signature === `sha256=${expected}`;
}
