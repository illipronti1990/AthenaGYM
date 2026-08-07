import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '@movvo/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';

@Injectable()
export class LgpdService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  private companyId(auth: AuthContext): string {
    if (!auth.companyId) throw new BadRequestException('companyId required');
    return auth.companyId;
  }

  async listConsents(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('consents')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw new BadRequestException(error.message);
    return { items: data || [] };
  }

  async upsertConsent(
    auth: AuthContext,
    user: AuthUser,
    body: {
      purpose: string;
      version?: string;
      legalBasis?: string;
      granted: boolean;
      subjectUserId?: string;
      subjectEmail?: string;
    },
  ) {
    const companyId = this.companyId(auth);
    const admin = this.supabase.getAdmin();
    const row = {
      company_id: companyId,
      subject_user_id: body.subjectUserId || user.id,
      subject_email: body.subjectEmail || user.email || null,
      purpose: body.purpose,
      version: body.version || '1.0',
      legal_basis: body.legalBasis || 'consent',
      granted: body.granted,
      withdrawn_at: body.granted ? null : new Date().toISOString(),
      evidence: { actorId: user.id, at: new Date().toISOString() },
    };
    const { data, error } = await admin.from('consents').insert(row).select('*').maybeSingle();
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'lgpd',
      action: body.granted ? 'consent.granted' : 'consent.withdrawn',
      entity: 'consents',
      entityId: data?.id,
      afterData: row as unknown as Record<string, unknown>,
    });
    return data;
  }

  async listRequests(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('lgpd_requests')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new BadRequestException(error.message);
    return { items: data || [] };
  }

  async requestExport(auth: AuthContext, user: AuthUser, subjectUserId?: string) {
    return this.createAndProcess(auth, user, 'export', subjectUserId || user.id);
  }

  async requestAnonymize(auth: AuthContext, user: AuthUser, subjectUserId: string) {
    return this.createAndProcess(auth, user, 'anonymize', subjectUserId);
  }

  async requestErase(auth: AuthContext, user: AuthUser, subjectUserId: string) {
    return this.createAndProcess(auth, user, 'erase', subjectUserId);
  }

  private async createAndProcess(
    auth: AuthContext,
    user: AuthUser,
    type: 'export' | 'anonymize' | 'erase',
    subjectUserId: string,
  ) {
    const companyId = this.companyId(auth);
    const admin = this.supabase.getAdmin();

    const { data: subject } = await admin
      .from('profiles')
      .select('id, email, full_name, company_id')
      .eq('id', subjectUserId)
      .maybeSingle();
    if (!subject) throw new NotFoundException('Subject not found');
    if (subject.company_id && subject.company_id !== companyId && !auth.isSuperAdmin) {
      throw new BadRequestException('Subject outside tenant');
    }

    const { data: req, error } = await admin
      .from('lgpd_requests')
      .insert({
        company_id: companyId,
        subject_user_id: subjectUserId,
        subject_email: subject.email,
        request_type: type,
        status: 'processing',
        requested_by: user.id,
      })
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);

    let result: Record<string, unknown> = {};
    if (type === 'export') {
      result = await this.exportSubject(companyId, subjectUserId);
    } else if (type === 'anonymize') {
      result = await this.anonymizeSubject(companyId, subjectUserId);
    } else {
      result = await this.eraseSubject(companyId, subjectUserId);
    }

    await admin
      .from('lgpd_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: JSON.stringify({ keys: Object.keys(result) }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req!.id);

    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'lgpd',
      action: `lgpd.${type}`,
      entity: 'profiles',
      entityId: subjectUserId,
      severity: type === 'export' ? 'medium' : 'high',
      afterData: { requestId: req!.id },
    });

    return { request: req, result: type === 'export' ? result : { ok: true, ...result } };
  }

  private async exportSubject(companyId: string, userId: string) {
    const admin = this.supabase.getAdmin();
    const { data: profile } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle();
    const email = profile?.email as string | undefined;
    const studentsPromise = email
      ? admin.from('students').select('*').eq('company_id', companyId).eq('email', email)
      : Promise.resolve({ data: [] as unknown[] });

    const [students, consents, sessions, audit] = await Promise.all([
      studentsPromise,
      admin.from('consents').select('*').eq('subject_user_id', userId).eq('company_id', companyId),
      admin
        .from('user_sessions')
        .select('id, device, ip, city, created_at, last_seen_at, revoked_at')
        .eq('user_id', userId),
      admin
        .from('audit_logs')
        .select('id, module, action, entity, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      profile,
      students: students.data || [],
      consents: consents.data || [],
      sessions: sessions.data || [],
      audit: audit.data || [],
    };
  }

  private async anonymizeSubject(companyId: string, userId: string) {
    const admin = this.supabase.getAdmin();
    const { data: profile } = await admin.from('profiles').select('email').eq('id', userId).maybeSingle();
    const prevEmail = profile?.email as string | undefined;
    const anonEmail = `anon+${userId.slice(0, 8)}@anon.movvo.local`;
    await admin
      .from('profiles')
      .update({
        full_name: 'Titular Anonimizado',
        email: anonEmail,
        avatar_url: null,
      })
      .eq('id', userId);

    if (prevEmail) {
      await admin
        .from('students')
        .update({
          full_name: 'Titular Anonimizado',
          social_name: null,
          email: anonEmail,
          phone: null,
          whatsapp: null,
          cpf: null,
          rg: null,
          notes: null,
          photo_url: null,
        })
        .eq('company_id', companyId)
        .eq('email', prevEmail);
    }

    return { anonymized: true };
  }

  private async eraseSubject(companyId: string, userId: string) {
    const admin = this.supabase.getAdmin();
    const now = new Date().toISOString();
    const { data: profile } = await admin.from('profiles').select('email').eq('id', userId).maybeSingle();
    const prevEmail = profile?.email as string | undefined;
    await admin
      .from('profiles')
      .update({
        deleted_at: now,
        status: 'inactive',
        full_name: 'Titular Excluído',
        email: `erased+${userId.slice(0, 8)}@erased.movvo.local`,
        avatar_url: null,
      })
      .eq('id', userId);

    if (prevEmail) {
      await admin
        .from('students')
        .update({
          deleted_at: now,
          status: 'cancelled',
          full_name: 'Titular Excluído',
          email: null,
          phone: null,
          whatsapp: null,
          cpf: null,
          rg: null,
          notes: null,
        })
        .eq('company_id', companyId)
        .eq('email', prevEmail);
    }

    await admin
      .from('user_sessions')
      .update({ revoked_at: now, revoke_reason: 'lgpd_erase' })
      .eq('user_id', userId)
      .is('revoked_at', null);

    return { erased: true, softDelete: true };
  }
}
