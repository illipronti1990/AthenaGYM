/** Public Event Bus contracts for plugins and partners — Sprint 9 */

export const PUBLIC_EVENTS = {
  StudentCreated: 'student.created',
  StudentUpdated: 'student.updated',
  PaymentConfirmed: 'payment.confirmed',
  CheckInCreated: 'checkin.created',
  ContractSigned: 'contract.signed',
  AssessmentCompleted: 'assessment.completed',
  WorkoutPublished: 'workout.published',
  LeadConverted: 'lead.converted',
} as const;

export type PublicEventName = (typeof PUBLIC_EVENTS)[keyof typeof PUBLIC_EVENTS];

export type DomainEventEnvelope<T = Record<string, unknown>> = {
  id: string;
  type: PublicEventName | string;
  companyId: string;
  occurredAt: string;
  environment: 'production' | 'sandbox';
  data: T;
};

export type EventHandler<T = Record<string, unknown>> = (
  event: DomainEventEnvelope<T>,
) => Promise<void> | void;

/** In-memory subscriber registry (plugins / Integration Hub) */
export class PublicEventBus {
  private handlers = new Map<string, EventHandler[]>();

  subscribe(eventType: string, handler: EventHandler): () => void {
    const list = this.handlers.get(eventType) || [];
    list.push(handler);
    this.handlers.set(eventType, list);
    return () => {
      const next = (this.handlers.get(eventType) || []).filter((h) => h !== handler);
      this.handlers.set(eventType, next);
    };
  }

  async publish(event: DomainEventEnvelope): Promise<void> {
    const specific = this.handlers.get(event.type) || [];
    const wildcard = this.handlers.get('*') || [];
    await Promise.all([...specific, ...wildcard].map((h) => h(event)));
  }
}

export function mapInternalToPublic(eventType: string): string | null {
  const map: Record<string, string> = {
    'students.created': PUBLIC_EVENTS.StudentCreated,
    'students.updated': PUBLIC_EVENTS.StudentUpdated,
    'finance.payment_confirmed': PUBLIC_EVENTS.PaymentConfirmed,
    'operations.checkin.created': PUBLIC_EVENTS.CheckInCreated,
    'sales.contract_signed': PUBLIC_EVENTS.ContractSigned,
    'workouts.assessment_completed': PUBLIC_EVENTS.AssessmentCompleted,
    'workouts.workout_published': PUBLIC_EVENTS.WorkoutPublished,
    'sales.lead_converted': PUBLIC_EVENTS.LeadConverted,
  };
  return map[eventType] || null;
}
