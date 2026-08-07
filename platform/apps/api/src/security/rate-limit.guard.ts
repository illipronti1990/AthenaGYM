import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service';

export const THROTTLE_KEY = 'throttle_limit';

export const ThrottleLimit = (limit: number, windowSec = 60) =>
  SetMetadata(THROTTLE_KEY, { limit, windowSec });

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<{ limit: number; windowSec: number }>(
      THROTTLE_KEY,
      context.getHandler(),
    ) || { limit: 100, windowSec: 60 };

    const req = context.switchToHttp().getRequest<{
      ip?: string;
      headers: Record<string, string | undefined>;
      path?: string;
      route?: { path?: string };
    }>();
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() ||
      req.ip ||
      'unknown';
    const path = req.route?.path || req.path || 'unknown';
    const bucket = `${path}:${ip}`;
    const windowStart = new Date(
      Math.floor(Date.now() / (meta.windowSec * 1000)) * meta.windowSec * 1000,
    ).toISOString();

    const admin = this.supabase.getAdmin();
    const { data: existing } = await admin
      .from('api_rate_limits')
      .select('id, hit_count')
      .eq('bucket_key', bucket)
      .eq('window_start', windowStart)
      .maybeSingle();

    let hits = (existing?.hit_count || 0) + 1;
    if (existing) {
      await admin
        .from('api_rate_limits')
        .update({ hit_count: hits })
        .eq('id', existing.id);
    } else {
      const { error } = await admin.from('api_rate_limits').insert({
        bucket_key: bucket,
        window_start: windowStart,
        hit_count: 1,
      });
      if (error) return true;
      hits = 1;
    }

    if (hits > meta.limit) {
      throw new HttpException(
        { statusCode: 429, message: 'Too many requests', retryAfter: meta.windowSec },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}

const mem = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class InMemoryRateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const meta = this.reflector.get<{ limit: number; windowSec: number }>(
      THROTTLE_KEY,
      context.getHandler(),
    ) || { limit: 5, windowSec: 60 };

    const req = context.switchToHttp().getRequest<{
      ip?: string;
      headers: Record<string, string | undefined>;
      route?: { path?: string };
      path?: string;
      body?: { email?: string };
    }>();
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() ||
      req.ip ||
      'unknown';
    const email = (req.body?.email || '').toLowerCase();
    const key = `${req.route?.path || req.path}:${ip}:${email}`;
    const now = Date.now();
    const slot = mem.get(key);
    if (!slot || slot.resetAt < now) {
      mem.set(key, { count: 1, resetAt: now + meta.windowSec * 1000 });
      return true;
    }
    slot.count += 1;
    if (slot.count > meta.limit) {
      throw new HttpException(
        { statusCode: 429, message: 'Too many requests', retryAfter: meta.windowSec },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
