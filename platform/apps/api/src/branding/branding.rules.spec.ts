import {
  ATHENA_ACADEMIA_BRANDING,
  resolveCompanyBranding,
} from '@movvo/shared';

describe('company branding resolution', () => {
  it('defaults to Athena Academia', () => {
    const brand = resolveCompanyBranding(null);
    expect(brand.displayName).toBe('Athena Academia');
    expect(brand.primaryColor).toBe('#D90429');
    expect(brand.secondaryColor).toBe('#D4AF37');
    expect(brand.theme).toBe('movvo');
  });

  it('allows another tenant to override colors without code changes', () => {
    const brand = resolveCompanyBranding({
      name: 'PowerFit Academia',
      primaryColor: '#1D4ED8',
      secondaryColor: '#93C5FD',
      backgroundLogin: '#0B1B33',
      theme: 'custom',
      logoUrl: '/tenants/powerfit/logo.svg',
    });
    expect(brand.displayName).toBe('PowerFit Academia');
    expect(brand.primaryColor).toBe('#1D4ED8');
    expect(brand.logoUrl).toContain('powerfit');
    expect(ATHENA_ACADEMIA_BRANDING.primaryColor).toBe('#D90429');
  });
});
