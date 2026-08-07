import { RedisCacheService } from './redis-cache.service';

describe('RedisCacheService key format', () => {
  it('builds movvo env company domain key', () => {
    const svc = Object.create(RedisCacheService.prototype) as RedisCacheService;
    (svc as unknown as { env: string }).env = 'test';
    expect(svc.key('company-1', 'dashboard', 'exec:30d')).toBe(
      'movvo:test:company-1:dashboard:exec:30d',
    );
    expect(svc.key(null, 'plans', 'active')).toBe('movvo:test:global:plans:active');
  });

  it('exposes TTL constants aligned with FE', () => {
    expect(RedisCacheService.TTL.dashboard).toBe(30);
    expect(RedisCacheService.TTL.settings).toBe(3600);
    expect(RedisCacheService.TTL.branding).toBe(600);
    expect(RedisCacheService.TTL.flags).toBe(120);
  });
});
