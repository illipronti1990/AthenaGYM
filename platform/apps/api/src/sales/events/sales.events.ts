export const CONTRACT_SIGNED = 'sales.contract_signed';
export const LEAD_CREATED = 'sales.lead_created';
export const LEAD_CONVERTED = 'sales.lead_converted';

export type ContractSignedEvent = {
  contractId: string;
  companyId: string;
  planId: string;
  leadId: string | null;
  studentId: string | null;
  enrollmentId: string | null;
  signedBy: string;
};

export type LeadCreatedEvent = {
  companyId: string;
  leadId: string;
  userId: string;
};

export type LeadConvertedEvent = {
  companyId: string;
  leadId: string;
  studentId: string;
  userId: string;
};

/** Port for future BullMQ — Sprint 3 uses EventEmitter only */
export interface SalesOutboundPort {
  emitContractSigned(event: ContractSignedEvent): Promise<void> | void;
}
