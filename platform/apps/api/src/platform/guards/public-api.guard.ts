import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PublicApiContext } from '@movvo/shared';
import { PlatformService } from '../platform.service';

export const PUBLIC_API_CONTEXT_KEY = 'publicApiContext';
export const PUBLIC_SCOPES_KEY = 'publicScopes';

export type RequestPublic = {
  headers: Record<string, string | string[] | undefined>;
  [PUBLIC_API_CONTEXT_KEY]?: PublicApiContext;
};

@Injectable()
export class PublicApiGuard implements CanActivate {
  constructor(private readonly platform: PlatformService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestPublic>();
    const header = req.headers['authorization'] || req.headers['Authorization'];
    const raw = Array.isArray(header) ? header[0] : header;
    if (!raw) throw new UnauthorizedException('Missing Authorization');
    const ctx = await this.platform.resolvePublicAuth(raw);
    await this.platform.assertRateLimit(ctx);
    req[PUBLIC_API_CONTEXT_KEY] = ctx;
    return true;
  }
}

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly platform: PlatformService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PUBLIC_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const req = context.switchToHttp().getRequest<RequestPublic>();
    const ctx = req[PUBLIC_API_CONTEXT_KEY];
    if (!ctx) throw new UnauthorizedException('No public API context');
    await this.platform.assertScope(ctx, required);
    return true;
  }
}
