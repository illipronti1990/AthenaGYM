import { assertCanSignContract, leadStatusFromStage } from './sales.rules';

describe('sales stage move', () => {
  it('maps won/lost/open from stage flags', () => {
    expect(leadStatusFromStage({ isWon: true, isLost: false })).toBe('won');
    expect(leadStatusFromStage({ isWon: false, isLost: true })).toBe('lost');
    expect(leadStatusFromStage({ isWon: false, isLost: false })).toBe('open');
  });
});

describe('contract sign prerequisites', () => {
  it('rejects already signed', () => {
    expect(() =>
      assertCanSignContract({ status: 'signed', studentId: 's1', leadId: null }),
    ).toThrow('Contract already signed');
  });

  it('requires student or lead', () => {
    expect(() =>
      assertCanSignContract({ status: 'draft', studentId: null, leadId: null }),
    ).toThrow('studentId or leadId required to sign');
  });

  it('allows draft with lead', () => {
    expect(() =>
      assertCanSignContract({ status: 'draft', studentId: null, leadId: 'l1' }),
    ).not.toThrow();
  });
});
