export const CHECKIN_CREATED = 'operations.checkin_created';
export const CLASS_ENROLLED = 'operations.class_enrolled';
export const CLASS_WAITLISTED = 'operations.class_waitlisted';
export const CLASS_ENROLLMENT_CANCELLED = 'operations.class_enrollment_cancelled';
export const WAITLIST_PROMOTED = 'operations.waitlist_promoted';
export const ACCESS_DENIED = 'operations.access_denied';
export const ACCESS_ALLOWED = 'operations.access_allowed';
export const SCHEDULE_CREATED = 'operations.schedule_created';
export const SCHEDULE_CANCELLED = 'operations.schedule_cancelled';
export const ATTENDANCE_MARKED = 'operations.attendance_marked';
export const CLASS_COMPLETED = 'operations.class_completed';

export type CheckinCreatedEvent = {
  companyId: string;
  unitId: string;
  studentId: string;
  checkinId: string;
  method: string;
  scheduleId: string | null;
};

export type ClassEnrolledEvent = {
  companyId: string;
  scheduleId: string;
  studentId: string;
  enrollmentId: string;
  status: string;
};

export type WaitlistPromotedEvent = {
  companyId: string;
  scheduleId: string;
  studentId: string;
  enrollmentId: string;
};

export type AttendanceMarkedEvent = {
  companyId: string;
  scheduleId: string;
  count: number;
  actorId: string;
};

export type ClassCompletedEvent = {
  companyId: string;
  scheduleId: string;
  actorId: string;
  partnerLogId: string;
};
