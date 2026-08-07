/** Benefit partner adapters — Wellhub / TotalPass (Sprint G-6 stubs) */

export type BenefitPartnerName = 'wellhub' | 'totalpass' | string;

export type ValidateMemberInput = {
  companyId: string;
  externalMemberId?: string;
  document?: string;
  email?: string;
};

export type ValidateMemberResult = {
  eligible: boolean;
  reason?: string;
  plan?: string;
  memberName?: string;
  externalMemberId?: string;
};

export type RegisterCheckinInput = {
  companyId: string;
  unitId: string;
  externalMemberId: string;
  studentId?: string;
  occurredAt?: string;
};

export interface BenefitPartnerAdapter {
  readonly name: BenefitPartnerName;
  validateMember(input: ValidateMemberInput): Promise<ValidateMemberResult>;
  syncMembers(companyId: string): Promise<{ synced: number }>;
  registerCheckin(input: RegisterCheckinInput): Promise<{ externalId: string }>;
  syncCheckins(
    companyId: string,
    from: string,
    to: string,
  ): Promise<{ imported: number }>;
  cancelMembership(externalMemberId: string): Promise<{ ok: boolean }>;
}

export class WellhubStubAdapter implements BenefitPartnerAdapter {
  readonly name = 'wellhub' as const;

  async validateMember(input: ValidateMemberInput): Promise<ValidateMemberResult> {
    if (input.document === '00000000000' || input.externalMemberId === 'ineligible') {
      return { eligible: false, reason: 'Membro Wellhub inelegível (stub)' };
    }
    return {
      eligible: true,
      plan: 'Wellhub Gympass Basic',
      memberName: 'Membro Wellhub Stub',
      externalMemberId: input.externalMemberId || `wh_${input.document || 'guest'}`,
    };
  }

  async syncMembers(_companyId: string) {
    return { synced: 3 };
  }

  async registerCheckin(input: RegisterCheckinInput) {
    return { externalId: `wh_ci_${input.externalMemberId}_${Date.now()}` };
  }

  async syncCheckins(_companyId: string, _from: string, _to: string) {
    return { imported: 0 };
  }

  async cancelMembership(_externalMemberId: string) {
    return { ok: true };
  }
}

export class TotalPassStubAdapter implements BenefitPartnerAdapter {
  readonly name = 'totalpass' as const;

  async validateMember(input: ValidateMemberInput): Promise<ValidateMemberResult> {
    if (input.document === '00000000000' || input.externalMemberId === 'ineligible') {
      return { eligible: false, reason: 'Membro TotalPass inelegível (stub)' };
    }
    return {
      eligible: true,
      plan: 'TotalPass Fit',
      memberName: 'Membro TotalPass Stub',
      externalMemberId: input.externalMemberId || `tp_${input.document || 'guest'}`,
    };
  }

  async syncMembers(_companyId: string) {
    return { synced: 2 };
  }

  async registerCheckin(input: RegisterCheckinInput) {
    return { externalId: `tp_ci_${input.externalMemberId}_${Date.now()}` };
  }

  async syncCheckins(_companyId: string, _from: string, _to: string) {
    return { imported: 0 };
  }

  async cancelMembership(_externalMemberId: string) {
    return { ok: true };
  }
}

export function getBenefitPartnerAdapter(provider: string): BenefitPartnerAdapter {
  switch ((provider || '').toLowerCase()) {
    case 'wellhub':
    case 'gympass':
      return new WellhubStubAdapter();
    case 'totalpass':
      return new TotalPassStubAdapter();
    default:
      return new WellhubStubAdapter();
  }
}
