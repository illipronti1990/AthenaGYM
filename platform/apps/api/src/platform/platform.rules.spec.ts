import {
  filterValidScopes,
  hasScope,
  isRateLimited,
  isValidScope,
  nextWebhookDelayMinutes,
  parseScopeString,
  verifyWebhookSignature,
} from './platform.rules';

describe('platform.rules', () => {
  it('validates oauth scopes', () => {
    expect(isValidScope('students.read')).toBe(true);
    expect(isValidScope('students.delete')).toBe(false);
    expect(filterValidScopes(['students.read', 'nope'])).toEqual(['students.read']);
  });

  it('checks insufficient scope', () => {
    expect(hasScope(['students.read'], 'students.write')).toBe(false);
    expect(hasScope(['students.read', 'students.write'], 'students.write')).toBe(true);
  });

  it('webhook retry schedule matches DoD', () => {
    expect(nextWebhookDelayMinutes(0)).toBe(1);
    expect(nextWebhookDelayMinutes(1)).toBe(5);
    expect(nextWebhookDelayMinutes(2)).toBe(15);
    expect(nextWebhookDelayMinutes(3)).toBe(60);
    expect(nextWebhookDelayMinutes(4)).toBe(1440);
    expect(nextWebhookDelayMinutes(5)).toBeNull();
  });

  it('rate limit boundary', () => {
    expect(isRateLimited(59, 60)).toBe(false);
    expect(isRateLimited(60, 60)).toBe(true);
  });

  it('parses scope string', () => {
    expect(parseScopeString('students.read finance.read')).toEqual([
      'students.read',
      'finance.read',
    ]);
  });

  it('verifies webhook HMAC', () => {
    const hmac = (secret: string, body: string) => `${secret}:${body}`;
    expect(verifyWebhookSignature('sec', 'body', 'sec:body', hmac)).toBe(true);
    expect(verifyWebhookSignature('sec', 'body', 'bad', hmac)).toBe(false);
  });
});
