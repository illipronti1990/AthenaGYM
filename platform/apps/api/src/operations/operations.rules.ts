import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { QR_TTL_SECONDS } from '@athena/shared';

export type AccessValidationIssue =
  | 'student_inactive'
  | 'student_not_found'
  | 'unit_mismatch'
  | 'overdue_receivable'
  | 'enrollment_frozen'
  | 'no_active_enrollment'
  | 'plan_expired'
  | 'outside_hours'
  | 'outside_weekday'
  | 'max_checkins_reached'
  | 'duplicate_checkin'
  | 'qr_expired'
  | 'qr_invalid'
  | 'class_full'
  | 'device_denied';

export type AccessRulesShape = {
  maxCheckinsPerDay: number;
  minIntervalMinutes: number;
  blockOverdue: boolean;
  blockExpiredPlan: boolean;
  blockFrozen: boolean;
  graceDays: number;
  allowedWeekdays: number[];
  allowedHoursJson: { start: string; end: string };
};

const DENY_LABELS: Record<string, string> = {
  student_inactive: 'Aluno inativo ou bloqueado',
  student_not_found: 'Aluno não encontrado',
  unit_mismatch: 'Aluno não pertence a esta unidade',
  overdue_receivable: 'Mensalidade em atraso',
  enrollment_frozen: 'Matrícula congelada',
  no_active_enrollment: 'Sem plano ativo',
  plan_expired: 'Plano expirado',
  outside_hours: 'Fora do horário permitido',
  outside_weekday: 'Fora dos dias permitidos',
  max_checkins_reached: 'Limite diário de check-ins atingido',
  duplicate_checkin: 'Check-in duplicado no intervalo mínimo',
  qr_expired: 'QR Code expirado',
  qr_invalid: 'QR Code inválido',
  class_full: 'Turma lotada',
  device_denied: 'Dispositivo recusou o acesso',
};

export function humanizeDenyReason(reason: string, overdueDays?: number): string {
  if (reason === 'overdue_receivable' && overdueDays != null && overdueDays > 0) {
    return `Mensalidade vencida há ${overdueDays} dia${overdueDays === 1 ? '' : 's'}`;
  }
  return DENY_LABELS[reason] || reason;
}

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

export function assertWithinSchedule(
  rules: AccessRulesShape,
  now = new Date(),
): AccessValidationIssue | null {
  const weekday = now.getDay();
  if (rules.allowedWeekdays?.length && !rules.allowedWeekdays.includes(weekday)) {
    return 'outside_weekday';
  }
  const start = rules.allowedHoursJson?.start || '00:00';
  const end = rules.allowedHoursJson?.end || '23:59';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const startMins = (sh || 0) * 60 + (sm || 0);
  const endMins = (eh || 23) * 60 + (em || 59);
  if (mins < startMins || mins > endMins) return 'outside_hours';
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
):
  | {
      ok: true;
      payload: { studentId: string; companyId: string; unitId: string; exp: number; nonce: string };
    }
  | { ok: false; issue: AccessValidationIssue } {
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

export function verifyHmacSignature(
  rawBody: string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const clean = signature.replace(/^sha256=/i, '');
  try {
    const a = Buffer.from(clean);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
