export type StudentTimelineKind =
  | 'checkin'
  | 'payment'
  | 'assessment'
  | 'workout'
  | 'enrollment'
  | 'status';

export interface StudentTimelineEvent {
  id: string;
  kind: StudentTimelineKind;
  title: string;
  description?: string | null;
  occurredAt: string;
}

export const STUDENT_TIMELINE_KIND_LABELS: Record<StudentTimelineKind, string> = {
  checkin: 'Check-in',
  payment: 'Pagamento',
  assessment: 'Avaliação física',
  workout: 'Treino',
  enrollment: 'Matrícula',
  status: 'Status',
};
