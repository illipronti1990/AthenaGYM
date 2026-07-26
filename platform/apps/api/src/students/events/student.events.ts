export const STUDENT_CREATED = 'student.created';
export const STUDENT_UPDATED = 'student.updated';
export const STUDENT_STATUS_CHANGED = 'student.status_changed';
export const STUDENT_TRANSFERRED = 'student.transferred';

export type StudentCreatedEvent = {
  studentId: string;
  companyId: string;
  unitId: string;
  fullName: string;
  planName?: string | null;
};

export type StudentUpdatedEvent = {
  studentId: string;
  companyId: string;
  unitId?: string | null;
  planName?: string | null;
};

export type StudentStatusChangedEvent = {
  studentId: string;
  companyId: string;
  oldStatus: string | null;
  newStatus: string;
};

export type StudentTransferredEvent = {
  studentId: string;
  companyId: string;
  fromUnitId: string;
  toUnitId: string;
};
