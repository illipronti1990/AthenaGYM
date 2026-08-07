import { randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';
import type { AuthContext } from '@movvo/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthContextService } from './auth-context.service';
import { AuthUser } from './auth.types';
import { AuditService } from '../audit/audit.service';
import {
  AcceptInviteDto,
  ChangePasswordDto,
  DevLoginDto,
  InviteUserDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';

const DEV_USERS: Record<
  string,
  { password: string; userId: string }
> = {
  'teste@athena.local': {
    password: 'teste123',
    userId: '99999999-9999-9999-9999-999999999999',
  },
  'renan.aluno@athena.local': {
    password: 'teste123',
    userId: '99999999-9999-9999-9999-999999999991',
  },
  'bruna.professora@athena.local': {
    password: 'teste123',
    userId: '99999999-9999-9999-9999-999999999993',
  },
};

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly authContext: AuthContextService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  me(user: AuthUser) {
    return this.authContext.getMe(user);
  }

  /** Public login telemetry for security/audit (no secrets). */
  async recordLoginEvent(
    dto: { email: string; success: boolean; reason?: string },
    ip?: string,
    browser?: string,
  ) {
    const email = dto.email.trim().toLowerCase();
    const admin = this.supabase.getAdmin();

    // Lockout check (server-side; client success flag alone is not trusted for unlock)
    const nowIso = new Date().toISOString();
    const { data: lock } = await admin
      .from('security_events')
      .select('locked_until')
      .eq('event_type', 'login.lockout')
      .eq('email', email)
      .gt('locked_until', nowIso)
      .order('locked_until', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lock?.locked_until) {
      throw new UnauthorizedException(
        `Account temporarily locked until ${lock.locked_until}`,
      );
    }

    const action = dto.success ? 'login.success' : 'login.failed';
    await this.audit.log({
      companyId: null,
      userId: null,
      module: 'auth',
      action,
      entity: 'session',
      ip,
      browser,
      severity: dto.success ? 'info' : 'medium',
      metadata: {
        email,
        reason: dto.reason || null,
        at: new Date().toISOString(),
        clientReportedSuccess: dto.success,
      },
    });

    await admin.from('security_events').insert({
      event_type: action,
      severity: dto.success ? 'info' : 'medium',
      email,
      ip: ip || null,
      details: { reason: dto.reason || null, source: 'login-events' },
    });

    if (!dto.success) {
      const since = new Date(Date.now() - 15 * 60_000).toISOString();
      const { count } = await admin
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'login.failed')
        .eq('email', email)
        .gte('created_at', since);
      const failures = count || 0;
      if (failures >= 5) {
        const lockedUntil = new Date(Date.now() + 15 * 60_000).toISOString();
        await admin.from('security_events').insert({
          event_type: 'login.lockout',
          severity: 'high',
          email,
          ip: ip || null,
          locked_until: lockedUntil,
          details: { failures, windowMinutes: 15 },
        });
        await this.audit.log({
          companyId: null,
          userId: null,
          module: 'security',
          action: 'login.lockout',
          entity: 'security_events',
          ip,
          browser,
          severity: 'high',
          metadata: { email, lockedUntil, failures },
        });
      }
    }

    return { ok: true };
  }

  async recordLogout(user: AuthUser, ip?: string, browser?: string) {
    await this.audit.log({
      companyId: null,
      userId: user.id,
      module: 'auth',
      action: 'logout',
      entity: 'session',
      ip,
      browser,
    });
    return { ok: true };
  }

  async registerSessionAfterLogin(input: {
    userId: string;
    companyId?: string | null;
    accessToken: string;
    ip?: string;
    browser?: string;
  }) {
    const admin = this.supabase.getAdmin();
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update(input.accessToken).digest('hex');
    const { data, error } = await admin
      .from('user_sessions')
      .insert({
        user_id: input.userId,
        company_id: input.companyId || null,
        session_token_hash: hash,
        browser: input.browser || null,
        ip: input.ip || null,
        user_agent: input.browser || null,
        device: /mobile|android|iphone/i.test(input.browser || '')
          ? 'Mobile'
          : 'Desktop',
        last_seen_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();
    if (error) {
      // table may not exist yet
      return { ok: false, error: error.message };
    }
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
    return { ok: true, sessionId: data?.id };
  }

  /** Local DEV login: profile lives in Supabase Postgres; JWT minted by Nest. */
  async devLogin(dto: DevLoginDto) {
    const enabled = this.config.get<string>('DEV_AUTH_ENABLED') === 'true';
    if (!enabled) {
      throw new UnauthorizedException('DEV auth is disabled');
    }

    const email = dto.email.trim().toLowerCase();
    const account = DEV_USERS[email];
    if (!account || dto.password !== account.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const admin = this.supabase.getAdmin();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email, full_name, status, company_id, default_unit_id')
      .eq('id', account.userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !profile) {
      throw new UnauthorizedException('DEV profile missing — apply DEV user migration');
    }
    if (String(profile.status || 'active') === 'inactive') {
      throw new UnauthorizedException('User inactive');
    }

    const secret =
      this.config.get<string>('DEV_JWT_SECRET') ||
      this.config.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      throw new BadRequestException('DEV_JWT_SECRET (or SUPABASE_JWT_SECRET) required');
    }

    const accessToken = await new SignJWT({
      email: profile.email || email,
      role: 'authenticated',
      app_metadata: { provider: 'dev' },
      user_metadata: { full_name: profile.full_name },
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(String(profile.id))
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(new TextEncoder().encode(secret));

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 12 * 60 * 60,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        companyId: profile.company_id,
        defaultUnitId: profile.default_unit_id,
      },
    };
  }

  async invite(actor: AuthUser, auth: AuthContext, dto: InviteUserDto, ip?: string, browser?: string) {
    const admin = this.supabase.getAdmin();
    const companyId = dto.companyId || auth.companyId;
    if (!companyId) throw new BadRequestException('companyId required');

    const email = dto.email.trim().toLowerCase();
    const unitId = dto.unitId || auth.defaultUnitId || null;
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const existingInvite = await admin
      .from('invites')
      .select('*')
      .eq('company_id', companyId)
      .eq('email', email)
      .eq('status', 'pending')
      .is('deleted_at', null)
      .maybeSingle();

    let inviteRow = existingInvite.data as Record<string, unknown> | null;

    if (!inviteRow) {
      const { data, error } = await admin
        .from('invites')
        .insert({
          company_id: companyId,
          unit_id: unitId,
          role_id: dto.roleId,
          email,
          full_name: dto.fullName || null,
          phone: dto.phone || null,
          token,
          status: 'pending',
          expires_at: expiresAt,
          invited_by: actor.id,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new BadRequestException(error?.message || 'Failed to create invite');
      }
      inviteRow = data as Record<string, unknown>;
    } else {
      await admin
        .from('invites')
        .update({
          role_id: dto.roleId,
          unit_id: unitId,
          full_name: dto.fullName || inviteRow.full_name || null,
          phone: dto.phone || inviteRow.phone || null,
          expires_at: expiresAt,
          invited_by: actor.id,
        })
        .eq('id', inviteRow.id);
      inviteRow = {
        ...inviteRow,
        role_id: dto.roleId,
        unit_id: unitId,
        full_name: dto.fullName || inviteRow.full_name || null,
        phone: dto.phone || inviteRow.phone || null,
      };
    }

    // Staff must appear in lists immediately (Professor select, Usuários, etc.)
    const provisioned = await this.provisionStaff({
      email,
      fullName: dto.fullName || (inviteRow.full_name as string) || null,
      phone: dto.phone || (inviteRow.phone as string) || null,
      companyId,
      unitId: unitId ? String(unitId) : null,
      roleId: dto.roleId,
    });

    await admin
      .from('invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', inviteRow.id);

    await this.audit.log({
      companyId,
      userId: actor.id,
      module: 'auth',
      action: 'invite',
      entity: 'invite',
      entityId: String(inviteRow.id),
      ip,
      browser,
    });

    return {
      id: inviteRow.id,
      email,
      userId: provisioned.userId,
      token: String(inviteRow.token || token),
      expiresAt: expiresAt,
      status: 'accepted',
      acceptPath: `/accept-invite?token=${inviteRow.token || token}`,
      temporaryPassword: provisioned.temporaryPassword,
    };
  }

  /** Creates auth user + profile + role so the person appears in /users right away. */
  async provisionStaff(params: {
    email: string;
    fullName?: string | null;
    phone?: string | null;
    companyId: string;
    unitId: string | null;
    roleId: string;
    password?: string;
  }) {
    const admin = this.supabase.getAdmin();
    const email = params.email.trim().toLowerCase();
    const devAuth = this.config.get<string>('DEV_AUTH_ENABLED') === 'true';
    const password =
      params.password || (devAuth ? 'teste123' : randomBytes(12).toString('base64url'));
    const fullName = params.fullName || email.split('@')[0];

    let userId: string;
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !created.user) {
      const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = listed.data.users.find((u) => u.email?.toLowerCase() === email);
      if (!existing) {
        throw new BadRequestException(error?.message || 'Could not create user');
      }
      userId = existing.id;
      if (params.password || devAuth) {
        await admin.auth.admin.updateUserById(userId, { password });
      }
    } else {
      userId = created.user.id;
    }

    await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        phone: params.phone || null,
        company_id: params.companyId,
        default_unit_id: params.unitId,
        status: 'active',
      },
      { onConflict: 'id' },
    );

    await admin.from('memberships').upsert(
      {
        profile_id: userId,
        company_id: params.companyId,
        unit_id: params.unitId,
        role: 'member',
        status: 'active',
      },
      { onConflict: 'profile_id,company_id,role' },
    );

    const existingRole = await admin
      .from('user_roles')
      .select('id')
      .eq('profile_id', userId)
      .eq('role_id', params.roleId)
      .eq('company_id', params.companyId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!existingRole.data) {
      await admin.from('user_roles').insert({
        profile_id: userId,
        role_id: params.roleId,
        company_id: params.companyId,
        unit_id: params.unitId,
      });
    }

    return {
      userId,
      email,
      temporaryPassword: devAuth ? password : undefined,
    };
  }

  async accept(dto: AcceptInviteDto) {
    const admin = this.supabase.getAdmin();
    const inv = await admin
      .from('invites')
      .select('*')
      .eq('token', dto.token)
      .is('deleted_at', null)
      .maybeSingle();

    if (!inv.data) throw new NotFoundException('Invite not found');
    const row = inv.data as Record<string, unknown>;
    if (String(row.status) !== 'pending') {
      throw new BadRequestException('Invite already used or revoked');
    }
    if (new Date(String(row.expires_at)).getTime() < Date.now()) {
      await admin.from('invites').update({ status: 'expired' }).eq('id', row.id);
      throw new BadRequestException('Invite expired');
    }

    const email = String(row.email);
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { full_name: dto.fullName || row.full_name },
    });

    if (error || !created.user) {
      // user may already exist from inviteUserByEmail
      const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = listed.data.users.find((u) => u.email?.toLowerCase() === email);
      if (!existing) throw new BadRequestException(error?.message || 'Could not create user');
      await admin.auth.admin.updateUserById(existing.id, { password: dto.password });
      return this.finalizeAccept(existing.id, email, row, dto);
    }

    return this.finalizeAccept(created.user.id, email, row, dto);
  }

  private async finalizeAccept(
    userId: string,
    email: string,
    invite: Record<string, unknown>,
    dto: AcceptInviteDto,
  ) {
    const admin = this.supabase.getAdmin();
    const companyId = String(invite.company_id);
    const unitId = invite.unit_id ? String(invite.unit_id) : null;
    const roleId = String(invite.role_id);

    await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: dto.fullName || (invite.full_name as string) || email.split('@')[0],
        phone: dto.phone || (invite.phone as string) || null,
        company_id: companyId,
        default_unit_id: unitId,
        status: 'active',
      },
      { onConflict: 'id' },
    );

    await admin.from('memberships').upsert(
      {
        profile_id: userId,
        company_id: companyId,
        unit_id: unitId,
        role: 'admin',
        status: 'active',
      },
      { onConflict: 'profile_id,company_id,role' },
    );

    await admin.from('user_roles').insert({
      profile_id: userId,
      role_id: roleId,
      company_id: companyId,
      unit_id: unitId,
    });

    await admin
      .from('invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    await this.audit.log({
      companyId,
      userId,
      module: 'auth',
      action: 'accept_invite',
      entity: 'invite',
      entityId: String(invite.id),
    });

    return { ok: true, userId, email };
  }

  async changePassword(token: string, dto: ChangePasswordDto) {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid session');

    const { error: updErr } = await admin.auth.admin.updateUserById(data.user.id, {
      password: dto.newPassword,
    });
    if (updErr) throw new BadRequestException(updErr.message);

    await this.audit.log({
      companyId: null,
      userId: data.user.id,
      module: 'auth',
      action: 'change_password',
      entity: 'profile',
      entityId: data.user.id,
    });

    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const anon = this.supabase.getAnon();
    const redirectTo = process.env.PASSWORD_RESET_REDIRECT || 'http://localhost:3000/login';
    const { error } = await anon.auth.resetPasswordForEmail(dto.email, { redirectTo });
    if (error) throw new BadRequestException(error.message);
    return { ok: true, message: 'If the email exists, a reset link was sent' };
  }

  async updateProfile(user: AuthUser, dto: UpdateProfileDto) {
    const admin = this.supabase.getAdmin();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.fullName !== undefined) patch.full_name = dto.fullName;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.avatarUrl !== undefined) patch.avatar_url = dto.avatarUrl;
    if (dto.locale !== undefined) patch.locale = dto.locale;
    if (dto.timezone !== undefined) patch.timezone = dto.timezone;
    if (dto.defaultUnitId !== undefined) patch.default_unit_id = dto.defaultUnitId;
    if (dto.theme !== undefined) patch.theme = dto.theme;
    if (dto.preferences !== undefined) patch.preferences = dto.preferences;

    const { data, error } = await admin
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select('*')
      .single();
    if (error || !data) throw new BadRequestException(error?.message || 'Update failed');
    return this.authContext.mapProfile(data as Record<string, unknown>);
  }

  async uploadAvatar(user: AuthUser, file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Foto deve ter no máximo 2MB');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Arquivo deve ser imagem');
    }

    const admin = this.supabase.getAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();
    const companyId = profile?.company_id || '11111111-1111-1111-1111-111111111111';
    const ext = file.mimetype.includes('png') ? 'png' : 'jpg';
    const path = `companies/${companyId}/avatars/${user.id}.${ext}`;

    const { error: upErr } = await admin.storage
      .from('logos')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
    if (upErr) throw new BadRequestException(upErr.message);

    const { data: pub } = admin.storage.from('logos').getPublicUrl(path);
    return this.updateProfile(user, { avatarUrl: pub.publicUrl });
  }
}
