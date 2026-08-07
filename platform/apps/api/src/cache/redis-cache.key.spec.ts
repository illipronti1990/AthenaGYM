import { buildCacheKey } from './redis-cache.service';

describe('buildCacheKey', () => {
  it('formats movvo:{env}:{companyId}:{domain}:{key}', () => {
    expect(buildCacheKey('production', 'co-1', 'dashboard', 'kpis')).toBe(
      'movvo:production:co-1:dashboard:kpis',
    );
  });

  it('uses global when companyId is null/undefined/empty', () => {
    expect(buildCacheKey('development', null, 'settings', 'gym')).toBe(
      'movvo:development:global:settings:gym',
    );
    expect(buildCacheKey('development', undefined, 'settings', 'gym')).toBe(
      'movvo:development:global:settings:gym',
    );
    expect(buildCacheKey('staging', '', 'branding', 'wl')).toBe(
      'movvo:staging:global:branding:wl',
    );
  });
});
