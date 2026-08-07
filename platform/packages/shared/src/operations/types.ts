export type ScheduleType =
  | 'class'
  | 'assessment'
  | 'personal'
  | 'nutrition'
  | 'event'
  | 'maintenance'
  | 'reservation';

export type ScheduleStatus = 'scheduled' | 'cancelled' | 'completed' | 'in_progress';

export type ClassEnrollmentStatus =
  | 'reserved'
  | 'checked_in'
  | 'cancelled'
  | 'waitlist'
  | 'no_show';

export type CheckinMethod =
  | 'qr'
  | 'biometric'
  | 'facial'
  | 'manual'
  | 'nfc'
  | 'partner'
  | 'cpf'
  | 'code';

export type AccessResult = 'allowed' | 'denied';

export type PartnerProvider = 'wellhub' | 'totalpass';

export type PartnerAccessStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type PartnerHubType = 'benefit' | 'turnstile' | 'other';

export interface AccessRules {
  id: string;
  companyId: string;
  unitId: string | null;
  maxCheckinsPerDay: number;
  minIntervalMinutes: number;
  blockOverdue: boolean;
  blockExpiredPlan: boolean;
  blockFrozen: boolean;
  graceDays: number;
  allowedWeekdays: number[];
  allowedHoursJson: { start: string; end: string };
}

export interface PartnerHubItem {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  type: PartnerHubType;
  status: string;
  settings: Record<string, unknown>;
}

export interface PartnerApiLog {
  id: string;
  companyId: string;
  provider: string;
  endpoint: string;
  status: string;
  httpStatus: number | null;
  error: string | null;
  payload: Record<string, unknown>;
  payloadHash: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface PresencePerson {
  studentId: string;
  fullName: string;
  checkinAt: string;
  durationSec: number;
  partner: string | null;
  method: string;
}

export interface PresenceSnapshot {
  present: PresencePerson[];
  presentCount: number;
  avgDurationSec: number;
  peakToday: number;
  checkinsToday: number;
  deniedToday: number;
  byPartner: Record<string, number>;
}

export interface AccessLiveEvent {
  id: string;
  studentId: string | null;
  studentName: string | null;
  result: AccessResult;
  reason: string | null;
  reasonLabel: string | null;
  method: string | null;
  partner: string | null;
  createdAt: string;
}

export interface PartnerIntegration {
  id: string;
  companyId: string;
  provider: PartnerProvider;
  enabled: boolean;
  status: string;
  externalGymId: string | null;
  notes: string | null;
}

export interface PartnerAccessRequest {
  id: string;
  companyId: string;
  unitId: string | null;
  provider: PartnerProvider;
  status: PartnerAccessStatus;
  memberName: string;
  memberDocument: string | null;
  memberEmail: string | null;
  externalMemberId: string | null;
  externalBookingId: string | null;
  studentId: string | null;
  checkinId: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
}

export type RoomStatus = 'active' | 'maintenance' | 'inactive';

export type AttendanceSource = 'manual' | 'checkin' | 'partner';

export interface Modality {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  color: string;
  defaultTeacherId: string | null;
  defaultRoomId: string | null;
  defaultCapacity: number;
  active: boolean;
}

export interface Room {
  id: string;
  companyId: string;
  unitId: string;
  name: string;
  capacity: number;
  area: string | null;
  active: boolean;
  equipmentJson: unknown[];
  status: RoomStatus;
}

export interface Schedule {
  id: string;
  companyId: string;
  unitId: string;
  title: string;
  type: ScheduleType;
  startAt: string;
  endAt: string;
  teacherId: string | null;
  roomId: string | null;
  modalityId: string | null;
  color: string | null;
  recurrenceRule: string | null;
  seriesId: string | null;
  isBlock: boolean;
  equipmentNotes: string | null;
  maxCapacity: number;
  status: ScheduleStatus;
  notes: string | null;
  reservedCount?: number;
  waitlistCount?: number;
}

export interface ClassEnrollment {
  id: string;
  companyId: string;
  scheduleId: string;
  studentId: string;
  status: ClassEnrollmentStatus;
  waitlistPosition: number | null;
  checkinAt: string | null;
  cancelledAt: string | null;
  attendedAt: string | null;
  markedBy: string | null;
  source: AttendanceSource;
  createdAt: string;
}

export interface AgendaDashboard {
  classesToday: number;
  confirmedToday: number;
  occupancyPct: number;
  teachersInClass: number;
  assessmentsToday: number;
  reservationsToday: number;
  waitlistToday: number;
}

export interface AgendaKpis {
  from: string;
  to: string;
  attendanceRate: number;
  cancellations: number;
  topModalities: Array<{ modalityId: string | null; name: string; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
}

export interface AgendaSuggestion {
  weekday: number;
  hour: number;
  score: number;
  label: string;
}

export interface Checkin {
  id: string;
  companyId: string;
  unitId: string;
  studentId: string;
  scheduleId: string | null;
  method: CheckinMethod;
  device: string | null;
  deviceId: string | null;
  direction: 'in' | 'out';
  partner: string | null;
  externalCheckinId: string | null;
  createdAt: string;
}

export interface AccessDevice {
  id: string;
  companyId: string;
  unitId: string;
  name: string;
  manufacturer: string | null;
  ip: string | null;
  provider: string;
  status: string;
}

export interface AccessLog {
  id: string;
  companyId: string;
  unitId: string | null;
  studentId: string | null;
  deviceId: string | null;
  result: AccessResult;
  reason: string | null;
  reasonLabel: string | null;
  method: string | null;
  partner: string | null;
  createdAt: string;
}

export interface OperationsKpis {
  checkinsToday: number;
  deniedToday: number;
  presentNow: number;
  avgDurationSec: number;
  peakToday: number;
  byPartner: Record<string, number>;
}

export interface OccupancyArea {
  area: string;
  present: number;
  capacity: number;
  occupancyPct: number;
}

export interface OperationsDashboard {
  presentNow: number;
  entriesToday: number;
  exitsToday: number;
  occupancyPct: number;
  classesInProgress: number;
  areas: OccupancyArea[];
}

export interface QrTokenPayload {
  studentId: string;
  companyId: string;
  unitId: string;
  exp: number;
  nonce: string;
}

export const QR_TTL_SECONDS = 30;

/** Student/AI may cancel a class reservation only until this many minutes before start. */
export const CLASS_CANCEL_CUTOFF_MINUTES = 10;

export function canCancelClassReservation(
  startAt: string | Date,
  now: Date = new Date(),
  cutoffMinutes: number = CLASS_CANCEL_CUTOFF_MINUTES,
): boolean {
  const start = typeof startAt === 'string' ? new Date(startAt) : startAt;
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() - now.getTime() > cutoffMinutes * 60_000;
}

export function classCancelBlockMessage(
  startAt: string | Date,
  now: Date = new Date(),
  cutoffMinutes: number = CLASS_CANCEL_CUTOFF_MINUTES,
): string | null {
  if (canCancelClassReservation(startAt, now, cutoffMinutes)) return null;
  const start = typeof startAt === 'string' ? new Date(startAt) : startAt;
  if (Number.isNaN(start.getTime()) || start.getTime() <= now.getTime()) {
    return 'Não é possível cancelar: a aula já começou ou já passou.';
  }
  return `Cancelamento permitido apenas até ${cutoffMinutes} minutos antes do início da aula.`;
}

