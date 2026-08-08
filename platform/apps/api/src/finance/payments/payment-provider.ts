import { createHmac, createHash, randomUUID } from 'crypto';

export type PixChargeInput = {
  companyId: string;
  amount: number;
  description: string;
  receivableId: string;
  customerName?: string;
  customerEmail?: string;
};

export type PixChargeResult = {
  externalId: string;
  qrCode: string;
  copyPaste: string;
};

export type NormalizedPaymentEvent = {
  externalId: string;
  status: 'paid' | 'failed' | 'cancelled' | 'pending';
  amount: number;
  paidAt: string | null;
  receivableId?: string | null;
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: string;
  createPixCharge(input: PixChargeInput): Promise<PixChargeResult>;
  parseWebhook(headers: Record<string, string>, rawBody: string): Promise<NormalizedPaymentEvent>;
  verifySignature(headers: Record<string, string>, rawBody: string): boolean;
}

export class StubPaymentProvider implements PaymentProvider {
  readonly name = 'stub';

  constructor(private readonly webhookSecret = process.env.FINANCE_WEBHOOK_SECRET || 'movvo-stub-secret') {}

  async createPixCharge(input: PixChargeInput): Promise<PixChargeResult> {
    const externalId = `stub_${input.receivableId}_${randomUUID().slice(0, 8)}`;
    const merchant = 'MOVVO ERP'.padEnd(25, ' ');
    const copyPaste = `00020126580014BR.GOV.BCB.PIX0136${externalId}520400005303986540${input.amount.toFixed(2)}5802BR5925${merchant}6009SAO PAULO62070503***6304ABCD`;
    return {
      externalId,
      qrCode: `data:text/plain;base64,${Buffer.from(copyPaste).toString('base64')}`,
      copyPaste,
    };
  }

  verifySignature(headers: Record<string, string>, rawBody: string): boolean {
    const sig = headers['x-movvo-signature'] || headers['X-Movvo-Signature'] || '';
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    return sig === expected || sig === `sha256=${expected}`;
  }

  async parseWebhook(
    _headers: Record<string, string>,
    rawBody: string,
  ): Promise<NormalizedPaymentEvent> {
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    return {
      externalId: String(body.externalId || body.id || ''),
      status: (body.status as NormalizedPaymentEvent['status']) || 'paid',
      amount: Number(body.amount || 0),
      paidAt: body.paidAt ? String(body.paidAt) : new Date().toISOString(),
      receivableId: body.receivableId ? String(body.receivableId) : null,
      raw: body,
    };
  }
}

/** Asaas sandbox adapter — falls back to stub behavior if ASAAS_API_KEY missing for create; webhook HMAC uses ASAAS_WEBHOOK_TOKEN */
export class AsaasPaymentProvider implements PaymentProvider {
  readonly name = 'asaas';
  private readonly stub = new StubPaymentProvider(process.env.ASAAS_WEBHOOK_TOKEN || 'asaas-dev');

  constructor(
    private readonly apiKey = process.env.ASAAS_API_KEY || '',
    private readonly baseUrl = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3',
  ) {}

  async createPixCharge(input: PixChargeInput): Promise<PixChargeResult> {
    if (!this.apiKey) {
      return this.stub.createPixCharge(input);
    }
    const res = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey,
      },
      body: JSON.stringify({
        billingType: 'PIX',
        value: input.amount,
        description: input.description,
        externalReference: input.receivableId,
      }),
    });
    if (!res.ok) {
      throw new Error(`Asaas createPix failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as Record<string, unknown>;
    return {
      externalId: String(data.id),
      qrCode: String(data.invoiceUrl || data.bankSlipUrl || ''),
      copyPaste: String(data.pixCopiaECola || data.id),
    };
  }

  verifySignature(headers: Record<string, string>, rawBody: string): boolean {
    const token = process.env.ASAAS_WEBHOOK_TOKEN || '';
    if (!token) return this.stub.verifySignature(headers, rawBody);
    const asaasToken = headers['asaas-access-token'] || headers['Asaas-Access-Token'] || '';
    return asaasToken === token;
  }

  async parseWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<NormalizedPaymentEvent> {
    if (!this.apiKey) return this.stub.parseWebhook(headers, rawBody);
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const payment = (body.payment as Record<string, unknown>) || body;
    const statusRaw = String(payment.status || '').toUpperCase();
    const status: NormalizedPaymentEvent['status'] =
      statusRaw === 'RECEIVED' || statusRaw === 'CONFIRMED' ? 'paid' : 'pending';
    return {
      externalId: String(payment.id || ''),
      status,
      amount: Number(payment.value || 0),
      paidAt: payment.paymentDate ? String(payment.paymentDate) : null,
      receivableId: payment.externalReference ? String(payment.externalReference) : null,
      raw: body,
    };
  }
}

export function payloadHash(rawBody: string): string {
  return createHash('sha256').update(rawBody).digest('hex');
}

export function getPaymentProvider(gateway: string): PaymentProvider {
  if (gateway === 'asaas') return new AsaasPaymentProvider();
  return new StubPaymentProvider();
}
