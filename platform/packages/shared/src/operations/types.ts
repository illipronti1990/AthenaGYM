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

export type CheckinMethod = 'qr' | 'biometric' | 'facial' | 'manual' | 'nfc' | 'partner';

export type AccessResult = 'allowed' | 'denied';

export type PartnerProvider = 'wellhub' | 'totalpass';

export type PartnerAccessStatus = 'pending' | 'approved' | 'rejected' | 'expired';

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

export interface Room {
  id: string;
  companyId: string;
  unitId: string;
  name: string;
  capacity: number;
  area: string | null;
  active: boolean;
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
  createdAt: string;
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
  method: string | null;
  createdAt: string;
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
