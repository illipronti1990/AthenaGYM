import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthContext, PipelineColumn, SalesDashboard } from '@athena/shared';
import { calcConversionRate } from '@athena/shared';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { FinanceService } from '../finance/finance.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateActivityDto,
  CancelEnrollmentDto,
  ChangePlanDto,
  CompleteEnrollmentDto,
  ConvertLeadDto,
  CreateContractDto,
  CreateEnrollmentDto,
  CreateLeadDto,
  CreatePlanDto,
  FreezeEnrollmentDto,
  MoveLeadStageDto,
  RenewEnrollmentDto,
  SignContractDto,
  UpdateLeadDto,
  UpdatePlanDto,
} from './dto/sales.dto';
import { CONTRACT_SIGNED, LEAD_CONVERTED, LEAD_CREATED } from './events/sales.events';
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
    @Inject(forwardRef(() => FinanceService))
    private readonly finance: FinanceService,
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
      objective: dto.objective || null,
      first_contact_at: dto.firstContactAt || null,
      goal: dto.goal || null,
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
    this.events.emit(LEAD_CREATED, { companyId, leadId: lead.id, userId: user.id });
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
      objective: dto.objective !== undefined ? dto.objective : existing.objective,
      first_contact_at: dto.firstContactAt !== undefined ? dto.firstContactAt : existing.firstContactAt,
      goal: dto.goal !== undefined ? dto.goal : existing.goal,
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
      plan_type: dto.planType || 'mensal',
      duration_days: dto.durationDays,
      price: dto.price,
      enrollment_fee: dto.enrollmentFee ?? 0,
      frequency: dto.frequency || null,
      allowed_days: dto.allowedDays || null,
      allowed_hours: dto.allowedHours || null,
      fidelity_days: dto.fidelityDays ?? 0,
      grace_days: dto.graceDays ?? 0,
      discount_percent: dto.discountPercent ?? 0,
      notes: dto.notes || null,
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
      category: dto.category ?? plan.category,
      plan_type: dto.planType ?? plan.planType,
      price: dto.price ?? plan.price,
      enrollment_fee: dto.enrollmentFee ?? plan.enrollmentFee,
      duration_days: dto.durationDays ?? plan.durationDays,
      frequency: dto.frequency !== undefined ? dto.frequency : plan.frequency,
      allowed_days: dto.allowedDays !== undefined ? dto.allowedDays : plan.allowedDays,
      allowed_hours: dto.allowedHours !== undefined ? dto.allowedHours : plan.allowedHours,
      fidelity_days: dto.fidelityDays ?? plan.fidelityDays,
      grace_days: dto.graceDays ?? plan.graceDays,
      discount_percent: dto.discountPercent ?? plan.discountPercent,
      notes: dto.notes !== undefined ? dto.notes : plan.notes,
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

  async deletePlan(user: AuthUser, auth: AuthContext, id: string) {
    const plan = await this.repo.getPlan(id);
    if (!plan) throw new NotFoundException('Plan not found');
    this.companyIds(auth, plan.companyId);
    await this.repo.softDeletePlan(id);
    await this.audit.log({
      companyId: plan.companyId,
      userId: user.id,
      module: 'sales',
      action: 'delete_plan',
      entity: 'plan',
      entityId: id,
    });
    return { ok: true };
  }

  async listEnrollments(auth: AuthContext) {
    return this.repo.listEnrollmentsEnriched(this.companyIds(auth));
  }

  async getEnrollment(auth: AuthContext, id: string) {
    const enrollment = await this.repo.getEnrollment(id);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    this.companyIds(auth, enrollment.companyId);
    const [student, plan, events] = await Promise.all([
      this.repo.getStudent(enrollment.studentId),
      this.repo.getPlan(enrollment.planId),
      this.repo.listEnrollmentEvents(id),
    ]);
    return {
      ...enrollment,
      studentName: student ? String(student.full_name) : null,
      planName: plan?.name || null,
      events,
    };
  }

  async createEnrollment(user: AuthUser, auth: AuthContext, dto: CreateEnrollmentDto) {
    const plan = await this.repo.getPlan(dto.planId);
    if (!plan) throw new BadRequestException('Invalid plan');
    const companyId = this.primaryCompany(auth, dto.companyId || plan.companyId);
    const start = dto.startDate || new Date().toISOString().slice(0, 10);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + plan.durationDays);
    const discountPercent = dto.discountPercent ?? 0;
    const discountAmount = dto.discountAmount ?? (plan.price * discountPercent) / 100;
    const monthlyFee = Math.max(0, plan.price - discountAmount);
    const enrollment = await this.repo.insertEnrollment({
      company_id: companyId,
      student_id: dto.studentId,
      plan_id: dto.planId,
      lead_id: dto.leadId || null,
      trainer_id: dto.trainerId || null,
      salesperson_id: user.id,
      start_date: start,
      end_date: endDate.toISOString().slice(0, 10),
      status: 'active',
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      payment_method: dto.paymentMethod || null,
      monthly_fee: monthlyFee,
      notes: dto.notes || null,
    });
    await this.repo.insertEnrollmentEvent({
      company_id: companyId,
      enrollment_id: enrollment.id,
      kind: 'enrolled',
      title: 'Nova matrícula',
      description: `Plano ${plan.name}`,
      created_by: user.id,
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

  async completeEnrollment(user: AuthUser, auth: AuthContext, dto: CompleteEnrollmentDto) {
    const plan = await this.repo.getPlan(dto.planId);
    if (!plan) throw new BadRequestException('Invalid plan');
    const companyId = this.primaryCompany(auth, dto.companyId || plan.companyId);

    let studentId = dto.studentId;
    if (!studentId) {
      if (!dto.fullName?.trim()) throw new BadRequestException('fullName or studentId required');
      const unitId = dto.unitId || auth.defaultUnitId || DEV_UNIT;
      const created = await this.repo.insertStudent({
        company_id: companyId,
        unit_id: unitId,
        registration_number: `ATH-MX-${Date.now().toString().slice(-6)}`,
        full_name: dto.fullName.trim(),
        phone: dto.phone || null,
        cpf: dto.cpf || null,
        status: 'active',
        plan_name: plan.name,
        created_by: user.id,
      });
      studentId = String(created.id);
    } else {
      const existing = await this.repo.getStudent(studentId);
      if (!existing) throw new BadRequestException('Student not found');
    }

    const start = dto.startDate || new Date().toISOString().slice(0, 10);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + plan.durationDays);
    const discountPercent = dto.discountPercent ?? 0;
    const discountAmount = dto.discountAmount ?? (plan.price * discountPercent) / 100;
    const monthlyFee = Math.max(0, plan.price - discountAmount);

    const enrollment = await this.repo.insertEnrollment({
      company_id: companyId,
      student_id: studentId,
      plan_id: plan.id,
      trainer_id: dto.trainerId || null,
      salesperson_id: user.id,
      start_date: start,
      end_date: endDate.toISOString().slice(0, 10),
      status: 'active',
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      payment_method: dto.paymentMethod || null,
      monthly_fee: monthlyFee,
      notes: dto.notes || null,
    });

    const n = await this.repo.countContracts([companyId]);
    const contractNumber = `CTR-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
    let contract = await this.repo.insertContract({
      company_id: companyId,
      student_id: studentId,
      plan_id: plan.id,
      enrollment_id: enrollment.id,
      contract_number: contractNumber,
      status: 'draft',
      created_by: user.id,
    });

    await this.repo.updateEnrollment(enrollment.id, { contract_id: contract.id });
    await this.repo.insertEnrollmentEvent({
      company_id: companyId,
      enrollment_id: enrollment.id,
      kind: 'enrolled',
      title: 'Nova matrícula',
      description: `Plano ${plan.name} — R$ ${monthlyFee.toFixed(2)}`,
      created_by: user.id,
    });

    if (dto.signatureData) {
      contract = await this.signContract(user, auth, contract.id, {
        signatureData: dto.signatureData,
        signedName: dto.signedName || dto.fullName,
      });
    }

    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'sales',
      action: 'complete_enrollment',
      entity: 'enrollment',
      entityId: enrollment.id,
    });

    return {
      enrollment: { ...enrollment, contractId: contract.id },
      contract,
      studentId,
    };
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

  async signContract(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: SignContractDto = {},
  ) {
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
    const studentRow = studentId ? await this.repo.getStudent(studentId) : null;

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
        monthly_fee: plan.price,
      });
      enrollmentId = enrollment.id;
    }

    const studentName =
      dto.signedName ||
      (studentRow ? String(studentRow.full_name) : null) ||
      lead?.fullName ||
      'Aluno';
    const studentCpf = studentRow?.cpf ? String(studentRow.cpf) : '—';

    const { buildPdf } = await import('../prints/pdf.util');
    const pdfBuffer = await buildPdf({
      title: 'Contrato de Matrícula',
      subtitle: 'Movvo ERP',
      lines: [
        `Contrato nº: ${contract.contractNumber}`,
        `Aluno: ${studentName}`,
        `CPF: ${studentCpf}`,
        `Plano: ${plan.name}`,
        `Valor: R$ ${Number(plan.price).toFixed(2)}`,
        `Data: ${new Date().toLocaleDateString('pt-BR')}`,
        `Assinado em: ${new Date().toISOString()}`,
        dto.signatureData ? 'Assinatura digital: registrada' : 'Assinatura: carimbo do sistema',
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
      signature_data: dto.signatureData || null,
      signed_name: studentName,
      signed_ip: dto.signedIp || null,
    });
    if (enrollmentId) {
      await this.repo.updateEnrollment(enrollmentId, { contract_id: id });
      await this.repo.insertEnrollmentEvent({
        company_id: contract.companyId,
        enrollment_id: enrollmentId,
        kind: 'contract_signed',
        title: 'Contrato assinado',
        description: contract.contractNumber,
        created_by: user.id,
      });
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

  async listRenewalsDue(auth: AuthContext, daysCsv?: string) {
    const days = (daysCsv || '30,15,7,3,1')
      .split(',')
      .map((d) => Number(d.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0);
    return this.repo.listRenewalsDue(this.companyIds(auth), days.length ? days : [30, 15, 7, 3, 1]);
  }

  async renewEnrollment(user: AuthUser, auth: AuthContext, id: string, dto: RenewEnrollmentDto) {
    const enrollment = await this.repo.getEnrollment(id);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    this.companyIds(auth, enrollment.companyId);
    if (enrollment.status === 'cancelled') {
      throw new BadRequestException('Cannot renew cancelled enrollment');
    }
    const plan = await this.repo.getPlan(enrollment.planId);
    if (!plan) throw new BadRequestException('Plan missing');

    const base =
      dto.startDate ||
      (enrollment.endDate && enrollment.endDate > new Date().toISOString().slice(0, 10)
        ? enrollment.endDate
        : new Date().toISOString().slice(0, 10));
    const start = new Date(base);
    const end = new Date(start);
    end.setDate(end.getDate() + plan.durationDays);
    const fee = enrollment.monthlyFee ?? plan.price;

    const updated = await this.repo.updateEnrollment(id, {
      status: 'active',
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      payment_method: dto.paymentMethod || enrollment.paymentMethod,
      monthly_fee: fee,
    });

    try {
      await this.finance.createReceivableForEnrollmentRenewal({
        companyId: enrollment.companyId,
        unitId: null,
        studentId: enrollment.studentId,
        enrollmentId: id,
        planId: plan.id,
        planName: plan.name,
        amount: fee,
        dueDate: start.toISOString().slice(0, 10),
        createdBy: user.id,
      });
    } catch {
      /* receivables schema may vary in older envs */
    }

    await this.repo.insertEnrollmentEvent({
      company_id: enrollment.companyId,
      enrollment_id: id,
      kind: 'renewed',
      title: 'Plano renovado',
      description: `Válido até ${end.toISOString().slice(0, 10)}`,
      created_by: user.id,
    });
    await this.audit.log({
      companyId: enrollment.companyId,
      userId: user.id,
      module: 'sales',
      action: 'renew_enrollment',
      entity: 'enrollment',
      entityId: id,
    });
    return updated;
  }

  async freezeEnrollment(user: AuthUser, auth: AuthContext, id: string, dto: FreezeEnrollmentDto) {
    const enrollment = await this.repo.getEnrollment(id);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    this.companyIds(auth, enrollment.companyId);
    if (enrollment.status !== 'active') {
      throw new BadRequestException('Only active enrollments can be frozen');
    }
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }
    await this.repo.insertFreeze({
      company_id: enrollment.companyId,
      enrollment_id: id,
      start_date: dto.startDate,
      end_date: dto.endDate,
      reason: dto.reason,
      notes: dto.notes || null,
      created_by: user.id,
    });
    const updated = await this.repo.updateEnrollment(id, { status: 'frozen' });
    await this.repo.insertEnrollmentEvent({
      company_id: enrollment.companyId,
      enrollment_id: id,
      kind: 'frozen',
      title: 'Matrícula congelada',
      description: `${dto.startDate} → ${dto.endDate} — ${dto.reason}`,
      created_by: user.id,
    });
    await this.audit.log({
      companyId: enrollment.companyId,
      userId: user.id,
      module: 'sales',
      action: 'freeze_enrollment',
      entity: 'enrollment',
      entityId: id,
    });
    return updated;
  }

  async unfreezeEnrollment(user: AuthUser, auth: AuthContext, id: string) {
    const enrollment = await this.repo.getEnrollment(id);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    this.companyIds(auth, enrollment.companyId);
    if (enrollment.status !== 'frozen') {
      throw new BadRequestException('Enrollment is not frozen');
    }
    const freeze = await this.repo.getActiveFreeze(id);
    let extendDays = 0;
    if (freeze) {
      const start = new Date(String(freeze.start_date));
      const end = new Date(String(freeze.end_date));
      const today = new Date();
      const effectiveEnd = today < end ? today : end;
      extendDays = Math.max(
        0,
        Math.ceil((effectiveEnd.getTime() - start.getTime()) / 86400000) + 1,
      );
      await this.repo.endFreeze(String(freeze.id));
    }
    let newEnd = enrollment.endDate;
    if (newEnd && extendDays > 0) {
      const d = new Date(newEnd);
      d.setDate(d.getDate() + extendDays);
      newEnd = d.toISOString().slice(0, 10);
    }
    const updated = await this.repo.updateEnrollment(id, {
      status: 'active',
      end_date: newEnd,
    });
    await this.repo.insertEnrollmentEvent({
      company_id: enrollment.companyId,
      enrollment_id: id,
      kind: 'unfrozen',
      title: 'Matrícula descongelada',
      description: extendDays ? `+${extendDays} dias no vencimento` : null,
      created_by: user.id,
    });
    await this.audit.log({
      companyId: enrollment.companyId,
      userId: user.id,
      module: 'sales',
      action: 'unfreeze_enrollment',
      entity: 'enrollment',
      entityId: id,
    });
    return updated;
  }

  async cancelEnrollment(user: AuthUser, auth: AuthContext, id: string, dto: CancelEnrollmentDto) {
    const enrollment = await this.repo.getEnrollment(id);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    this.companyIds(auth, enrollment.companyId);
    if (enrollment.status === 'cancelled') {
      throw new BadRequestException('Already cancelled');
    }
    const updated = await this.repo.updateEnrollment(id, {
      status: 'cancelled',
      cancel_reason: dto.reason,
      cancelled_at: new Date().toISOString(),
      notes: dto.notes || enrollment.notes,
    });
    await this.repo.insertEnrollmentEvent({
      company_id: enrollment.companyId,
      enrollment_id: id,
      kind: 'cancelled',
      title: 'Matrícula cancelada',
      description: dto.reason + (dto.notes ? ` — ${dto.notes}` : ''),
      created_by: user.id,
    });
    await this.audit.log({
      companyId: enrollment.companyId,
      userId: user.id,
      module: 'sales',
      action: 'cancel_enrollment',
      entity: 'enrollment',
      entityId: id,
    });
    return updated;
  }

  async changePlan(user: AuthUser, auth: AuthContext, id: string, dto: ChangePlanDto) {
    const enrollment = await this.repo.getEnrollment(id);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    this.companyIds(auth, enrollment.companyId);
    if (!['active', 'frozen'].includes(enrollment.status)) {
      throw new BadRequestException('Cannot change plan for this enrollment');
    }
    const fromPlan = await this.repo.getPlan(enrollment.planId);
    const toPlan = await this.repo.getPlan(dto.planId);
    if (!fromPlan || !toPlan) throw new BadRequestException('Invalid plan');
    if (fromPlan.id === toPlan.id) throw new BadRequestException('Same plan');

    const effective = dto.effectiveDate || new Date().toISOString().slice(0, 10);
    const today = new Date(effective);
    const end = enrollment.endDate ? new Date(enrollment.endDate) : today;
    const remainingDays = Math.max(
      0,
      Math.ceil((end.getTime() - today.getTime()) / 86400000),
    );
    const credit =
      fromPlan.durationDays > 0
        ? (remainingDays / fromPlan.durationDays) * (enrollment.monthlyFee ?? fromPlan.price)
        : 0;
    const proration = Number((toPlan.price - credit).toFixed(2));
    const kind = toPlan.price >= fromPlan.price ? 'upgraded' : 'downgraded';

    const newEnd = new Date(effective);
    newEnd.setDate(newEnd.getDate() + toPlan.durationDays);

    await this.repo.insertPlanChange({
      company_id: enrollment.companyId,
      enrollment_id: id,
      from_plan_id: fromPlan.id,
      to_plan_id: toPlan.id,
      proration_amount: proration,
      credit_amount: Number(credit.toFixed(2)),
      effective_date: effective,
      notes: dto.notes || null,
      created_by: user.id,
    });

    const updated = await this.repo.updateEnrollment(id, {
      plan_id: toPlan.id,
      monthly_fee: toPlan.price,
      end_date: newEnd.toISOString().slice(0, 10),
      status: enrollment.status === 'frozen' ? 'frozen' : 'active',
    });

    if (proration > 0) {
      try {
        await this.finance.createReceivableForEnrollmentRenewal({
          companyId: enrollment.companyId,
          unitId: null,
          studentId: enrollment.studentId,
          enrollmentId: id,
          planId: toPlan.id,
          planName: toPlan.name,
          amount: proration,
          dueDate: effective,
          createdBy: user.id,
          description: `Troca de plano ${fromPlan.name} → ${toPlan.name}`,
        });
      } catch {
        /* ignore */
      }
    }

    await this.repo.insertEnrollmentEvent({
      company_id: enrollment.companyId,
      enrollment_id: id,
      kind,
      title: kind === 'upgraded' ? 'Upgrade de plano' : 'Downgrade de plano',
      description: `${fromPlan.name} → ${toPlan.name} (diferença R$ ${proration.toFixed(2)})`,
      meta: { credit, proration, remainingDays },
      created_by: user.id,
    });
    await this.audit.log({
      companyId: enrollment.companyId,
      userId: user.id,
      module: 'sales',
      action: 'change_plan',
      entity: 'enrollment',
      entityId: id,
    });
    return { enrollment: updated, proration, credit: Number(credit.toFixed(2)) };
  }

  async listEnrollmentEvents(auth: AuthContext, id: string) {
    const enrollment = await this.repo.getEnrollment(id);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    this.companyIds(auth, enrollment.companyId);
    return this.repo.listEnrollmentEvents(id);
  }

  async convertLead(user: AuthUser, auth: AuthContext, leadId: string, dto: ConvertLeadDto) {
    const lead = await this.getLead(auth, leadId);
    if (lead.status === 'won') {
      throw new BadRequestException('Lead já foi convertido');
    }
    if (lead.studentId && !dto.studentId) {
      throw new BadRequestException('Lead já possui aluno vinculado');
    }

    let studentId = dto.studentId || lead.studentId;
    if (!studentId) {
      const unitId = lead.unitId || auth.defaultUnitId || DEV_UNIT;
      const created = await this.repo.insertStudent({
        company_id: lead.companyId,
        unit_id: unitId,
        registration_number: `ATH-MX-${Date.now().toString().slice(-6)}`,
        full_name: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        whatsapp: lead.whatsapp,
        status: 'active',
        created_by: user.id,
      });
      studentId = String(created.id);
    }

    const enrolled = await this.repo.updateLead(leadId, {
      student_id: studentId,
      status: 'won',
      stage_id: 'cccccccc-cccc-cccc-cccc-cccccccccc08',
      updated_by: user.id,
    });

    await this.audit.log({
      companyId: lead.companyId,
      userId: user.id,
      module: 'sales',
      action: 'convert_lead',
      entity: 'lead',
      entityId: leadId,
      metadata: { studentId },
    });

    this.events.emit(LEAD_CONVERTED, {
      companyId: lead.companyId,
      leadId,
      studentId,
      userId: user.id,
    });

    return { lead: enrolled, studentId };
  }

  async crmDashboard(auth: AuthContext) {
    const companyIds = this.companyIds(auth);
    const admin = this.supabase.getAdmin();
    const safe = async <T>(fn: () => PromiseLike<{ data: T | null; count?: number | null; error: unknown }>, fallback: T, countFallback = 0) => {
      try {
        const r = await fn();
        if (r.error) return { data: fallback, count: countFallback };
        return { data: (r.data ?? fallback) as T, count: r.count ?? countFallback };
      } catch {
        return { data: fallback, count: countFallback };
      }
    };

    const [leads, referrals, npsResponses, segments, automations] = await Promise.all([
      safe(() => admin.from('leads').select('status', { count: 'exact' }).in('company_id', companyIds).is('deleted_at', null), []),
      safe(() => admin.from('referrals').select('status').in('company_id', companyIds).is('deleted_at', null), []),
      safe(() => admin.from('nps_responses').select('score').in('company_id', companyIds), []),
      safe(() => admin.from('audience_segments').select('id', { count: 'exact', head: true }).in('company_id', companyIds).eq('active', true).is('deleted_at', null), null, 0),
      safe(() => admin.from('automation_flows').select('id', { count: 'exact', head: true }).in('company_id', companyIds).eq('active', true).is('deleted_at', null), null, 0),
    ]);

    const openLeads = (Array.isArray(leads.data) ? leads.data : []).filter(
      (l) => !['won', 'lost'].includes(String((l as { status?: string }).status)),
    ).length;
    const pendingReferrals = (Array.isArray(referrals.data) ? referrals.data : []).filter(
      (r) => (r as { status?: string }).status === 'pending',
    ).length;
    const npsScores = (Array.isArray(npsResponses.data) ? npsResponses.data : []).map((r) =>
      Number((r as { score?: number }).score),
    );
    const npsPromoters = npsScores.filter((s) => s >= 9).length;
    const npsDetractors = npsScores.filter((s) => s <= 6).length;
    const npsScore = npsScores.length
      ? Math.round(((npsPromoters - npsDetractors) / npsScores.length) * 100)
      : 0;

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const newLeadsToday = await this.repo.countLeadsSince(companyIds, since.toISOString());

    return {
      openLeads,
      newLeadsToday,
      totalReferrals: Array.isArray(referrals.data) ? referrals.data.length : 0,
      pendingReferrals,
      npsScore,
      totalNpsResponses: npsScores.length,
      activeSegments: segments.count || 0,
      activeAutomations: automations.count || 0,
    };
  }

  async crmKpis(auth: AuthContext) {
    const companyIds = this.companyIds(auth);
    const [totalLeads, won, lost] = await Promise.all([
      this.repo.countLeads(companyIds),
      this.repo.countWonLeads(companyIds),
      (() => {
        const admin = this.supabase.getAdmin();
        return admin
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .in('company_id', companyIds)
          .eq('status', 'lost')
          .is('deleted_at', null)
          .then((r) => r.count || 0);
      })(),
    ]);
    const open = totalLeads - won - lost;
    return {
      conversionRate: calcConversionRate(won, totalLeads),
      avgLeadResponseHours: 0,
      totalWon: won,
      totalLost: lost,
      totalOpen: Math.max(0, open),
    };
  }

  async crmBirthdays(auth: AuthContext, date?: string) {
    return this.repo.listBirthdays(this.companyIds(auth), date);
  }

  async crmRecovery(auth: AuthContext) {
    return this.repo.listRecoveryStudents(this.companyIds(auth));
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
