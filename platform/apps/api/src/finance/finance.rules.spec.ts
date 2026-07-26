import {
  buildCashflow,
  buildDre,
  calcFine,
  calcInterest,
  calcReceivableNet,
  calcDelinquencyRate,
  splitInstallments,
} from '@athena/shared';
import { createHmac } from 'crypto';
import { StubPaymentProvider, payloadHash } from './payments/payment-provider';

describe('finance calculations', () => {
  it('calcReceivableNet', () => {
    expect(calcReceivableNet({ amount: 100, discount: 10, interest: 5, fine: 2 })).toBe(97);
  });

  it('interest and fine', () => {
    expect(calcInterest(100, 0.1, 10)).toBe(1);
    expect(calcFine(100, 2)).toBe(2);
  });

  it('splitInstallments', () => {
    expect(splitInstallments(100, 3)).toEqual([33.34, 33.33, 33.33]);
  });

  it('cashflow and dre', () => {
    const cf = buildCashflow([
      { date: '2026-07-01', direction: 'in', amount: 100 },
      { date: '2026-07-01', direction: 'out', amount: 40 },
      { date: '2026-07-02', direction: 'in', amount: 10 },
    ]);
    expect(cf[0].balance).toBe(60);
    expect(cf[1].balance).toBe(70);

    const dre = buildDre({
      from: '2026-07-01',
      to: '2026-07-31',
      grossRevenue: 1000,
      discounts: 50,
      costs: 200,
      expenses: 300,
    });
    expect(dre.netRevenue).toBe(950);
    expect(dre.operatingProfit).toBe(450);
  });

  it('delinquency', () => {
    expect(calcDelinquencyRate(72, 1000)).toBe(7.2);
  });
});

describe('stub payment provider hmac + idempotency hash', () => {
  it('verifies signature', async () => {
    const provider = new StubPaymentProvider('secret');
    const body = JSON.stringify({
      externalId: 'stub_1',
      status: 'paid',
      amount: 129,
      receivableId: 'r1',
    });
    const sig = createHmac('sha256', 'secret').update(body).digest('hex');
    expect(provider.verifySignature({ 'x-athena-signature': sig }, body)).toBe(true);
    expect(provider.verifySignature({ 'x-athena-signature': 'bad' }, body)).toBe(false);
    const event = await provider.parseWebhook({}, body);
    expect(event.status).toBe('paid');
    expect(payloadHash(body)).toHaveLength(64);
  });

  it('createPixCharge returns qr', async () => {
    const provider = new StubPaymentProvider();
    const charge = await provider.createPixCharge({
      companyId: 'c1',
      amount: 129,
      description: 'Test',
      receivableId: 'r1',
    });
    expect(charge.externalId).toContain('stub_r1');
    expect(charge.copyPaste.length).toBeGreaterThan(10);
  });
});
