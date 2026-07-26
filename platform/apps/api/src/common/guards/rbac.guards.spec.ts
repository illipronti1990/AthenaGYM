import { hasPermission, hasRole, canAccessUnit } from '@athena/shared';
import { PermissionsGuard, RolesGuard, UnitGuard } from './rbac.guards';
import { AUTH_CONTEXT_KEY } from '../../auth/auth.types';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import type { AuthContext } from '@athena/shared';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators/rbac.decorators';

describe('permission helpers', () => {
  it('hasPermission requires all', () => {
    expect(hasPermission(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(hasPermission(['a'], ['a', 'b'])).toBe(false);
  });

  it('hasRole matches any', () => {
    expect(hasRole(['admin', 'trainer'], 'trainer')).toBe(true);
    expect(hasRole(['admin'], 'trainer')).toBe(false);
  });

  it('canAccessUnit', () => {
    expect(canAccessUnit(['u1'], 'u1')).toBe(true);
    expect(canAccessUnit(['u1'], 'u2')).toBe(false);
    expect(canAccessUnit(['u1'], 'u2', true)).toBe(true);
    expect(canAccessUnit([], 'u1')).toBe(true);
  });
});

function mockCtx(auth: AuthContext | undefined, meta: Record<string, unknown> = {}) {
  const reflector = {
    getAllAndOverride: (key: string) => meta[key],
  } as unknown as Reflector;
  const req = { [AUTH_CONTEXT_KEY]: auth, headers: {} };
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => req }),
  };
  return { reflector, context };
}

describe('RolesGuard', () => {
  it('allows super admin', () => {
    const { reflector, context } = mockCtx(
      {
        userId: '1',
        email: null,
        companyId: null,
        companyIds: [],
        defaultUnitId: null,
        unitIds: [],
        roles: ['super_admin'],
        permissions: [],
        isSuperAdmin: true,
        status: 'active',
      },
      { [ROLES_KEY]: ['admin'] },
    );
    expect(new RolesGuard(reflector).canActivate(context as never)).toBe(true);
  });

  it('blocks missing role', () => {
    const { reflector, context } = mockCtx(
      {
        userId: '1',
        email: null,
        companyId: null,
        companyIds: [],
        defaultUnitId: null,
        unitIds: [],
        roles: ['student'],
        permissions: [],
        isSuperAdmin: false,
        status: 'active',
      },
      { [ROLES_KEY]: ['admin'] },
    );
    expect(() => new RolesGuard(reflector).canActivate(context as never)).toThrow(
      ForbiddenException,
    );
  });
});

describe('PermissionsGuard', () => {
  it('blocks missing permission', () => {
    const { reflector, context } = mockCtx(
      {
        userId: '1',
        email: null,
        companyId: 'c1',
        companyIds: ['c1'],
        defaultUnitId: null,
        unitIds: [],
        roles: ['trainer'],
        permissions: ['dashboard.read'],
        isSuperAdmin: false,
        status: 'active',
      },
      { [PERMISSIONS_KEY]: ['users.create'] },
    );
    expect(() => new PermissionsGuard(reflector).canActivate(context as never)).toThrow(
      ForbiddenException,
    );
  });
});

describe('UnitGuard', () => {
  it('blocks unit outside scope', () => {
    const auth: AuthContext = {
      userId: '1',
      email: null,
      companyId: 'c1',
      companyIds: ['c1'],
      defaultUnitId: 'u1',
      unitIds: ['u1'],
      roles: ['trainer'],
      permissions: [],
      isSuperAdmin: false,
      status: 'active',
    };
    const req = { [AUTH_CONTEXT_KEY]: auth, headers: { 'x-unit-id': 'u2' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => req }),
    };
    expect(() => new UnitGuard().canActivate(context as never)).toThrow(ForbiddenException);
  });
});
