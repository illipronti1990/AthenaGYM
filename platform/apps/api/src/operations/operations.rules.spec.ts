import {
  canCancelClassReservation,
  classCancelBlockMessage,
  CLASS_CANCEL_CUTOFF_MINUTES,
} from '@movvo/shared';
import {
  assertStudentActive,
  assertUnitMatch,
  buildQrPayload,
  isClassFull,
  nextWaitlistPosition,
  signQrToken,
  verifyQrToken,
} from './operations.rules';

describe('operations.rules', () => {
  it('detects inactive student', () => {
    expect(assertStudentActive('blocked')).toBe('student_inactive');
    expect(assertStudentActive('active')).toBeNull();
    expect(assertStudentActive(null)).toBe('student_not_found');
  });

  it('detects unit mismatch', () => {
    expect(assertUnitMatch('u1', 'u2')).toBe('unit_mismatch');
    expect(assertUnitMatch('u1', 'u1')).toBeNull();
    expect(assertUnitMatch(null, 'u1')).toBeNull();
  });

  it('class full and waitlist position', () => {
    expect(isClassFull(20, 20)).toBe(true);
    expect(isClassFull(19, 20)).toBe(false);
    expect(nextWaitlistPosition([])).toBe(1);
    expect(nextWaitlistPosition([1, 3])).toBe(4);
  });

  it('signs and verifies QR within TTL', () => {
    const secret = 'test-secret';
    const payload = buildQrPayload('s1', 'c1', 'u1', 30);
    const token = signQrToken(payload, secret);
    const ok = verifyQrToken(token, secret);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.payload.studentId).toBe('s1');
    }
  });

  it('rejects expired QR', () => {
    const secret = 'test-secret';
    const payload = { ...buildQrPayload('s1', 'c1', 'u1', 30), exp: Math.floor(Date.now() / 1000) - 10 };
    const token = signQrToken(payload, secret);
    const res = verifyQrToken(token, secret);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.issue).toBe('qr_expired');
  });

  it('rejects tampered QR', () => {
    const secret = 'test-secret';
    const token = signQrToken(buildQrPayload('s1', 'c1', 'u1'), secret) + 'x';
    const res = verifyQrToken(token, secret);
    expect(res.ok).toBe(false);
  });
});

describe('class cancel cutoff', () => {
  it(`allows cancel only before ${CLASS_CANCEL_CUTOFF_MINUTES} minutes`, () => {
    const now = new Date('2026-08-06T12:00:00.000Z');
    const okStart = new Date(now.getTime() + 11 * 60_000).toISOString();
    const blockedStart = new Date(now.getTime() + 5 * 60_000).toISOString();
    const started = new Date(now.getTime() - 60_000).toISOString();

    expect(canCancelClassReservation(okStart, now)).toBe(true);
    expect(classCancelBlockMessage(okStart, now)).toBeNull();

    expect(canCancelClassReservation(blockedStart, now)).toBe(false);
    expect(classCancelBlockMessage(blockedStart, now)).toMatch(/10 minutos/);

    expect(canCancelClassReservation(started, now)).toBe(false);
    expect(classCancelBlockMessage(started, now)).toMatch(/já começou/);
  });
});
