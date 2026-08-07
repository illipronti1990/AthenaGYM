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

/** Hardware / biometrics vendor adapter — Control iD, Henry, TopData, Digicon, Stub */
export interface AccessProvider {
  readonly name: string;
  validate(input: AccessValidateInput): Promise<AccessValidateResult>;
  openGate(input: OpenGateInput): Promise<{ opened: boolean; message?: string }>;
  syncUsers(input: SyncUsersInput): Promise<{ synced: number }>;
  health(): Promise<HealthResult>;
}

export class StubAccessProvider implements AccessProvider {
  readonly name: string = 'stub';

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

/** Named manufacturer stubs — delegate to StubAccessProvider until real drivers land */
class NamedStubAccessProvider extends StubAccessProvider {
  constructor(readonly name: string) {
    super();
  }

  async openGate(input: OpenGateInput) {
    return {
      opened: true,
      message: `${this.name} stub gate open device=${input.deviceId}`,
    };
  }

  async health(): Promise<HealthResult> {
    return { ok: true, provider: this.name, message: `${this.name} stub online` };
  }
}

export function getAccessProvider(provider = 'stub'): AccessProvider {
  const key = (provider || 'stub').toLowerCase();
  switch (key) {
    case 'controlid':
    case 'control_id':
      return new NamedStubAccessProvider('controlid');
    case 'henry':
      return new NamedStubAccessProvider('henry');
    case 'topdata':
      return new NamedStubAccessProvider('topdata');
    case 'digicon':
      return new NamedStubAccessProvider('digicon');
    case 'stub':
    default:
      return new StubAccessProvider();
  }
}
