import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAnyPermission, hasRole } from '@athena/shared';
import { AUTH_CONTEXT_KEY, RequestAuth } from '../../auth/auth.types';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators/rbac.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const req = context.switchToHttp().getRequest<RequestAuth>();
    const auth = req[AUTH_CONTEXT_KEY];
    if (auth?.isSuperAdmin) return true;
    if (!hasRole(auth?.roles, required)) {
      throw new ForbiddenException('Missing required role');
    }
    return true;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const req = context.switchToHttp().getRequest<RequestAuth>();
    const auth = req[AUTH_CONTEXT_KEY];
    if (auth?.isSuperAdmin) return true;
    if (!hasAnyPermission(auth?.permissions, required)) {
      throw new ForbiddenException('Missing required permission');
    }
    return true;
  }
}

@Injectable()
export class CompanyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestAuth>();
    const auth = req[AUTH_CONTEXT_KEY];
    if (!auth) throw new ForbiddenException('No auth context');
    if (auth.isSuperAdmin) return true;
    const header = req.headers['x-company-id'];
    const companyId = Array.isArray(header) ? header[0] : header;
    if (!companyId) return true;
    if (!auth.companyIds.includes(String(companyId))) {
      throw new ForbiddenException('Company not allowed for this user');
    }
    return true;
  }
}

@Injectable()
export class UnitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestAuth>();
    const auth = req[AUTH_CONTEXT_KEY];
    if (!auth) throw new ForbiddenException('No auth context');
    if (auth.isSuperAdmin) return true;
    const header = req.headers['x-unit-id'];
    const unitId = Array.isArray(header) ? header[0] : header;
    if (!unitId) return true;
    if (auth.unitIds.length > 0 && !auth.unitIds.includes(String(unitId))) {
      throw new ForbiddenException('Unit not allowed for this user');
    }
    return true;
  }
}
