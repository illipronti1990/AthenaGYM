import { createHash, randomInt } from 'crypto';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { MarketingMailer } from '../marketing/marketing.mailer';

@Injectable()
export class MfaService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    private readonly mailer: MarketingMailer,
  ) {}

  async status(user: AuthUser) {
    const row = await this.getOrCreate(user);
    return {
      totpEnabled: !!row.totp_enabled,
      emailOtpEnabled: !!row.email_otp_enabled,
      preferredMethod: row.preferred_method,
      lastVerifiedAt: row.last_verified_at,
      enforced: !!row.enforced_at || !!row.totp_enabled || !!row.email_otp_enabled,
    };
  }

  async enrollTotp(user: AuthUser, accessToken: string) {
    const client = this.userClient(accessToken);
    const { data, error } = await client.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Movvo Authenticator',
    });
    if (error) throw new BadRequestException(error.message);

    const admin = this.supabase.getAdmin();
    await admin
      .from('user_mfa')
      .upsert(
        {
          user_id: user.id,
          company_id: null,
          supabase_factor_id: data.id,
          preferred_method: 'totp',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    await this.audit.log({
      companyId: null,
      userId: user.id,
      module: 'auth',
      action: 'mfa.enroll_totp',
      entity: 'user_mfa',
      entityId: user.id,
    });

    return {
      factorId: data.id,
      qrCode: data.totp?.qr_code,
      secret: data.totp?.secret,
      uri: data.totp?.uri,
    };
  }

  async verifyTotp(user: AuthUser, accessToken: string, code: string) {
    const row = await this.getOrCreate(user);
    if (!row.supabase_factor_id) {
      throw new BadRequestException('TOTP not enrolled');
    }
    const client = this.userClient(accessToken);
    const challenge = await client.auth.mfa.challenge({ factorId: row.supabase_factor_id });
    if (challenge.error) throw new BadRequestException(challenge.error.message);

    const verified = await client.auth.mfa.verify({
      factorId: row.supabase_factor_id,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    if (verified.error) throw new UnauthorizedException(verified.error.message);

    const admin = this.supabase.getAdmin();
    await admin
      .from('user_mfa')
      .update({
        totp_enabled: true,
        preferred_method: 'totp',
        last_verified_at: new Date().toISOString(),
        enforced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    await this.audit.log({
      companyId: null,
      userId: user.id,
      module: 'auth',
      action: 'mfa.verify_totp',
      entity: 'user_mfa',
      entityId: user.id,
      severity: 'medium',
    });

    return { ok: true };
  }

  async disableTotp(user: AuthUser, accessToken: string) {
    const row = await this.getOrCreate(user);
    if (row.supabase_factor_id) {
      const client = this.userClient(accessToken);
      await client.auth.mfa.unenroll({ factorId: row.supabase_factor_id }).catch(() => undefined);
    }
    const admin = this.supabase.getAdmin();
    await admin
      .from('user_mfa')
      .update({
        totp_enabled: false,
        supabase_factor_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    await this.audit.log({
      companyId: null,
      userId: user.id,
      module: 'auth',
      action: 'mfa.disable_totp',
      entity: 'user_mfa',
      entityId: user.id,
      severity: 'high',
    });
    return { ok: true };
  }

  async sendEmailOtp(user: AuthUser) {
    const code = String(randomInt(100000, 999999));
    const hash = createHash('sha256').update(code).digest('hex');
    const expires = new Date(Date.now() + 10 * 60_000).toISOString();
    const admin = this.supabase.getAdmin();
    await admin
      .from('user_mfa')
      .upsert(
        {
          user_id: user.id,
          company_id: null,
          email_otp_enabled: true,
          email_otp_hash: hash,
          email_otp_expires_at: expires,
          preferred_method: 'email',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    const email = user.email;
    if (email) {
      await this.mailer.send({
        template: 'notice',
        to: email,
        subject: 'Código MFA Movvo',
        html: `<p>Seu código de verificação é <strong>${code}</strong>. Expira em 10 minutos.</p>`,
      });
    }

    await this.audit.log({
      companyId: null,
      userId: user.id,
      module: 'auth',
      action: 'mfa.email_otp_sent',
      entity: 'user_mfa',
      entityId: user.id,
    });

    const expose = this.config.get<string>('DEV_AUTH_ENABLED') === 'true';
    return { ok: true, ...(expose ? { debugCode: code } : {}) };
  }

  async verifyEmailOtp(user: AuthUser, code: string) {
    const row = await this.getOrCreate(user);
    if (!row.email_otp_hash || !row.email_otp_expires_at) {
      throw new BadRequestException('No OTP pending');
    }
    if (new Date(row.email_otp_expires_at).getTime() < Date.now()) {
      throw new UnauthorizedException('OTP expired');
    }
    const hash = createHash('sha256').update(code.trim()).digest('hex');
    if (hash !== row.email_otp_hash) {
      throw new UnauthorizedException('Invalid OTP');
    }
    const admin = this.supabase.getAdmin();
    await admin
      .from('user_mfa')
      .update({
        email_otp_hash: null,
        email_otp_expires_at: null,
        last_verified_at: new Date().toISOString(),
        enforced_at: new Date().toISOString(),
        email_otp_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    await this.audit.log({
      companyId: null,
      userId: user.id,
      module: 'auth',
      action: 'mfa.verify_email_otp',
      entity: 'user_mfa',
      entityId: user.id,
    });
    return { ok: true };
  }

  async requiresMfa(userId: string): Promise<boolean> {
    const admin = this.supabase.getAdmin();
    const { data } = await admin
      .from('user_mfa')
      .select('totp_enabled, email_otp_enabled, enforced_at')
      .eq('user_id', userId)
      .maybeSingle();
    return !!(data?.totp_enabled || data?.email_otp_enabled || data?.enforced_at);
  }

  private userClient(accessToken: string) {
    const url = this.config.get<string>('SUPABASE_URL')!;
    const anon = this.config.get<string>('SUPABASE_ANON_KEY')!;
    return createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private async getOrCreate(user: AuthUser) {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('user_mfa')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (data) return data;
    const { data: created, error: insErr } = await admin
      .from('user_mfa')
      .insert({
        user_id: user.id,
        company_id: null,
      })
      .select('*')
      .maybeSingle();
    if (insErr) throw new BadRequestException(insErr.message);
    return created!;
  }
}
