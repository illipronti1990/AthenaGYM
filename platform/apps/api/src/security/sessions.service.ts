import { createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthContext } from '@movvo/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { SecretsCrypto } from './secrets-crypto';
import { SecurityEventsService } from './security-events.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly crypto: SecretsCrypto,
    private readonly events: SecurityEventsService,
  ) {}

  async register(input: {
    userId: string;
    companyId?: string | null;
    accessToken?: string;
    ip?: string;
    browser?: string;
    userAgent?: string;
    city?: string;
  }) {
    const admin = this.supabase.getAdmin();
    const tokenHash = input.accessToken
      ? this.crypto.hashToken(input.accessToken)
      : this.crypto.hashToken(randomBytes(16).toString('hex'));

    const device = this.guessDevice(input.userAgent || input.browser || '');

    const { data, error } = await admin
      .from('user_sessions')
      .insert({
        user_id: input.userId,
        company_id: input.companyId || null,
        session_token_hash: tokenHash,
        device,
        browser: input.browser || input.userAgent || null,
        ip: input.ip || null,
        city: input.city || null,
        user_agent: input.userAgent || input.browser || null,
        last_seen_at: new Date().toISOString(),
      })
      .select('*')
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      companyId: input.companyId || null,
      userId: input.userId,
      module: 'auth',
      action: 'session.created',
      entity: 'user_sessions',
      entityId: data?.id,
      ip: input.ip,
      browser: input.browser,
    });

    return data;
  }

  async listMine(user: AuthUser) {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .order('last_seen_at', { ascending: false })
      .limit(50);
    if (error) throw new BadRequestException(error.message);
    return { items: (data || []).map(this.mapSession) };
  }

  async listCompany(auth: AuthContext) {
    if (!auth.companyId && !auth.isSuperAdmin) {
      throw new ForbiddenException('company required');
    }
    const admin = this.supabase.getAdmin();
    let q = admin
      .from('user_sessions')
      .select('*')
      .is('revoked_at', null)
      .order('last_seen_at', { ascending: false })
      .limit(100);
    if (!auth.isSuperAdmin) {
      q = q.eq('company_id', auth.companyId);
    } else if (auth.companyId) {
      q = q.eq('company_id', auth.companyId);
    }
    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return { items: (data || []).map(this.mapSession) };
  }

  async revoke(user: AuthUser, sessionId: string, reason = 'user_revoke') {
    const admin = this.supabase.getAdmin();
    const { data: row, error } = await admin
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!row) throw new NotFoundException('Session not found');
    if (row.user_id !== user.id) {
      throw new ForbiddenException('Cannot revoke another user session');
    }
    const { error: updErr } = await admin
      .from('user_sessions')
      .update({
        revoked_at: new Date().toISOString(),
        revoke_reason: reason,
      })
      .eq('id', sessionId);
    if (updErr) throw new BadRequestException(updErr.message);

    await this.audit.log({
      companyId: row.company_id,
      userId: user.id,
      module: 'auth',
      action: 'session.revoked',
      entity: 'user_sessions',
      entityId: sessionId,
      afterData: { reason },
    });
    return { ok: true };
  }

  async revokeAll(user: AuthUser, exceptSessionId?: string) {
    const admin = this.supabase.getAdmin();
    let q = admin
      .from('user_sessions')
      .update({
        revoked_at: new Date().toISOString(),
        revoke_reason: 'revoke_all',
      })
      .eq('user_id', user.id)
      .is('revoked_at', null);
    if (exceptSessionId) q = q.neq('id', exceptSessionId);
    const { error } = await q;
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      companyId: null,
      userId: user.id,
      module: 'auth',
      action: 'session.revoke_all',
      entity: 'user_sessions',
    });

    try {
      await admin.auth.admin.signOut(user.id, 'global');
    } catch {
      /* best-effort */
    }

    return { ok: true };
  }

  async touch(sessionTokenHash: string) {
    if (!sessionTokenHash) return;
    const admin = this.supabase.getAdmin();
    await admin
      .from('user_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('session_token_hash', sessionTokenHash)
      .is('revoked_at', null);
  }

  async assertNotRevoked(accessToken: string) {
    const hash = this.crypto.hashToken(accessToken);
    const admin = this.supabase.getAdmin();
    const { data } = await admin
      .from('user_sessions')
      .select('id, revoked_at')
      .eq('session_token_hash', hash)
      .maybeSingle();
    if (data?.revoked_at) {
      throw new UnauthorizedException('Session revoked');
    }
  }

  private guessDevice(ua: string): string {
    const s = ua.toLowerCase();
    if (/mobile|android|iphone|ipad/.test(s)) return 'Mobile';
    if (/tablet/.test(s)) return 'Tablet';
    if (/windows|macintosh|linux/.test(s)) return 'Desktop';
    return 'Unknown';
  }

  private mapSession = (row: Record<string, unknown>) => ({
    id: row.id,
    device: row.device,
    browser: row.browser,
    ip: row.ip,
    city: row.city,
    country: row.country,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  });
}

/** Hash helper exported for auth login flow */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
