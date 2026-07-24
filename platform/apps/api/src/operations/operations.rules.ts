import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { QR_TTL_SECONDS } from '@athenas/shared';

export type AccessValidationIssue =
  | 'student_inactive'
  | 'student_not_found'
  | 'unit_mismatch'
  | 'overdue_receivable'
  | 'no_active_enrollment'
  | 'qr_expired'
  | 'qr_invalid'
  | 'duplicate_checkin'
  | 'class_full';

export function assertStudentActive(status: string | null | undefined): AccessValidationIssue | null {
  if (!status) return 'student_not_found';
  const s = status.toLowerCase();
  if (['inactive', 'blocked', 'cancelled', 'inativo', 'bloqueado'].includes(s)) {
    return 'student_inactive';
  }
  return null;
}

export function assertUnitMatch(
  studentUnitId: string | null | undefined,
  requestUnitId: string,
): AccessValidationIssue | null {
  if (studentUnitId && studentUnitId !== requestUnitId) return 'unit_mismatch';
  return null;
}

export function isClassFull(reserved: number, maxCapacity: number): boolean {
  return reserved >= maxCapacity;
}

export function nextWaitlistPosition(positions: number[]): number {
  if (positions.length === 0) return 1;
  return Math.max(...positions) + 1;
}

/** Signed QR payload: base64url(payloadJson).signature */
export function signQrToken(
  payload: { studentId: string; companyId: string; unitId: string; exp: number; nonce: string },
  secret: string,
): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyQrToken(
  token: string,
  secret: string,
  nowMs = Date.now(),
): { ok: true; payload: { studentId: string; companyId: string; unitId: string; exp: number; nonce: string } } | { ok: false; issue: AccessValidationIssue } {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, issue: 'qr_invalid' };
  const [body, sig] = parts;
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, issue: 'qr_invalid' };
    }
  } catch {
    return { ok: false, issue: 'qr_invalid' };
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      studentId: string;
      companyId: string;
      unitId: string;
      exp: number;
      nonce: string;
    };
    if (!payload.studentId || !payload.companyId || !payload.unitId || !payload.exp) {
      return { ok: false, issue: 'qr_invalid' };
    }
    if (payload.exp * 1000 < nowMs) return { ok: false, issue: 'qr_expired' };
    return { ok: true, payload };
  } catch {
    return { ok: false, issue: 'qr_invalid' };
  }
}

export function buildQrPayload(
  studentId: string,
  companyId: string,
  unitId: string,
  ttlSeconds = QR_TTL_SECONDS,
) {
  return {
    studentId,
    companyId,
    unitId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: randomBytes(8).toString('hex'),
  };
}
