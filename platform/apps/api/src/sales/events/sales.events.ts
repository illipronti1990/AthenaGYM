export const CONTRACT_SIGNED = 'sales.contract_signed';

export type ContractSignedEvent = {
  contractId: string;
  companyId: string;
  planId: string;
  leadId: string | null;
  studentId: string | null;
  enrollmentId: string | null;
  signedBy: string;
};

/** Port for future BullMQ — Sprint 3 uses EventEmitter only */
export interface SalesOutboundPort {
  emitContractSigned(event: ContractSignedEvent): Promise<void> | void;
}
