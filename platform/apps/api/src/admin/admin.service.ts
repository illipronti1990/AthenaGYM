import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthContext } from '@athena/shared';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { SupabaseService } from '../supabase/supabase.service';

const DEV_COMPANY = '11111111-1111-1111-1111-111111111111';

@Injectable()
export class AdminService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  companyId(auth: AuthContext): string {
    if (auth.isSuperAdmin) return auth.companyId || auth.companyIds[0] || DEV_COMPANY;
    const id = auth.companyId || auth.companyIds[0];
    if (!id) throw new BadRequestException('companyId required');
    return id;
  }

  private async log(
    auth: AuthContext,
    user: AuthUser | null,
    action: string,
    entity: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.audit.log({
      companyId: this.companyId(auth),
      userId: user?.id || auth.userId || null,
      module: 'admin',
      action,
      entity,
      entityId: entityId || null,
      metadata,
    });
  }

  // ---- mappers ----
  private mapEmployee(r: Record<string, unknown>) {
    return {
      id: String(r.id),
      companyId: String(r.company_id),
      unitId: r.unit_id ? String(r.unit_id) : null,
      profileId: r.profile_id ? String(r.profile_id) : null,
      departmentId: r.department_id ? String(r.department_id) : null,
      jobTitleId: r.job_title_id ? String(r.job_title_id) : null,
      fullName: String(r.full_name),
      email: r.email ? String(r.email) : null,
      phone: r.phone ? String(r.phone) : null,
      documentCpf: r.document_cpf ? String(r.document_cpf) : null,
      photoUrl: r.photo_url ? String(r.photo_url) : null,
      hiredAt: r.hired_at ? String(r.hired_at) : null,
      status: String(r.status),
      emergencyContacts: (r.emergency_contacts as unknown[]) || [],
      documents: (r.documents as unknown[]) || [],
      notes: r.notes ? String(r.notes) : null,
      hourBankBalance: Number(r.hour_bank_balance || 0),
      vacationStart: r.vacation_start ? String(r.vacation_start) : null,
      vacationEnd: r.vacation_end ? String(r.vacation_end) : null,
      createdAt: String(r.created_at),
    };
  }

  // ---- departments / titles / settings ----
  async listDepartments(auth: AuthContext) {
    const { data, error } = await this.admin()
      .from('departments')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .is('deleted_at', null)
      .order('name');
    if (error) throw new BadRequestException(error.message);
    return (data || []).map((r) => ({
      id: r.id,
      companyId: r.company_id,
      name: r.name,
      active: r.active,
    }));
  }

  async upsertDepartment(auth: AuthContext, user: AuthUser, body: { id?: string; name: string; active?: boolean }) {
    const companyId = this.companyId(auth);
    const row = {
      id: body.id,
      company_id: companyId,
      name: body.name.trim(),
      active: body.active !== false,
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    if (!body.id) delete (row as { id?: string }).id;
    const { data, error } = await this.admin().from('departments').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, body.id ? 'update' : 'create', 'department', data.id);
    return { id: data.id, companyId, name: data.name, active: data.active };
  }

  async listJobTitles(auth: AuthContext) {
    const { data, error } = await this.admin()
      .from('hr_job_titles')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .is('deleted_at', null)
      .order('name');
    if (error) throw new BadRequestException(error.message);
    return (data || []).map((r) => ({
      id: r.id,
      companyId: r.company_id,
      name: r.name,
      departmentId: r.department_id,
      active: r.active,
    }));
  }

  async upsertJobTitle(
    auth: AuthContext,
    user: AuthUser,
    body: { id?: string; name: string; departmentId?: string; active?: boolean },
  ) {
    const companyId = this.companyId(auth);
    const row: Record<string, unknown> = {
      company_id: companyId,
      name: body.name.trim(),
      department_id: body.departmentId || null,
      active: body.active !== false,
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    if (body.id) row.id = body.id;
    const { data, error } = await this.admin().from('hr_job_titles').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, body.id ? 'update' : 'create', 'hr_job_title', data.id);
    return {
      id: data.id,
      companyId,
      name: data.name,
      departmentId: data.department_id,
      active: data.active,
    };
  }

  async getSettings(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const { data } = await this.admin()
      .from('administrative_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();
    return { companyId, settings: (data?.settings as Record<string, unknown>) || {} };
  }

  async saveSettings(auth: AuthContext, user: AuthUser, settings: Record<string, unknown>) {
    const companyId = this.companyId(auth);
    const { data, error } = await this.admin()
      .from('administrative_settings')
      .upsert({ company_id: companyId, settings, updated_at: new Date().toISOString() })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, 'update', 'administrative_settings', data.id);
    return { companyId, settings: data.settings };
  }

  // ---- employees ----
  async listEmployees(auth: AuthContext, status?: string) {
    let q = this.admin()
      .from('employees')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .is('deleted_at', null)
      .order('full_name');
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return (data || []).map((r) => this.mapEmployee(r as Record<string, unknown>));
  }

  async getEmployee(auth: AuthContext, id: string) {
    const { data, error } = await this.admin()
      .from('employees')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Employee not found');
    return this.mapEmployee(data as Record<string, unknown>);
  }

  async createEmployee(auth: AuthContext, user: AuthUser, body: Record<string, unknown>) {
    const companyId = this.companyId(auth);
    const { data, error } = await this.admin()
      .from('employees')
      .insert({
        company_id: companyId,
        unit_id: body.unitId || null,
        profile_id: body.profileId || null,
        department_id: body.departmentId || null,
        job_title_id: body.jobTitleId || null,
        full_name: String(body.fullName || '').trim(),
        email: body.email || null,
        phone: body.phone || null,
        document_cpf: body.documentCpf || null,
        photo_url: body.photoUrl || null,
        hired_at: body.hiredAt || null,
        status: body.status || 'active',
        emergency_contacts: body.emergencyContacts || [],
        documents: body.documents || [],
        notes: body.notes || null,
        hour_bank_balance: body.hourBankBalance ?? 0,
        vacation_start: body.vacationStart || null,
        vacation_end: body.vacationEnd || null,
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, 'create', 'employee', data.id);
    return this.mapEmployee(data as Record<string, unknown>);
  }

  async updateEmployee(auth: AuthContext, user: AuthUser, id: string, body: Record<string, unknown>) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = {
      unitId: 'unit_id',
      profileId: 'profile_id',
      departmentId: 'department_id',
      jobTitleId: 'job_title_id',
      fullName: 'full_name',
      email: 'email',
      phone: 'phone',
      documentCpf: 'document_cpf',
      photoUrl: 'photo_url',
      hiredAt: 'hired_at',
      status: 'status',
      emergencyContacts: 'emergency_contacts',
      documents: 'documents',
      notes: 'notes',
      hourBankBalance: 'hour_bank_balance',
      vacationStart: 'vacation_start',
      vacationEnd: 'vacation_end',
    };
    for (const [k, col] of Object.entries(map)) {
      if (body[k] !== undefined) patch[col] = body[k];
    }
    const { data, error } = await this.admin()
      .from('employees')
      .update(patch)
      .eq('id', id)
      .eq('company_id', this.companyId(auth))
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, 'update', 'employee', id);
    return this.mapEmployee(data as Record<string, unknown>);
  }

  async deleteEmployee(auth: AuthContext, user: AuthUser, id: string) {
    const { error } = await this.admin()
      .from('employees')
      .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
      .eq('id', id)
      .eq('company_id', this.companyId(auth));
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, 'delete', 'employee', id);
    return { ok: true };
  }

  // ---- schedules ----
  async listSchedules(auth: AuthContext, from?: string, to?: string, employeeId?: string) {
    let q = this.admin()
      .from('work_schedules')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .order('schedule_date');
    if (from) q = q.gte('schedule_date', from);
    if (to) q = q.lte('schedule_date', to);
    if (employeeId) q = q.eq('employee_id', employeeId);
    const { data, error } = await q.limit(500);
    if (error) throw new BadRequestException(error.message);
    return (data || []).map((r) => ({
      id: r.id,
      companyId: r.company_id,
      employeeId: r.employee_id,
      scheduleDate: r.schedule_date,
      shiftStart: r.shift_start,
      shiftEnd: r.shift_end,
      kind: r.kind,
      notes: r.notes,
    }));
  }

  async upsertSchedule(auth: AuthContext, user: AuthUser, body: Record<string, unknown>) {
    const companyId = this.companyId(auth);
    const row: Record<string, unknown> = {
      company_id: companyId,
      employee_id: body.employeeId,
      schedule_date: body.scheduleDate,
      shift_start: body.shiftStart || null,
      shift_end: body.shiftEnd || null,
      kind: body.kind || 'work',
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };
    if (body.id) row.id = body.id;
    const { data, error } = await this.admin().from('work_schedules').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, body.id ? 'update' : 'create', 'work_schedule', data.id);
    return data;
  }

  // ---- assets ----
  async listAssetCategories(auth: AuthContext) {
    const { data, error } = await this.admin()
      .from('asset_categories')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .is('deleted_at', null)
      .order('name');
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async upsertAssetCategory(auth: AuthContext, user: AuthUser, body: { id?: string; name: string }) {
    const row: Record<string, unknown> = {
      company_id: this.companyId(auth),
      name: body.name.trim(),
      active: true,
      deleted_at: null,
    };
    if (body.id) row.id = body.id;
    const { data, error } = await this.admin().from('asset_categories').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, body.id ? 'update' : 'create', 'asset_category', data.id);
    return data;
  }

  async listAssets(auth: AuthContext) {
    const { data, error } = await this.admin()
      .from('assets')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .is('deleted_at', null)
      .order('name');
    if (error) throw new BadRequestException(error.message);
    return (data || []).map((r) => ({
      id: r.id,
      companyId: r.company_id,
      unitId: r.unit_id,
      categoryId: r.category_id,
      code: r.code,
      name: r.name,
      location: r.location,
      purchaseValue: Number(r.purchase_value || 0),
      purchasedAt: r.purchased_at,
      warrantyUntil: r.warranty_until,
      usefulLifeMonths: r.useful_life_months,
      status: r.status,
      notes: r.notes,
    }));
  }

  async upsertAsset(auth: AuthContext, user: AuthUser, body: Record<string, unknown>) {
    const row: Record<string, unknown> = {
      company_id: this.companyId(auth),
      unit_id: body.unitId || null,
      category_id: body.categoryId || null,
      code: String(body.code || '').trim(),
      name: String(body.name || '').trim(),
      location: body.location || null,
      purchase_value: body.purchaseValue ?? 0,
      purchased_at: body.purchasedAt || null,
      warranty_until: body.warrantyUntil || null,
      useful_life_months: body.usefulLifeMonths ?? null,
      status: body.status || 'active',
      notes: body.notes || null,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };
    if (body.id) row.id = body.id;
    const { data, error } = await this.admin().from('assets').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, body.id ? 'update' : 'create', 'asset', data.id, { code: data.code });
    return data;
  }

  async deleteAsset(auth: AuthContext, user: AuthUser, id: string) {
    const { error } = await this.admin()
      .from('assets')
      .update({ deleted_at: new Date().toISOString(), status: 'retired' })
      .eq('id', id)
      .eq('company_id', this.companyId(auth));
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, 'delete', 'asset', id);
    return { ok: true };
  }

  // ---- maintenance ----
  async listMaintenance(auth: AuthContext, status?: string) {
    let q = this.admin()
      .from('maintenance_orders')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q.limit(200);
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async upsertMaintenance(auth: AuthContext, user: AuthUser, body: Record<string, unknown>) {
    const companyId = this.companyId(auth);
    const isNew = !body.id;
    const row: Record<string, unknown> = {
      company_id: companyId,
      asset_id: body.assetId || null,
      assignee_employee_id: body.assigneeEmployeeId || null,
      title: String(body.title || '').trim(),
      kind: body.kind || 'corrective',
      priority: body.priority || 'medium',
      status: body.status || 'open',
      cost: body.cost ?? 0,
      due_at: body.dueAt || null,
      completed_at: body.status === 'done' ? new Date().toISOString() : body.completedAt || null,
      photo_urls: body.photoUrls || [],
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };
    if (body.id) row.id = body.id;
    else row.created_by = user.id;

    const { data, error } = await this.admin().from('maintenance_orders').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);

    await this.admin().from('maintenance_history').insert({
      order_id: data.id,
      company_id: companyId,
      from_status: isNew ? null : body.fromStatus || null,
      to_status: data.status,
      note: body.historyNote || null,
      created_by: user.id,
    });

    if (data.asset_id && (data.status === 'open' || data.status === 'in_progress')) {
      await this.admin().from('assets').update({ status: 'maintenance' }).eq('id', data.asset_id);
    }
    if (data.asset_id && data.status === 'done') {
      await this.admin().from('assets').update({ status: 'active' }).eq('id', data.asset_id);
    }

    await this.log(auth, user, isNew ? 'create' : 'update', 'maintenance_order', data.id);
    return data;
  }

  // ---- documents ----
  async listDocumentCategories(auth: AuthContext) {
    const { data, error } = await this.admin()
      .from('document_categories')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .is('deleted_at', null)
      .order('name');
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async listDocuments(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const { data, error } = await this.admin()
      .from('company_documents')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('expires_at', { ascending: true, nullsFirst: false });
    if (error) throw new BadRequestException(error.message);

    // soft alert: docs expiring in 30 days
    const soon = (data || []).filter((d) => {
      if (!d.expires_at) return false;
      const days = (new Date(d.expires_at).getTime() - Date.now()) / 86400000;
      return days >= 0 && days <= 30;
    });
    if (soon.length && auth.userId) {
      void (async () => {
        try {
          await this.admin().from('notifications').insert({
            company_id: companyId,
            user_id: auth.userId,
            title: `${soon.length} documento(s) vencendo`,
            body: soon.map((d) => d.title).slice(0, 3).join(', '),
            type: 'admin.document',
            channel: 'internal',
            status: 'pending',
          });
        } catch {
          /* ignore alert failures */
        }
      })();
    }

    return data || [];
  }

  async upsertDocument(auth: AuthContext, user: AuthUser, body: Record<string, unknown>) {
    const row: Record<string, unknown> = {
      company_id: this.companyId(auth),
      category_id: body.categoryId || null,
      title: String(body.title || '').trim(),
      file_url: body.fileUrl || null,
      expires_at: body.expiresAt || null,
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    if (body.id) row.id = body.id;
    else row.created_by = user.id;
    const { data, error } = await this.admin().from('company_documents').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, body.id ? 'update' : 'create', 'company_document', data.id);
    return data;
  }

  async deleteDocument(auth: AuthContext, user: AuthUser, id: string) {
    const { error } = await this.admin()
      .from('company_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', this.companyId(auth));
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, 'delete', 'company_document', id);
    return { ok: true };
  }

  // ---- incidents / announcements ----
  async listIncidents(auth: AuthContext) {
    const { data, error } = await this.admin()
      .from('internal_incidents')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async upsertIncident(auth: AuthContext, user: AuthUser, body: Record<string, unknown>) {
    const row: Record<string, unknown> = {
      company_id: this.companyId(auth),
      unit_id: body.unitId || null,
      reporter_employee_id: body.reporterEmployeeId || null,
      type: body.type || 'operational',
      title: String(body.title || '').trim(),
      description: body.description || null,
      status: body.status || 'open',
      attachment_urls: body.attachmentUrls || [],
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    if (body.id) row.id = body.id;
    else row.created_by = user.id;
    const { data, error } = await this.admin().from('internal_incidents').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, body.id ? 'update' : 'create', 'internal_incident', data.id);
    return data;
  }

  async listAnnouncements(auth: AuthContext) {
    const { data, error } = await this.admin()
      .from('internal_announcements')
      .select('*')
      .eq('company_id', this.companyId(auth))
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(100);
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async upsertAnnouncement(auth: AuthContext, user: AuthUser, body: Record<string, unknown>) {
    const row: Record<string, unknown> = {
      company_id: this.companyId(auth),
      title: String(body.title || '').trim(),
      body: String(body.body || ''),
      audience: body.audience || 'all',
      published_at: body.publishedAt || new Date().toISOString(),
      expires_at: body.expiresAt || null,
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    if (body.id) row.id = body.id;
    else row.created_by = user.id;
    const { data, error } = await this.admin().from('internal_announcements').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    await this.log(auth, user, body.id ? 'update' : 'create', 'internal_announcement', data.id);
    return data;
  }

  // ---- dashboard / calendar ----
  async dashboard(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);

    const [emps, assets, maint, docs, incidents] = await Promise.all([
      this.admin().from('employees').select('id,status,hired_at,vacation_start,full_name').eq('company_id', companyId).is('deleted_at', null),
      this.admin().from('assets').select('id,status').eq('company_id', companyId).is('deleted_at', null),
      this.admin().from('maintenance_orders').select('id,status,cost,created_at').eq('company_id', companyId).is('deleted_at', null),
      this.admin().from('company_documents').select('id,expires_at').eq('company_id', companyId).is('deleted_at', null),
      this.admin().from('internal_incidents').select('id,created_at').eq('company_id', companyId).is('deleted_at', null).gte('created_at', monthStart),
    ]);

    const employees = emps.data || [];
    const maintenance = maint.data || [];
    return {
      employeesActive: employees.filter((e) => e.status === 'active').length,
      employeesVacationSoon: employees.filter((e) => e.vacation_start && e.vacation_start <= in30 && e.vacation_start >= today).length,
      birthdaysThisMonth: 0,
      recentHires: employees.filter((e) => e.hired_at && e.hired_at >= monthStart.slice(0, 10)).length,
      assetsInMaintenance: (assets.data || []).filter((a) => a.status === 'maintenance').length,
      openMaintenanceOrders: maintenance.filter((m) => m.status === 'open' || m.status === 'in_progress').length,
      documentsExpiringSoon: (docs.data || []).filter((d) => d.expires_at && d.expires_at <= in30 && d.expires_at >= today).length,
      maintenanceCostMonth: maintenance
        .filter((m) => m.created_at && m.created_at >= monthStart)
        .reduce((s, m) => s + Number(m.cost || 0), 0),
      incidentsThisMonth: (incidents.data || []).length,
    };
  }

  async calendar(auth: AuthContext, from?: string, to?: string) {
    const companyId = this.companyId(auth);
    const start = from || new Date().toISOString().slice(0, 10);
    const end = to || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    const events: Array<{ id: string; type: string; title: string; date: string; href?: string }> = [];

    const [emps, maint, docs, anns, schedules] = await Promise.all([
      this.admin().from('employees').select('id,full_name,vacation_start,vacation_end').eq('company_id', companyId).is('deleted_at', null),
      this.admin().from('maintenance_orders').select('id,title,due_at').eq('company_id', companyId).is('deleted_at', null),
      this.admin().from('company_documents').select('id,title,expires_at').eq('company_id', companyId).is('deleted_at', null),
      this.admin().from('internal_announcements').select('id,title,published_at').eq('company_id', companyId).is('deleted_at', null),
      this.admin().from('work_schedules').select('id,schedule_date,kind,employee_id').eq('company_id', companyId).gte('schedule_date', start).lte('schedule_date', end),
    ]);

    for (const e of emps.data || []) {
      if (e.vacation_start && e.vacation_start >= start && e.vacation_start <= end) {
        events.push({
          id: `vac-${e.id}`,
          type: 'vacation',
          title: `Férias: ${e.full_name}`,
          date: e.vacation_start,
          href: '/app/admin/colaboradores',
        });
      }
    }
    for (const m of maint.data || []) {
      if (m.due_at && m.due_at >= start && m.due_at <= end) {
        events.push({ id: m.id, type: 'maintenance', title: m.title, date: m.due_at, href: '/app/admin/manutencoes' });
      }
    }
    for (const d of docs.data || []) {
      if (d.expires_at && d.expires_at >= start && d.expires_at <= end) {
        events.push({ id: d.id, type: 'document', title: `Vence: ${d.title}`, date: d.expires_at, href: '/app/admin/documentos' });
      }
    }
    for (const a of anns.data || []) {
      const d = String(a.published_at || '').slice(0, 10);
      if (d >= start && d <= end) {
        events.push({ id: a.id, type: 'announcement', title: a.title, date: d, href: '/app/admin/comunicados' });
      }
    }
    for (const s of schedules.data || []) {
      events.push({
        id: s.id,
        type: 'schedule',
        title: `Escala (${s.kind})`,
        date: s.schedule_date,
        href: '/app/admin/escalas',
      });
    }

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ---- reports ----
  async reportCsv(auth: AuthContext, kind: string): Promise<{ filename: string; csv: string }> {
    const companyId = this.companyId(auth);
    if (kind === 'employees') {
      const rows = await this.listEmployees(auth);
      const csv = ['nome,email,status,admissao', ...rows.map((r) => `"${r.fullName}","${r.email || ''}",${r.status},${r.hiredAt || ''}`)].join('\n');
      return { filename: 'colaboradores.csv', csv };
    }
    if (kind === 'assets') {
      const rows = await this.listAssets(auth);
      const csv = ['codigo,nome,status,valor', ...rows.map((r) => `${r.code},"${r.name}",${r.status},${r.purchaseValue}`)].join('\n');
      return { filename: 'patrimonio.csv', csv };
    }
    if (kind === 'maintenance') {
      const rows = await this.listMaintenance(auth);
      const csv = ['titulo,status,prioridade,custo', ...rows.map((r) => `"${r.title}",${r.status},${r.priority},${r.cost}`)].join('\n');
      return { filename: 'manutencao.csv', csv };
    }
    if (kind === 'documents') {
      const rows = await this.listDocuments(auth);
      const csv = ['titulo,vence', ...rows.map((r) => `"${r.title}",${r.expires_at || ''}`)].join('\n');
      return { filename: 'documentos.csv', csv };
    }
    if (kind === 'incidents') {
      const rows = await this.listIncidents(auth);
      const csv = ['titulo,tipo,status', ...rows.map((r) => `"${r.title}",${r.type},${r.status}`)].join('\n');
      return { filename: 'ocorrencias.csv', csv };
    }
    if (kind === 'costs') {
      const { data } = await this.admin()
        .from('cost_centers')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null);
      const csv = ['nome,categoria,ativo', ...(data || []).map((r) => `"${r.name}",${r.category || ''},${r.active}`)].join('\n');
      return { filename: 'centros-custo.csv', csv };
    }
    throw new BadRequestException('Unknown report kind');
  }
}
