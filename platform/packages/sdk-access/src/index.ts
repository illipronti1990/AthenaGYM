export type AccessValidateInput = {
  studentId: string;
  companyId: string;
  unitId: string;
  deviceId?: string;
  method?: string;
};

export type AccessValidateResult = {
  allowed: boolean;
  reason?: string;
};

export type OpenGateInput = {
  deviceId: string;
  companyId: string;
  unitId: string;
  studentId?: string;
};

export type SyncUsersInput = {
  companyId: string;
  unitId: string;
  users: Array<{ externalId: string; fullName: string; active: boolean }>;
};

export type HealthResult = {
  ok: boolean;
  provider: string;
  message?: string;
};

/** Hardware / biometrics vendor adapter — Control iD, Henry, TopData, Hikvision, Intelbras, Stub */
export interface AccessProvider {
  readonly name: string;
  validate(input: AccessValidateInput): Promise<AccessValidateResult>;
  openGate(input: OpenGateInput): Promise<{ opened: boolean; message?: string }>;
  syncUsers(input: SyncUsersInput): Promise<{ synced: number }>;
  health(): Promise<HealthResult>;
}

export class StubAccessProvider implements AccessProvider {
  readonly name = 'stub';

  async validate(_input: AccessValidateInput): Promise<AccessValidateResult> {
    return { allowed: true };
  }

  async openGate(input: OpenGateInput): Promise<{ opened: boolean; message?: string }> {
    return { opened: true, message: `stub gate open device=${input.deviceId}` };
  }

  async syncUsers(input: SyncUsersInput): Promise<{ synced: number }> {
    return { synced: input.users.length };
  }

  async health(): Promise<HealthResult> {
    return { ok: true, provider: this.name, message: 'stub online' };
  }
}

export function getAccessProvider(provider = 'stub'): AccessProvider {
  switch ((provider || 'stub').toLowerCase()) {
    case 'stub':
    default:
      return new StubAccessProvider();
  }
}
