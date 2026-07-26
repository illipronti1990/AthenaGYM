import { Injectable } from '@nestjs/common';
import type {
  Contract,
  Enrollment,
  Lead,
  LeadActivity,
  Plan,
  PipelineStage,
} from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SalesRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  mapLead(row: Record<string, unknown>): Lead {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      fullName: String(row.full_name),
      phone: (row.phone as string) || null,
      whatsapp: (row.whatsapp as string) || null,
      email: (row.email as string) || null,
      sourceId: row.source_id ? String(row.source_id) : null,
      stageId: row.stage_id ? String(row.stage_id) : null,
      status: String(row.status || 'open'),
      assignedTo: row.assigned_to ? String(row.assigned_to) : null,
      interest: (row.interest as string) || null,
      notes: (row.notes as string) || null,
      studentId: row.student_id ? String(row.student_id) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  mapStage(row: Record<string, unknown>): PipelineStage {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      slug: String(row.slug),
      position: Number(row.position),
      isWon: Boolean(row.is_won),
      isLost: Boolean(row.is_lost),
    };
  }

  mapPlan(row: Record<string, unknown>): Plan {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      category: (row.category as string) || null,
      durationDays: Number(row.duration_days),
      price: Number(row.price),
      enrollmentFee: Number(row.enrollment_fee),
      active: Boolean(row.active),
    };
  }

  mapEnrollment(row: Record<string, unknown>): Enrollment {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      studentId: String(row.student_id),
      planId: String(row.plan_id),
      leadId: row.lead_id ? String(row.lead_id) : null,
      contractId: row.contract_id ? String(row.contract_id) : null,
      salespersonId: row.salesperson_id ? String(row.salesperson_id) : null,
      startDate: String(row.start_date),
      endDate: row.end_date ? String(row.end_date) : null,
      status: String(row.status),
    };
  }

  mapContract(row: Record<string, unknown>): Contract {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      studentId: row.student_id ? String(row.student_id) : null,
      planId: String(row.plan_id),
      enrollmentId: row.enrollment_id ? String(row.enrollment_id) : null,
      leadId: row.lead_id ? String(row.lead_id) : null,
      contractNumber: String(row.contract_number),
      signedAt: row.signed_at ? String(row.signed_at) : null,
      pdfUrl: (row.pdf_url as string) || null,
      status: String(row.status),
      createdAt: String(row.created_at),
    };
  }

  mapActivity(row: Record<string, unknown>): LeadActivity {
    return {
      id: String(row.id),
      leadId: String(row.lead_id),
      type: String(row.type),
      description: (row.description as string) || null,
      scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
      completedAt: row.completed_at ? String(row.completed_at) : null,
      createdBy: row.created_by ? String(row.created_by) : null,
      createdAt: String(row.created_at),
    };
  }

  async listLeads(companyIds: string[]) {
    const { data, error } = await this.admin()
      .from('leads')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapLead(r as Record<string, unknown>));
  }

  async getLead(id: string) {
    const { data } = await this.admin()
      .from('leads')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    return data ? this.mapLead(data as Record<string, unknown>) : null;
  }

  async insertLead(payload: Record<string, unknown>) {
    const { data, error } = await this.admin().from('leads').insert(payload).select('*').single();
    if (error) throw error;
    return this.mapLead(data as Record<string, unknown>);
  }

  async updateLead(id: string, payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('leads')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapLead(data as Record<string, unknown>);
  }

  async softDeleteLead(id: string) {
    return this.updateLead(id, { deleted_at: new Date().toISOString(), status: 'archived' });
  }

  async listStages(companyId: string) {
    const { data, error } = await this.admin()
      .from('pipeline_stages')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('position');
    if (error) throw error;
    return (data || []).map((r) => this.mapStage(r as Record<string, unknown>));
  }

  async getStage(id: string) {
    const { data } = await this.admin()
      .from('pipeline_stages')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    return data ? this.mapStage(data as Record<string, unknown>) : null;
  }

  async listSources() {
    const { data } = await this.admin()
      .from('lead_sources')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    return data || [];
  }

  async insertActivity(payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('lead_activities')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapActivity(data as Record<string, unknown>);
  }

  async listActivities(leadId: string) {
    const { data } = await this.admin()
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    return (data || []).map((r) => this.mapActivity(r as Record<string, unknown>));
  }

  async listPlans(companyIds: string[]) {
    const { data, error } = await this.admin()
      .from('plans')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapPlan(r as Record<string, unknown>));
  }

  async getPlan(id: string) {
    const { data } = await this.admin()
      .from('plans')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    return data ? this.mapPlan(data as Record<string, unknown>) : null;
  }

  async insertPlan(payload: Record<string, unknown>) {
    const { data, error } = await this.admin().from('plans').insert(payload).select('*').single();
    if (error) throw error;
    return this.mapPlan(data as Record<string, unknown>);
  }

  async updatePlan(id: string, payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('plans')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapPlan(data as Record<string, unknown>);
  }

  async softDeletePlan(id: string) {
    return this.updatePlan(id, {
      deleted_at: new Date().toISOString(),
      active: false,
    });
  }

  async listEnrollments(companyIds: string[]) {
    const { data, error } = await this.admin()
      .from('enrollments')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapEnrollment(r as Record<string, unknown>));
  }

  async insertEnrollment(payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('enrollments')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapEnrollment(data as Record<string, unknown>);
  }

  async updateEnrollment(id: string, payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('enrollments')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapEnrollment(data as Record<string, unknown>);
  }

  async listContracts(companyIds: string[]) {
    const { data, error } = await this.admin()
      .from('contracts')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapContract(r as Record<string, unknown>));
  }

  async getContract(id: string) {
    const { data } = await this.admin()
      .from('contracts')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    return data ? this.mapContract(data as Record<string, unknown>) : null;
  }

  async insertContract(payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('contracts')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapContract(data as Record<string, unknown>);
  }

  async updateContract(id: string, payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('contracts')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapContract(data as Record<string, unknown>);
  }

  async countLeadsSince(companyIds: string[], sinceIso: string) {
    const { count } = await this.admin()
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .gte('created_at', sinceIso);
    return count || 0;
  }

  async countLeads(companyIds: string[]) {
    const { count } = await this.admin()
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .in('company_id', companyIds)
      .is('deleted_at', null);
    return count || 0;
  }

  async countWonLeads(companyIds: string[]) {
    const stages = await this.admin()
      .from('pipeline_stages')
      .select('id')
      .in('company_id', companyIds)
      .eq('is_won', true)
      .is('deleted_at', null);
    const ids = (stages.data || []).map((s) => s.id as string);
    if (!ids.length) return 0;
    const { count } = await this.admin()
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .in('company_id', companyIds)
      .in('stage_id', ids)
      .is('deleted_at', null);
    return count || 0;
  }

  async countScheduledVisits(companyIds: string[]) {
    const { data: leads } = await this.admin()
      .from('leads')
      .select('id')
      .in('company_id', companyIds)
      .is('deleted_at', null);
    const leadIds = (leads || []).map((l) => l.id as string);
    if (!leadIds.length) return 0;
    const { count } = await this.admin()
      .from('lead_activities')
      .select('id', { count: 'exact', head: true })
      .in('lead_id', leadIds)
      .eq('type', 'visit')
      .is('deleted_at', null)
      .is('completed_at', null)
      .not('scheduled_at', 'is', null);
    return count || 0;
  }

  async countEnrollments(companyIds: string[]) {
    const { count } = await this.admin()
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .eq('status', 'active');
    return count || 0;
  }

  async countContracts(companyIds: string[]) {
    const { count } = await this.admin()
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .in('company_id', companyIds)
      .is('deleted_at', null);
    return (count || 0) + 1;
  }

  async insertStudent(payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('students')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }
}
