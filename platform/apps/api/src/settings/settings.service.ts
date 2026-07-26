import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthContext,
  GymSettingsResponse,
  OpsDashboard,
} from '@athena/shared';
import { AuthUser } from '../auth/auth.types';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../supabase/supabase.service';
import { PatchGymSettingsDto } from './dto/settings.dto';
import { mapAccountSummary, mapGymSettings } from './settings.mapper';

const DEV_COMPANY = '11111111-1111-1111-1111-111111111111';
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

@Injectable()
export class SettingsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  private companyId(auth: AuthContext, override?: string | null): string {
    if (auth.isSuperAdmin) {
      return override || auth.companyId || auth.companyIds[0] || DEV_COMPANY;
    }
    const id = override || auth.companyId || auth.companyIds[0];
    if (!id || (!auth.companyIds.includes(id) && !auth.isSuperAdmin)) {
      throw new BadRequestException('companyId required');
    }
    return id;
  }

  async getSettings(auth: AuthContext): Promise<GymSettingsResponse> {
    const companyId = this.companyId(auth);
    const admin = this.supabase.getAdmin();

    let { data, error } = await admin
      .from('gym_settings')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    if (!data) {
      const { data: company } = await admin
        .from('companies')
        .select('id, name, document')
        .eq('id', companyId)
        .is('deleted_at', null)
        .maybeSingle();
      if (!company) throw new NotFoundException('Company not found');

      const inserted = await admin
        .from('gym_settings')
        .insert({
          company_id: companyId,
          name: company.name,
          cnpj: company.document,
        })
        .select('*')
        .single();
      if (inserted.error) throw new BadRequestException(inserted.error.message);
      data = inserted.data;
    }

    const { data: accounts, error: accErr } = await admin
      .from('financial_accounts')
      .select('id, bank_name, pix_key, status')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('bank_name');

    if (accErr) throw new BadRequestException(accErr.message);

    return {
      settings: mapGymSettings(data),
      accounts: (accounts || []).map(mapAccountSummary),
    };
  }

  async patchSettings(
    user: AuthUser,
    auth: AuthContext,
    dto: PatchGymSettingsDto,
  ): Promise<GymSettingsResponse> {
    const companyId = this.companyId(auth);
    await this.getSettings(auth);

    const patch: Record<string, unknown> = { updated_by: user.id };
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.cnpj !== undefined) patch.cnpj = dto.cnpj;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.whatsapp !== undefined) patch.whatsapp = dto.whatsapp;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.instagram !== undefined) patch.instagram = dto.instagram;
    if (dto.zipCode !== undefined) patch.zip_code = dto.zipCode;
    if (dto.street !== undefined) patch.street = dto.street;
    if (dto.number !== undefined) patch.number = dto.number;
    if (dto.district !== undefined) patch.district = dto.district;
    if (dto.city !== undefined) patch.city = dto.city;
    if (dto.state !== undefined) patch.state = dto.state;
    if (dto.primaryColor !== undefined) patch.primary_color = dto.primaryColor;
    if (dto.secondaryColor !== undefined) patch.secondary_color = dto.secondaryColor;
    if (dto.receiptFooter !== undefined) patch.receipt_footer = dto.receiptFooter;
    if (dto.businessHours !== undefined) patch.business_hours = dto.businessHours;
    if (dto.interestRate !== undefined) patch.interest_rate = dto.interestRate;
    if (dto.fineRate !== undefined) patch.fine_rate = dto.fineRate;
    if (dto.maxDiscountPct !== undefined) patch.max_discount_pct = dto.maxDiscountPct;
    if (dto.graceDays !== undefined) patch.grace_days = dto.graceDays;

    const admin = this.supabase.getAdmin();
    const { error } = await admin
      .from('gym_settings')
      .update(patch)
      .eq('company_id', companyId)
      .is('deleted_at', null);

    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'settings',
      action: 'updated',
      entity: 'gym_settings',
      entityId: companyId,
      metadata: { fields: Object.keys(dto) },
    });

    return this.getSettings(auth);
  }

  async uploadLogo(
    user: AuthUser,
    auth: AuthContext,
    file: Express.Multer.File | undefined,
  ): Promise<GymSettingsResponse> {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (file.size > MAX_LOGO_BYTES) {
      throw new BadRequestException('Logo deve ter no máximo 2MB');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Arquivo deve ser imagem');
    }

    const companyId = this.companyId(auth);
    await this.getSettings(auth);
    const admin = this.supabase.getAdmin();
    const ext = file.mimetype.includes('png') ? 'png' : 'jpg';
    const path = `companies/${companyId}/logos/logo.${ext}`;

    const { error: upErr } = await admin.storage
      .from('logos')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
    if (upErr) throw new BadRequestException(upErr.message);

    const { data: pub } = admin.storage.from('logos').getPublicUrl(path);
    const { error } = await admin
      .from('gym_settings')
      .update({ logo_url: pub.publicUrl, updated_by: user.id })
      .eq('company_id', companyId)
      .is('deleted_at', null);
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'settings',
      action: 'upload_logo',
      entity: 'gym_settings',
      entityId: companyId,
      metadata: { path },
    });

    return this.getSettings(auth);
  }

  async dashboard(auth: AuthContext): Promise<OpsDashboard> {
    const companyId = this.companyId(auth);
    const admin = this.supabase.getAdmin();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const todayDate = start.toISOString().slice(0, 10);
    const in7 = new Date(start);
    in7.setDate(in7.getDate() + 7);
    const in7Date = in7.toISOString().slice(0, 10);
    const in14 = new Date(start);
    in14.setDate(in14.getDate() + 14);
    const in14Iso = in14.toISOString();
    const d30 = new Date(start);
    d30.setDate(d30.getDate() - 29);
    const d30Iso = d30.toISOString();
    const d30Date = d30.toISOString().slice(0, 10);
    const m6 = new Date(start);
    m6.setMonth(m6.getMonth() - 5);
    m6.setDate(1);
    const m6Date = m6.toISOString().slice(0, 10);

    const [
      checkins,
      students,
      dueSoon,
      overdue,
      cash,
      agenda,
      assessments,
      openReceivables,
      paidLast30,
      checkinsRows,
      studentsRows,
      birthdayRows,
    ] = await Promise.all([
      admin
        .from('checkins')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', startIso)
        .lte('created_at', endIso),
      admin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('created_at', startIso)
        .lte('created_at', endIso),
      admin
        .from('receivables')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .in('status', ['open', 'overdue'])
        .gte('due_date', todayDate)
        .lte('due_date', in7Date),
      admin
        .from('receivables')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .or(`status.eq.overdue,and(status.eq.open,due_date.lt.${todayDate})`),
      admin
        .from('cash_movements')
        .select('amount, direction')
        .eq('company_id', companyId)
        .eq('movement_date', todayDate),
      admin
        .from('schedules')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('start_at', startIso)
        .lte('start_at', endIso),
      admin
        .from('schedules')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .eq('type', 'assessment')
        .gte('start_at', startIso)
        .lte('start_at', in14Iso),
      admin
        .from('receivables')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .in('status', ['open', 'overdue']),
      admin
        .from('receivables')
        .select('amount, paid_at')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .not('paid_at', 'is', null)
        .gte('paid_at', d30Iso),
      admin
        .from('checkins')
        .select('created_at')
        .eq('company_id', companyId)
        .gte('created_at', d30Iso),
      admin
        .from('students')
        .select('created_at')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('created_at', d30Iso),
      admin
        .from('students')
        .select('id, full_name, birth_date')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .not('birth_date', 'is', null)
        .limit(500),
    ]);

    const cashRows = cash.data || [];
    const cashToday = cashRows.reduce((sum, row) => {
      const amount = Number(row.amount) || 0;
      if (row.direction === 'out') return sum - amount;
      return sum + amount;
    }, 0);

    const dayKeys: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(d30);
      d.setDate(d30.getDate() + i);
      dayKeys.push(d.toISOString().slice(0, 10));
    }

    const revenueMap = new Map(dayKeys.map((k) => [k, 0]));
    for (const row of paidLast30.data || []) {
      const key = String(row.paid_at).slice(0, 10);
      if (revenueMap.has(key)) {
        revenueMap.set(key, (revenueMap.get(key) || 0) + (Number(row.amount) || 0));
      }
    }

    const checkinMap = new Map(dayKeys.map((k) => [k, 0]));
    for (const row of checkinsRows.data || []) {
      const key = String(row.created_at).slice(0, 10);
      if (checkinMap.has(key)) checkinMap.set(key, (checkinMap.get(key) || 0) + 1);
    }

    const studentsMap = new Map(dayKeys.map((k) => [k, 0]));
    for (const row of studentsRows.data || []) {
      const key = String(row.created_at).slice(0, 10);
      if (studentsMap.has(key)) studentsMap.set(key, (studentsMap.get(key) || 0) + 1);
    }

    const openCount = openReceivables.count || 0;
    const overdueCount = overdue.count || 0;
    const delinquencyRate = openCount > 0 ? Number(((overdueCount / openCount) * 100).toFixed(1)) : 0;

    const monthKeys: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(m6);
      d.setMonth(m6.getMonth() + i);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const monthMap = new Map(monthKeys.map((k) => [k, 0]));
    const { data: paid6m } = await admin
      .from('receivables')
      .select('amount, paid_at')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .not('paid_at', 'is', null)
      .gte('paid_at', m6Date);
    for (const row of paid6m || []) {
      const key = String(row.paid_at).slice(0, 7);
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + (Number(row.amount) || 0));
      }
    }

    const todayMd = todayDate.slice(5);
    const birthdaysSoon = (birthdayRows.data || [])
      .map((s) => {
        const bd = String(s.birth_date).slice(5);
        const thisYear = `${start.getFullYear()}-${bd}`;
        let next = new Date(`${thisYear}T12:00:00`);
        if (next < start) next = new Date(`${start.getFullYear() + 1}-${bd}T12:00:00`);
        const daysUntil = Math.round((next.getTime() - start.getTime()) / 86400000);
        return {
          id: s.id as string,
          fullName: s.full_name as string,
          birthDate: s.birth_date as string,
          daysUntil,
        };
      })
      .filter((b) => b.daysUntil >= 0 && b.daysUntil <= 14)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 10);

    void todayMd;
    void d30Date;

    return {
      checkinsToday: checkins.count || 0,
      newStudentsToday: students.count || 0,
      receivablesDueSoon: dueSoon.count || 0,
      receivablesOverdue: overdueCount,
      cashToday,
      agendaToday: agenda.count || 0,
      upcomingAssessments: assessments.count || 0,
      birthdaysSoon,
      revenueLast30Days: dayKeys.map((date) => ({ date, value: revenueMap.get(date) || 0 })),
      checkinsByDay: dayKeys.map((date) => ({ date, value: checkinMap.get(date) || 0 })),
      newStudentsByDay: dayKeys.map((date) => ({ date, value: studentsMap.get(date) || 0 })),
      delinquencyRate,
      monthlyEvolution: monthKeys.map((date) => ({ date, value: monthMap.get(date) || 0 })),
    };
  }

  async createBackup(user: AuthUser, auth: AuthContext) {
    const companyId = this.companyId(auth);
    const admin = this.supabase.getAdmin();

    const tables = [
      'gym_settings',
      'students',
      'enrollments',
      'receivables',
      'payment_transactions',
      'workouts',
      'assessments',
      'checkins',
    ] as const;

    const payload: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      companyId,
      version: '1.0',
      data: {},
    };

    for (const table of tables) {
      let q = admin.from(table).select('*').eq('company_id', companyId);
      if (table !== 'payment_transactions' && table !== 'checkins') {
        q = q.is('deleted_at', null);
      }
      if (table === 'checkins') {
        q = q.order('created_at', { ascending: false }).limit(5000);
      } else {
        q = q.limit(10000);
      }
      const { data, error } = await q;
      if (error) throw new BadRequestException(`${table}: ${error.message}`);
      (payload.data as Record<string, unknown>)[table] = data || [];
    }

    const { data: auditRows, error: auditErr } = await admin
      .from('audit_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(2000);
    if (auditErr) throw new BadRequestException(auditErr.message);
    (payload.data as Record<string, unknown>).audit_logs = auditRows || [];

    const json = Buffer.from(JSON.stringify(payload, null, 2), 'utf8');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `companies/${companyId}/documents/backups/backup-${stamp}.json`;

    const { error: upErr } = await admin.storage
      .from('documents')
      .upload(path, json, { contentType: 'application/json', upsert: false });
    if (upErr) throw new BadRequestException(upErr.message);

    const { data: signed, error: signErr } = await admin.storage
      .from('documents')
      .createSignedUrl(path, 60 * 60);
    if (signErr) throw new BadRequestException(signErr.message);

    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'backup',
      action: 'created',
      entity: 'backup',
      entityId: path,
      metadata: { bytes: json.length },
    });

    return {
      path,
      downloadUrl: signed.signedUrl,
      bytes: json.length,
      exportedAt: payload.exportedAt,
    };
  }
}
