import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthContextService } from './auth-context.service';
import {
  AUTH_CONTEXT_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  AuthUser,
  RequestAuth,
} from './auth.types';

/** Validates Supabase JWT and enriches request with RBAC context (Sprint 1 — 1A). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
    private readonly authContext: AuthContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestAuth>();
    const header = String(req.headers.authorization || '');
    if (!header.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const token = header.slice(7).trim();
    const user = await this.verifyToken(token);
    req[AUTH_USER_KEY] = user;
    req[AUTH_TOKEN_KEY] = token;
    req[AUTH_CONTEXT_KEY] = await this.authContext.buildContext(user);
    return true;
  }

  private async verifyToken(token: string): Promise<AuthUser> {
    const url = this.config.get<string>('SUPABASE_URL') || '';
    const jwtSecret = this.config.get<string>('SUPABASE_JWT_SECRET');
    const devJwtSecret = this.config.get<string>('DEV_JWT_SECRET');
    const devAuthEnabled = this.config.get<string>('DEV_AUTH_ENABLED') === 'true';

    try {
      const { data, error } = await this.supabase.getAdmin().auth.getUser(token);
      if (!error && data.user) {
        return {
          id: data.user.id,
          email: data.user.email,
          role: (data.user.app_metadata?.role as string) || undefined,
        };
      }
    } catch {
      // fall through
    }

    if (devAuthEnabled && devJwtSecret) {
      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(devJwtSecret),
          { algorithms: ['HS256'] },
        );
        const sub = String(payload.sub || '');
        if (sub) {
          return {
            id: sub,
            email: typeof payload.email === 'string' ? payload.email : undefined,
            role: typeof payload.role === 'string' ? payload.role : undefined,
          };
        }
      } catch {
        // fall through to SUPABASE_JWT_SECRET / JWKS
      }
    }

    if (jwtSecret) {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(jwtSecret),
        { algorithms: ['HS256'] },
      );
      const sub = String(payload.sub || '');
      if (!sub) throw new UnauthorizedException('Invalid token');
      return {
        id: sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        role: typeof payload.role === 'string' ? payload.role : undefined,
      };
    }

    if (url) {
      if (!this.jwks) {
        this.jwks = createRemoteJWKSet(
          new URL(`${url.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`),
        );
      }
      try {
        const { payload } = await jwtVerify(token, this.jwks);
        const sub = String(payload.sub || '');
        if (!sub) throw new UnauthorizedException('Invalid token');
        return {
          id: sub,
          email: typeof payload.email === 'string' ? payload.email : undefined,
        };
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    throw new UnauthorizedException('Unable to validate token');
  }
}

/** @deprecated Use JwtAuthGuard */
export { JwtAuthGuard as SupabaseAuthGuard };
