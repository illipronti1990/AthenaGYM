/** Pure helpers for sales domain rules (unit-tested). */

export function leadStatusFromStage(stage: {
  isWon: boolean;
  isLost: boolean;
}): 'won' | 'lost' | 'open' {
  if (stage.isWon) return 'won';
  if (stage.isLost) return 'lost';
  return 'open';
}

export function assertCanSignContract(contract: {
  status: string;
  studentId: string | null;
  leadId: string | null;
}): void {
  if (contract.status === 'signed') {
    throw new Error('Contract already signed');
  }
  if (!contract.studentId && !contract.leadId) {
    throw new Error('studentId or leadId required to sign');
  }
}
