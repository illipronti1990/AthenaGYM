import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthContext, PipelineColumn, SalesDashboard } from '@athena/shared';
import { calcConversionRate } from '@athena/shared';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateActivityDto,
  CreateContractDto,
  CreateEnrollmentDto,
  CreateLeadDto,
  CreatePlanDto,
  MoveLeadStageDto,
  UpdateLeadDto,
  UpdatePlanDto,
} from './dto/sales.dto';
import { CONTRACT_SIGNED } from './events/sales.events';
import { assertCanSignContract, leadStatusFromStage } from './sales.rules';
import { SalesRepository } from './sales.repository';
import type { SalesOutboundPort } from './events/sales.events';

const DEV_COMPANY = '11111111-1111-1111-1111-111111111111';
const DEV_UNIT = '22222222-2222-2222-2222-222222222222';
const DEFAULT_STAGE = 'cccccccc-cccc-cccc-cccc-cccccccccc01';

@Injectable()
export class SalesService implements SalesOutboundPort {
  constructor(
    private readonly repo: SalesRepository,
    private readonly events: EventEmitter2,
    private readonly audit: AuditService,
    private readonly supabase: SupabaseService,
  ) {}

  private companyIds(auth: AuthContext, companyId?: string | null): string[] {
    if (auth.isSuperAdmin) {
      return companyId ? [companyId] : auth.companyIds.length ? auth.companyIds : [DEV_COMPANY];
    }
    if (!auth.companyIds.length) throw new ForbiddenException('No company access');
    if (companyId && !auth.companyIds.includes(companyId)) {
      throw new ForbiddenException('Company not allowed');
    }
    return companyId ? [companyId] : auth.companyIds;
  }

  private primaryCompany(auth: AuthContext, companyId?: string | null): string {
    return this.companyIds(auth, companyId)[0];
  }

  async listLeads(auth: AuthContext) {
    return this.repo.listLeads(this.companyIds(auth));
  }

  async getLead(auth: AuthContext, id: string) {
    const lead = await this.repo.getLead(id);
    if (!lead) throw new NotFoundException('Lead not found');
    this.companyIds(auth, lead.companyId);
    return lead;
  }

  async createLead(user: AuthUser, auth: AuthContext, dto: CreateLeadDto) {
    const companyId = this.primaryCompany(auth, dto.companyId || auth.companyId);
    const stageId = dto.stageId || DEFAULT_STAGE;
    const lead = await this.repo.insertLead({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId || DEV_UNIT,
      full_name: dto.fullName,
      phone: dto.phone || null,
      whatsapp: dto.whatsapp || null,
      email: dto.email || null,
      source_id: dto.sourceId || null,
      stage_id: stageId,
      assigned_to: dto.assignedTo || user.id,
      interest: dto.interest || null,
      notes: dto.notes || null,
      status: 'open',
      created_by: user.id,
    });
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'sales',
      action: 'create_lead',
      entity: 'lead',
      entityId: lead.id,
    });
    return lead;
  }

  async updateLead(user: AuthUser, auth: AuthContext, id: string, dto: UpdateLeadDto) {
    const existing = await this.getLead(auth, id);
    const lead = await this.repo.updateLead(id, {
      full_name: dto.fullName ?? existing.fullName,
      phone: dto.phone !== undefined ? dto.phone : existing.phone,
      whatsapp: dto.whatsapp !== undefined ? dto.whatsapp : existing.whatsapp,
      email: dto.email !== undefined ? dto.email : existing.email,
      source_id: dto.sourceId !== undefined ? dto.sourceId : existing.sourceId,
      assigned_to: dto.assignedTo !== undefined ? dto.assignedTo : existing.assignedTo,
      interest: dto.interest !== undefined ? dto.interest : existing.interest,
      notes: dto.notes !== undefined ? dto.notes : existing.notes,
      unit_id: dto.unitId !== undefined ? dto.unitId : existing.unitId,
      updated_by: user.id,
    });
    await this.audit.log({
      companyId: existing.companyId,
      userId: user.id,
      module: 'sales',
      action: 'update_lead',
      entity: 'lead',
      entityId: id,
    });
    return lead;
  }

  async deleteLead(user: AuthUser, auth: AuthContext, id: string) {
    const existing = await this.getLead(auth, id);
    await this.repo.softDeleteLead(id);
    await this.audit.log({
      companyId: existing.companyId,
      userId: user.id,
      module: 'sales',
      action: 'delete_lead',
      entity: 'lead',
      entityId: id,
    });
    return { ok: true };
  }

  async moveLeadStage(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: MoveLeadStageDto,
  ) {
    const existing = await this.getLead(auth, id);
    const stage = await this.repo.getStage(dto.stageId);
    if (!stage || stage.companyId !== existing.companyId) {
      throw new BadRequestException('Invalid stage');
    }
    const lead = await this.repo.updateLead(id, {
      stage_id: dto.stageId,
      status: leadStatusFromStage(stage),
      updated_by: user.id,
    });
    await this.audit.log({
      companyId: existing.companyId,
      userId: user.id,
      module: 'sales',
      action: 'move_stage',
      entity: 'lead',
      entityId: id,
      metadata: { stageId: dto.stageId },
    });
    return lead;
  }

  async addActivity(
    user: AuthUser,
    auth: AuthContext,
    leadId: string,
    dto: CreateActivityDto,
  ) {
    await this.getLead(auth, leadId);
    return this.repo.insertActivity({
      lead_id: leadId,
      type: dto.type,
      description: dto.description || null,
      scheduled_at: dto.scheduledAt || null,
      created_by: user.id,
    });
  }

  async listActivities(auth: AuthContext, leadId: string) {
    await this.getLead(auth, leadId);
    return this.repo.listActivities(leadId);
  }

  async getPipeline(auth: AuthContext): Promise<PipelineColumn[]> {
    const companyId = this.primaryCompany(auth);
    const [stages, leads] = await Promise.all([
      this.repo.listStages(companyId),
      this.repo.listLeads([companyId]),
    ]);
    return stages.map((stage) => ({
      stage,
      leads: leads.filter((l) => l.stageId === stage.id),
    }));
  }

  async listSources() {
    const rows = await this.repo.listSources();
    return rows.map((r) => ({
      id: String(r.id),
      companyId: r.company_id ? String(r.company_id) : null,
      name: String(r.name),
      slug: String(r.slug),
    }));
  }

  async listPlans(auth: AuthContext) {
    return this.repo.listPlans(this.companyIds(auth));
  }

  async createPlan(user: AuthUser, auth: AuthContext, dto: CreatePlanDto) {
    const companyId = this.primaryCompany(auth, dto.companyId || auth.companyId);
    const plan = await this.repo.insertPlan({
      company_id: companyId,
      name: dto.name,
      category: dto.category || 'standard',
      duration_days: dto.durationDays,
      price: dto.price,
      enrollment_fee: dto.enrollmentFee ?? 0,
      active: true,
    });
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'sales',
      action: 'create_plan',
      entity: 'plan',
      entityId: plan.id,
    });
    return plan;
  }

  async updatePlan(user: AuthUser, auth: AuthContext, id: string, dto: UpdatePlanDto) {
    const plan = await this.repo.getPlan(id);
    if (!plan) throw new NotFoundException('Plan not found');
    this.companyIds(auth, plan.companyId);
    const updated = await this.repo.updatePlan(id, {
      name: dto.name ?? plan.name,
      price: dto.price ?? plan.price,
      enrollment_fee: dto.enrollmentFee ?? plan.enrollmentFee,
      duration_days: dto.durationDays ?? plan.durationDays,
      active: dto.active ?? plan.active,
    });
    await this.audit.log({
      companyId: plan.companyId,
      userId: user.id,
      module: 'sales',
      action: 'update_plan',
      entity: 'plan',
      entityId: id,
    });
    return updated;
  }

  async listEnrollments(auth: AuthContext) {
    return this.repo.listEnrollments(this.companyIds(auth));
  }

  async createEnrollment(user: AuthUser, auth: AuthContext, dto: CreateEnrollmentDto) {
    const plan = await this.repo.getPlan(dto.planId);
    if (!plan) throw new BadRequestException('Invalid plan');
    const companyId = this.primaryCompany(auth, dto.companyId || plan.companyId);
    const start = dto.startDate || new Date().toISOString().slice(0, 10);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + plan.durationDays);
    const enrollment = await this.repo.insertEnrollment({
      company_id: companyId,
      student_id: dto.studentId,
      plan_id: dto.planId,
      lead_id: dto.leadId || null,
      salesperson_id: user.id,
      start_date: start,
      end_date: endDate.toISOString().slice(0, 10),
      status: 'active',
    });
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'sales',
      action: 'create_enrollment',
      entity: 'enrollment',
      entityId: enrollment.id,
    });
    return enrollment;
  }

  async listContracts(auth: AuthContext) {
    return this.repo.listContracts(this.companyIds(auth));
  }

  async getContract(auth: AuthContext, id: string) {
    const c = await this.repo.getContract(id);
    if (!c) throw new NotFoundException('Contract not found');
    this.companyIds(auth, c.companyId);
    return c;
  }

  async createContract(user: AuthUser, auth: AuthContext, dto: CreateContractDto) {
    const plan = await this.repo.getPlan(dto.planId);
    if (!plan) throw new BadRequestException('Invalid plan');
    const companyId = this.primaryCompany(auth, dto.companyId || plan.companyId);
    const n = await this.repo.countContracts([companyId]);
    const contractNumber = `CTR-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
    const contract = await this.repo.insertContract({
      company_id: companyId,
      student_id: dto.studentId || null,
      plan_id: dto.planId,
      enrollment_id: dto.enrollmentId || null,
      lead_id: dto.leadId || null,
      contract_number: contractNumber,
      status: 'draft',
      created_by: user.id,
    });
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'sales',
      action: 'create_contract',
      entity: 'contract',
      entityId: contract.id,
    });
    return contract;
  }

  /** SalesOutboundPort — EventEmitter now; swap for BullMQ later */
  async emitContractSigned(event: Parameters<SalesOutboundPort['emitContractSigned']>[0]) {
    this.events.emit(CONTRACT_SIGNED, event);
  }

  async signContract(user: AuthUser, auth: AuthContext, id: string) {
    const contract = await this.getContract(auth, id);
    try {
      assertCanSignContract(contract);
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Cannot sign');
    }
    const plan = await this.repo.getPlan(contract.planId);
    if (!plan) throw new BadRequestException('Plan missing');

    let studentId = contract.studentId;
    const lead = contract.leadId ? await this.repo.getLead(contract.leadId) : null;

    if (!studentId && lead) {
      const unitId = lead.unitId || auth.defaultUnitId || DEV_UNIT;
      const created = await this.repo.insertStudent({
        company_id: contract.companyId,
        unit_id: unitId,
        registration_number: `ATH-MX-${Date.now().toString().slice(-6)}`,
        full_name: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        whatsapp: lead.whatsapp,
        status: 'active',
        plan_name: plan.name,
        created_by: user.id,
      });
      studentId = String(created.id);
      await this.repo.updateLead(lead.id, {
        student_id: studentId,
        status: 'won',
        stage_id: 'cccccccc-cccc-cccc-cccc-cccccccccc08',
      });
    }
    if (!studentId) throw new BadRequestException('studentId or leadId required to sign');

    let enrollmentId = contract.enrollmentId;
    if (!enrollmentId) {
      const start = new Date().toISOString().slice(0, 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);
      const enrollment = await this.repo.insertEnrollment({
        company_id: contract.companyId,
        student_id: studentId,
        plan_id: plan.id,
        lead_id: contract.leadId,
        salesperson_id: user.id,
        start_date: start,
        end_date: endDate.toISOString().slice(0, 10),
        status: 'active',
      });
      enrollmentId = enrollment.id;
    }

    const { buildPdf } = await import('../prints/pdf.util');
    const pdfBuffer = await buildPdf({
      title: 'Contrato de Matrícula',
      subtitle: 'ATHENA',
      lines: [
        `Contrato nº: ${contract.contractNumber}`,
        `Aluno ID: ${studentId}`,
        `Plano: ${plan.name}`,
        `Valor: R$ ${Number(plan.price).toFixed(2)}`,
        `Assinado em: ${new Date().toISOString()}`,
      ],
    });
    const path = `companies/${contract.companyId}/contracts/${contract.id}.pdf`;
    const admin = this.supabase.getAdmin();
    await admin.storage.from('contracts').upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });
    const { data: pub } = admin.storage.from('contracts').getPublicUrl(path);

    const signed = await this.repo.updateContract(id, {
      status: 'signed',
      signed_at: new Date().toISOString(),
      student_id: studentId,
      enrollment_id: enrollmentId,
      storage_path: path,
      pdf_url: pub.publicUrl,
    });
    if (enrollmentId) {
      await this.repo.updateEnrollment(enrollmentId, { contract_id: id });
    }

    await this.emitContractSigned({
      contractId: id,
      companyId: contract.companyId,
      planId: plan.id,
      leadId: contract.leadId,
      studentId,
      enrollmentId,
      signedBy: user.id,
    });

    await this.audit.log({
      companyId: contract.companyId,
      userId: user.id,
      module: 'sales',
      action: 'sign_contract',
      entity: 'contract',
      entityId: id,
    });

    return signed;
  }

  async dashboard(auth: AuthContext): Promise<SalesDashboard> {
    const ids = this.companyIds(auth);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const [newLeads, scheduledVisits, enrollments, totalLeads, won] = await Promise.all([
      this.repo.countLeadsSince(ids, since.toISOString()),
      this.repo.countScheduledVisits(ids),
      this.repo.countEnrollments(ids),
      this.repo.countLeads(ids),
      this.repo.countWonLeads(ids),
    ]);
    return {
      newLeads,
      scheduledVisits,
      enrollments,
      conversionRate: calcConversionRate(won, totalLeads),
    };
  }
}
