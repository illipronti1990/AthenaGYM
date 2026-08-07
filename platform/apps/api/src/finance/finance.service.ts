import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  buildCashflow,
  buildDre,
  calcReceivableNet,
  calcReceivableRemaining,
  resolveReceivableDisplayStatus,
  splitInstallments,
  type AuthContext,
  type CashDirection,
  type CashflowSummary,
  type DelinquencyReport,
  type DueAlertItem,
} from '@athena/shared';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { ContractSignedEvent } from '../sales/events/sales.events';
import {
  CashSessionAmountDto,
  CloseCashSessionDto,
  CreateAccountDto,
  CreateCostCenterDto,
  UpdateCostCenterDto,
  UpdateAccountDto,
  CreatePayableDto,
  CreatePixDto,
  CreateReceivableDto,
  CreateSubscriptionDto,
  InstallmentsDto,
  OpenCashSessionDto,
  ReceivePaymentDto,
  ReconciliationImportDto,
  RenegotiateDto,
  UpdatePayableDto,
  UpdateReceivableDto,
} from './dto/finance.dto';
import {
  PAYMENT_CONFIRMED,
  PAYMENT_CREATED,
  PaymentConfirmedEvent,
  SUBSCRIPTION_CREATED,
  SUBSCRIPTION_RENEWED,
} from './events/finance.events';
import { FinanceRepository } from './finance.repository';
import { getPaymentProvider, payloadHash } from './payments/payment-provider';

const DEV_COMPANY = '11111111-1111-1111-1111-111111111111';
const DEV_UNIT = '22222222-2222-2222-2222-222222222222';

@Injectable()
export class FinanceService {
  constructor(
    private readonly repo: FinanceRepository,
    private readonly events: EventEmitter2,
    private readonly audit: AuditService,
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

  async dashboard(auth: AuthContext) {
    return this.repo.dashboardStats(this.companyIds(auth));
  }

  listAccounts(auth: AuthContext) {
    return this.repo.listAccounts(this.companyIds(auth));
  }

  async createAccount(user: AuthUser, auth: AuthContext, dto: CreateAccountDto) {
    const companyId = this.primaryCompany(auth, dto.companyId || auth.companyId);
    return this.repo.insertAccount({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId || DEV_UNIT,
      bank_name: dto.bankName,
      agency: dto.agency || null,
      account: dto.account || null,
      pix_key: dto.pixKey || null,
      status: 'active',
    });
  }

  async updateAccount(user: AuthUser, auth: AuthContext, id: string, dto: UpdateAccountDto) {
    const existing = await this.repo.getAccount(id);
    if (!existing) throw new NotFoundException('Conta não encontrada');
    this.companyIds(auth, existing.companyId);
    const patch: Record<string, unknown> = {};
    if (dto.bankName !== undefined) patch.bank_name = dto.bankName;
    if (dto.agency !== undefined) patch.agency = dto.agency || null;
    if (dto.account !== undefined) patch.account = dto.account || null;
    if (dto.pixKey !== undefined) patch.pix_key = dto.pixKey || null;
    if (dto.status !== undefined) patch.status = dto.status;
    const updated = await this.repo.updateAccount(id, patch);
    await this.audit.log({
      companyId: existing.companyId,
      userId: user.id,
      module: 'finance',
      action: 'update_account',
      entity: 'financial_account',
      entityId: id,
    });
    return updated;
  }

  listCostCenters(auth: AuthContext) {
    return this.repo.listCostCenters(this.companyIds(auth));
  }

  async createCostCenter(auth: AuthContext, dto: CreateCostCenterDto) {
    const companyId = this.primaryCompany(auth, dto.companyId || auth.companyId);
    return this.repo.insertCostCenter({
      company_id: companyId,
      name: dto.name,
      description: dto.description || null,
      category: dto.category || null,
      active: true,
    });
  }

  async updateCostCenter(auth: AuthContext, id: string, dto: UpdateCostCenterDto) {
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.category !== undefined) patch.category = dto.category;
    if (dto.active !== undefined) patch.active = dto.active;
    return this.repo.updateCostCenter(id, this.companyIds(auth), patch);
  }

  softDeleteCostCenter(auth: AuthContext, id: string) {
    return this.repo.softDeleteCostCenter(id, this.companyIds(auth));
  }

  listMethods() {
    return this.repo.listMethods();
  }

  listReceivables(
    auth: AuthContext,
    filters?: {
      studentId?: string;
      planId?: string;
      paymentMethodId?: string;
      trainerId?: string;
      unitId?: string;
      status?: string;
      from?: string;
      to?: string;
    },
  ) {
    const ids = this.companyIds(auth);
    void this.repo.markOverdueReceivables(ids, new Date().toISOString().slice(0, 10));
    return this.repo.listReceivables(ids, filters);
  }

  async createReceivable(user: AuthUser, auth: AuthContext, dto: CreateReceivableDto) {
    const companyId = this.primaryCompany(auth, dto.companyId || auth.companyId);
    const due = dto.dueDate.slice(0, 10);
    const rec = await this.repo.insertReceivable({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId || DEV_UNIT,
      student_id: dto.studentId || null,
      enrollment_id: dto.enrollmentId || null,
      plan_id: dto.planId || null,
      trainer_id: dto.trainerId || null,
      contract_id: dto.contractId || null,
      subscription_id: dto.subscriptionId || null,
      cost_center_id: dto.costCenterId || null,
      description: dto.description,
      amount: dto.amount,
      discount: dto.discount || 0,
      addition: dto.addition || 0,
      interest: dto.interest || 0,
      fine: dto.fine || 0,
      due_date: due,
      competence_month: `${due.slice(0, 8)}01`,
      notes: dto.notes || null,
      status: 'open',
      created_by: user.id,
    });
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'finance',
      action: 'create_receivable',
      entity: 'receivable',
      entityId: rec.id,
    });
    return {
      ...rec,
      displayStatus: resolveReceivableDisplayStatus(rec.status, rec.dueDate),
    };
  }

  async updateReceivable(auth: AuthContext, id: string, dto: UpdateReceivableDto) {
    const existing = await this.repo.getReceivable(id);
    if (!existing) throw new NotFoundException('Receivable not found');
    this.companyIds(auth, existing.companyId);
    return this.repo.updateReceivable(id, {
      description: dto.description ?? existing.description,
      amount: dto.amount ?? existing.amount,
      due_date: dto.dueDate ?? existing.dueDate,
      discount: dto.discount ?? existing.discount,
      addition: dto.addition ?? existing.addition,
      interest: dto.interest ?? existing.interest,
      fine: dto.fine ?? existing.fine,
      status: dto.status ?? existing.status,
      notes: dto.notes ?? existing.notes,
      payment_method_id: dto.paymentMethodId ?? existing.paymentMethodId,
    });
  }

  async receiveManual(user: AuthUser, auth: AuthContext, id: string, dto: ReceivePaymentDto = {}) {
    const rec = await this.repo.getReceivable(id);
    if (!rec) throw new NotFoundException('Receivable not found');
    this.companyIds(auth, rec.companyId);
    if (rec.status === 'paid' || rec.status === 'cancelled' || rec.status === 'refunded') {
      throw new BadRequestException('Receivable cannot be paid');
    }

    const interest = dto.interest ?? rec.interest;
    const fine = dto.fine ?? rec.fine;
    const net = calcReceivableNet({
      amount: rec.amount,
      discount: rec.discount,
      addition: rec.addition,
      interest,
      fine,
    });
    const remaining = Math.max(0, Math.round((net - rec.amountPaid) * 100) / 100);
    if (remaining <= 0) throw new BadRequestException('Nothing left to receive');

    const payAmount =
      dto.amount != null ? Math.round(dto.amount * 100) / 100 : remaining;
    if (payAmount <= 0) throw new BadRequestException('Invalid payment amount');
    if (payAmount > remaining + 0.001) {
      throw new BadRequestException('Amount exceeds remaining balance');
    }

    const paidAt = new Date().toISOString();
    const newPaid = Math.round((rec.amountPaid + payAmount) * 100) / 100;
    const fullyPaid = newPaid >= net - 0.001;
    const unitId = rec.unitId || auth.defaultUnitId || DEV_UNIT;
    const session = await this.repo.getOpenCashSession(rec.companyId, unitId);

    const updated = await this.repo.updateReceivable(id, {
      interest,
      fine,
      amount_paid: newPaid,
      status: fullyPaid ? 'paid' : 'partial',
      paid_at: fullyPaid ? paidAt : rec.paidAt,
      payment_method_id: dto.paymentMethodId || rec.paymentMethodId,
      cashier_user_id: user.id,
      cash_session_id: session?.id || rec.cashSessionId,
      notes: dto.notes ?? rec.notes,
    });

    await this.repo.insertCashMovement({
      company_id: rec.companyId,
      unit_id: rec.unitId,
      cost_center_id: rec.costCenterId,
      movement_date: paidAt.slice(0, 10),
      direction: 'in',
      amount: payAmount,
      description: `Recebimento ${rec.description}`,
      source_type: 'receivable',
      source_id: id,
    });

    if (session) {
      await this.repo.insertCashSessionMovement({
        session_id: session.id,
        company_id: rec.companyId,
        movement_type: 'sale',
        amount: payAmount,
        payment_method_id: dto.paymentMethodId || null,
        receivable_id: id,
        notes: dto.notes || null,
        created_by: user.id,
      });
      await this.repo.updateCashSession(session.id, {
        expected_amount: Math.round((session.expectedAmount + payAmount) * 100) / 100,
      });
    }

    const idempotencyKey = `manual:${id}:${paidAt}:${payAmount}`;
    await this.repo.insertTransaction({
      company_id: rec.companyId,
      receivable_id: id,
      subscription_id: rec.subscriptionId,
      payment_method_id: dto.paymentMethodId || null,
      cash_session_id: session?.id || null,
      gateway: 'stub',
      external_id: null,
      idempotency_key: idempotencyKey,
      status: 'paid',
      amount: payAmount,
      paid_at: paidAt,
      nsu: dto.nsu || null,
      authorization_code: dto.authorizationCode || null,
      card_brand: dto.cardBrand || null,
      installments: dto.installments || 1,
    });

    if (fullyPaid) {
      await this.emitPaymentConfirmed({
        companyId: rec.companyId,
        receivableId: id,
        transactionId: id,
        studentId: rec.studentId,
        subscriptionId: rec.subscriptionId,
        amount: payAmount,
        paidAt,
      });
    }
    await this.audit.log({
      companyId: rec.companyId,
      userId: user.id,
      module: 'finance',
      action: 'receive',
      entity: 'receivable',
      entityId: id,
      metadata: { payAmount, fullyPaid },
    });
    return {
      ...updated,
      displayStatus: resolveReceivableDisplayStatus(updated.status, updated.dueDate),
    };
  }

  async cancelReceivable(user: AuthUser, auth: AuthContext, id: string) {
    const rec = await this.repo.getReceivable(id);
    if (!rec) throw new NotFoundException('Receivable not found');
    this.companyIds(auth, rec.companyId);
    const updated = await this.repo.updateReceivable(id, { status: 'cancelled' });
    await this.audit.log({
      companyId: rec.companyId,
      userId: user.id,
      module: 'finance',
      action: 'cancel_receivable',
      entity: 'receivable',
      entityId: id,
    });
    return updated;
  }

  async refundReceivable(user: AuthUser, auth: AuthContext, id: string) {
    const rec = await this.repo.getReceivable(id);
    if (!rec) throw new NotFoundException('Receivable not found');
    this.companyIds(auth, rec.companyId);
    if (rec.status !== 'paid') throw new BadRequestException('Only paid can be refunded');
    const amount = calcReceivableNet(rec);
    const updated = await this.repo.updateReceivable(id, { status: 'refunded' });
    await this.repo.insertCashMovement({
      company_id: rec.companyId,
      unit_id: rec.unitId,
      cost_center_id: rec.costCenterId,
      movement_date: new Date().toISOString().slice(0, 10),
      direction: 'out',
      amount,
      description: `Estorno ${rec.description}`,
      source_type: 'refund',
      source_id: id,
    });
    await this.audit.log({
      companyId: rec.companyId,
      userId: user.id,
      module: 'finance',
      action: 'refund',
      entity: 'receivable',
      entityId: id,
    });
    return updated;
  }

  async renegotiate(user: AuthUser, auth: AuthContext, id: string, dto: RenegotiateDto) {
    const rec = await this.repo.getReceivable(id);
    if (!rec) throw new NotFoundException('Receivable not found');
    this.companyIds(auth, rec.companyId);
    await this.repo.updateReceivable(id, { status: 'cancelled' });
    const created = await this.repo.insertReceivable({
      company_id: rec.companyId,
      unit_id: rec.unitId,
      student_id: rec.studentId,
      contract_id: rec.contractId,
      subscription_id: rec.subscriptionId,
      cost_center_id: rec.costCenterId,
      description: `Renegociação: ${rec.description}`,
      amount: dto.newAmount,
      due_date: dto.newDueDate.slice(0, 10),
      status: 'open',
      created_by: user.id,
    });
    return created;
  }

  async installments(user: AuthUser, auth: AuthContext, id: string, dto: InstallmentsDto) {
    const rec = await this.repo.getReceivable(id);
    if (!rec) throw new NotFoundException('Receivable not found');
    this.companyIds(auth, rec.companyId);
    const parts = splitInstallments(calcReceivableNet(rec), dto.count);
    await this.repo.updateReceivable(id, { status: 'cancelled' });
    const created = [];
    const base = new Date(rec.dueDate);
    for (let i = 0; i < parts.length; i++) {
      const due = new Date(base);
      due.setMonth(due.getMonth() + i);
      created.push(
        await this.repo.insertReceivable({
          company_id: rec.companyId,
          unit_id: rec.unitId,
          student_id: rec.studentId,
          contract_id: rec.contractId,
          subscription_id: rec.subscriptionId,
          cost_center_id: rec.costCenterId,
          description: `${rec.description} (${i + 1}/${parts.length})`,
          amount: parts[i],
          due_date: due.toISOString().slice(0, 10),
          status: 'open',
          created_by: user.id,
        }),
      );
    }
    return created;
  }

  listPayables(auth: AuthContext) {
    return this.repo.listPayables(this.companyIds(auth));
  }

  async createPayable(user: AuthUser, auth: AuthContext, dto: CreatePayableDto) {
    const companyId = this.primaryCompany(auth, dto.companyId || auth.companyId);
    let supplierId = dto.supplierId || null;
    if (!supplierId && dto.supplierName) {
      const s = await this.repo.insertSupplier({
        company_id: companyId,
        name: dto.supplierName,
        active: true,
      });
      supplierId = s.id;
    }
    const due = dto.dueDate.slice(0, 10);
    const pay = await this.repo.insertPayable({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId || DEV_UNIT,
      supplier_id: supplierId,
      cost_center_id: dto.costCenterId || null,
      description: dto.description,
      amount: dto.amount,
      due_date: due,
      category: dto.category || 'outros',
      competence_month: dto.competenceMonth
        ? dto.competenceMonth.slice(0, 10)
        : `${due.slice(0, 8)}01`,
      installment_label: dto.installmentLabel || null,
      notes: dto.notes || null,
      attachment_url: dto.attachmentUrl || null,
      status: 'open',
      created_by: user.id,
    });
    return pay;
  }

  async updatePayable(auth: AuthContext, id: string, dto: UpdatePayableDto) {
    const pay = await this.repo.getPayable(id);
    if (!pay) throw new NotFoundException('Payable not found');
    this.companyIds(auth, pay.companyId);
    if (pay.status === 'paid') throw new BadRequestException('Cannot edit paid payable');
    return this.repo.updatePayable(id, {
      description: dto.description ?? pay.description,
      amount: dto.amount ?? pay.amount,
      due_date: dto.dueDate ?? pay.dueDate,
      category: dto.category ?? pay.category,
      cost_center_id: dto.costCenterId ?? pay.costCenterId,
      competence_month: dto.competenceMonth ?? pay.competenceMonth,
      installment_label: dto.installmentLabel ?? pay.installmentLabel,
      notes: dto.notes ?? pay.notes,
      attachment_url: dto.attachmentUrl ?? pay.attachmentUrl,
    });
  }

  async cancelPayable(user: AuthUser, auth: AuthContext, id: string) {
    const pay = await this.repo.getPayable(id);
    if (!pay) throw new NotFoundException('Payable not found');
    this.companyIds(auth, pay.companyId);
    if (pay.status === 'paid') throw new BadRequestException('Cannot cancel paid payable');
    return this.repo.updatePayable(id, { status: 'cancelled' });
  }

  async payPayable(user: AuthUser, auth: AuthContext, id: string) {
    const pay = await this.repo.getPayable(id);
    if (!pay) throw new NotFoundException('Payable not found');
    this.companyIds(auth, pay.companyId);
    if (pay.status !== 'open') throw new BadRequestException('Payable is not open');
    const paidAt = new Date().toISOString();
    const updated = await this.repo.updatePayable(id, { status: 'paid', paid_at: paidAt });
    await this.repo.insertCashMovement({
      company_id: pay.companyId,
      unit_id: pay.unitId,
      cost_center_id: pay.costCenterId,
      movement_date: paidAt.slice(0, 10),
      direction: 'out',
      amount: pay.amount,
      description: `Pagamento ${pay.description}`,
      source_type: 'payable',
      source_id: id,
    });
    await this.audit.log({
      companyId: pay.companyId,
      userId: user.id,
      module: 'finance',
      action: 'pay_payable',
      entity: 'payable',
      entityId: id,
    });
    return updated;
  }

  async listSubscriptions(auth: AuthContext, studentId?: string) {
    // Alunos com plano (ex.: Mensal) passam a gerar assinatura financeira
    await this.syncSubscriptionsFromStudentPlans(auth);
    return this.repo.listSubscriptions(this.companyIds(auth), studentId);
  }

  /** Cria assinatura ativa quando o aluno tem plan_name batendo com um plano comercial. */
  async ensureSubscriptionFromPlanName(params: {
    companyId: string;
    studentId: string;
    unitId?: string | null;
    planName?: string | null;
  }) {
    const planName = params.planName?.trim();
    if (!planName) return null;

    const existing = await this.repo.findActiveSubscription(params.companyId, params.studentId);
    if (existing) return existing;

    const plan = await this.repo.findPlanByName(params.companyId, planName);
    if (!plan) return null;

    const amount = Number(plan.price ?? 0);
    const durationDays = Number(plan.duration_days ?? 30);
    const recurrence =
      durationDays >= 360 ? 'yearly' : durationDays >= 80 ? 'quarterly' : 'monthly';
    const nextDue = new Date();
    if (recurrence === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);
    else if (recurrence === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3);
    else nextDue.setMonth(nextDue.getMonth() + 1);

    const sub = await this.repo.insertSubscription({
      company_id: params.companyId,
      unit_id: params.unitId || DEV_UNIT,
      student_id: params.studentId,
      plan_id: String(plan.id),
      gateway: 'stub',
      recurrence,
      next_due_date: nextDue.toISOString().slice(0, 10),
      amount,
      status: 'active',
    });

    this.events.emit(SUBSCRIPTION_CREATED, {
      companyId: params.companyId,
      subscriptionId: sub.id,
      studentId: params.studentId,
      planId: String(plan.id),
      contractId: null,
    });
    return sub;
  }

  async syncSubscriptionsFromStudentPlans(auth: AuthContext) {
    const companyIds = this.companyIds(auth);
    const students = await this.repo.listStudentsWithPlan(companyIds);
    let created = 0;
    for (const s of students) {
      const sub = await this.ensureSubscriptionFromPlanName({
        companyId: s.company_id,
        studentId: s.id,
        unitId: s.unit_id,
        planName: s.plan_name,
      });
      if (sub) created += 1;
    }
    return { scanned: students.length, ensured: created };
  }

  async createSubscription(user: AuthUser, auth: AuthContext, dto: CreateSubscriptionDto) {
    const companyId = this.primaryCompany(auth, dto.companyId || auth.companyId);
    const plan = await this.repo.getPlan(dto.planId);
    if (!plan) throw new BadRequestException('Invalid plan');
    const amount = dto.amount ?? Number(plan.price);
    const nextDue = dto.nextDueDate || new Date().toISOString().slice(0, 10);
    const sub = await this.repo.insertSubscription({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId || DEV_UNIT,
      student_id: dto.studentId,
      plan_id: dto.planId,
      enrollment_id: dto.enrollmentId || null,
      contract_id: dto.contractId || null,
      gateway: dto.gateway || 'stub',
      recurrence: dto.recurrence || 'monthly',
      next_due_date: nextDue.slice(0, 10),
      amount,
      status: 'active',
    });
    await this.repo.insertOutbox({
      company_id: companyId,
      aggregate_type: 'subscription',
      aggregate_id: sub.id,
      event_type: SUBSCRIPTION_CREATED,
      payload: { subscriptionId: sub.id, studentId: dto.studentId, planId: dto.planId },
      status: 'pending',
    });
    this.events.emit(SUBSCRIPTION_CREATED, {
      companyId,
      subscriptionId: sub.id,
      studentId: dto.studentId,
      planId: dto.planId,
      contractId: dto.contractId || null,
    });
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'finance',
      action: 'create_subscription',
      entity: 'subscription',
      entityId: sub.id,
    });
    return sub;
  }

  async createPix(user: AuthUser, auth: AuthContext, dto: CreatePixDto) {
    const rec = await this.repo.getReceivable(dto.receivableId);
    if (!rec) throw new NotFoundException('Receivable not found');
    this.companyIds(auth, rec.companyId);
    if (rec.status === 'paid') throw new BadRequestException('Already paid');
    const gateway = dto.gateway || 'stub';
    const idempotencyKey = `pix:${dto.receivableId}:${gateway}`;
    const existing = await this.repo.getTransactionByIdempotency(idempotencyKey);
    if (existing) return existing;

    const amount = calcReceivableNet(rec);
    const provider = getPaymentProvider(gateway);
    const charge = await provider.createPixCharge({
      companyId: rec.companyId,
      amount,
      description: rec.description,
      receivableId: rec.id,
    });
    const tx = await this.repo.insertTransaction({
      company_id: rec.companyId,
      receivable_id: rec.id,
      subscription_id: rec.subscriptionId,
      gateway,
      external_id: charge.externalId,
      idempotency_key: idempotencyKey,
      status: 'pending',
      amount,
      qr_code: charge.qrCode,
      copy_paste: charge.copyPaste,
    });
    if (rec.status === 'open' || rec.status === 'overdue') {
      await this.repo.updateReceivable(rec.id, { status: 'pix_generated' });
    }
    await this.repo.insertOutbox({
      company_id: rec.companyId,
      aggregate_type: 'payment_transaction',
      aggregate_id: tx.id,
      event_type: PAYMENT_CREATED,
      payload: { transactionId: tx.id, receivableId: rec.id, gateway },
      status: 'pending',
    });
    this.events.emit(PAYMENT_CREATED, { transactionId: tx.id, receivableId: rec.id });
    await this.audit.log({
      companyId: rec.companyId,
      userId: user.id,
      module: 'finance',
      action: 'create_pix',
      entity: 'payment_transaction',
      entityId: tx.id,
    });
    return tx;
  }

  async handleWebhook(provider: string, headers: Record<string, string>, rawBody: string) {
    const gateway = getPaymentProvider(provider);
    if (!gateway.verifySignature(headers, rawBody)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    const hash = payloadHash(rawBody);
    const dup = await this.repo.findWebhookReceipt(provider, hash);
    if (dup) return { ok: true, duplicate: true };

    const event = await gateway.parseWebhook(headers, rawBody);
    await this.repo.insertWebhookReceipt({
      provider,
      signature: headers['x-athena-signature'] || headers['asaas-access-token'] || null,
      payload_hash: hash,
      external_id: event.externalId || null,
    });

    await this.repo.insertOutbox({
      company_id: null,
      aggregate_type: 'webhook',
      aggregate_id: null,
      event_type: `webhook.${provider}`,
      payload: { provider, ...event },
      status: 'pending',
    });

    if (event.status === 'paid' && event.externalId) {
      await this.confirmByExternalId(provider, event.externalId, event);
    }
    return { ok: true, duplicate: false };
  }

  async confirmByExternalId(
    gateway: string,
    externalId: string,
    event: { amount: number; paidAt: string | null; receivableId?: string | null },
  ) {
    let tx = await this.repo.getTransactionByExternal(gateway, externalId);
    if (!tx && event.receivableId) {
      const idempotencyKey = `pix:${event.receivableId}:${gateway}`;
      tx = await this.repo.getTransactionByIdempotency(idempotencyKey);
    }
    if (!tx) return null;
    if (tx.status === 'paid') return tx;

    const paidAt = event.paidAt || new Date().toISOString();
    const updatedTx = await this.repo.updateTransaction(tx.id, {
      status: 'paid',
      paid_at: paidAt,
    });
    if (tx.receivableId) {
      const rec = await this.repo.getReceivable(tx.receivableId);
      if (rec && rec.status !== 'paid') {
        await this.repo.updateReceivable(tx.receivableId, {
          status: 'paid',
          paid_at: paidAt,
        });
        await this.repo.insertCashMovement({
          company_id: rec.companyId,
          unit_id: rec.unitId,
          cost_center_id: rec.costCenterId,
          movement_date: paidAt.slice(0, 10),
          direction: 'in',
          amount: event.amount || calcReceivableNet(rec),
          description: `PIX ${rec.description}`,
          source_type: 'payment_transaction',
          source_id: tx.id,
        });
        const n = await this.repo.countInvoice(rec.companyId);
        await this.repo.insertInvoice({
          company_id: rec.companyId,
          receivable_id: rec.id,
          student_id: rec.studentId,
          invoice_number: `INV-${new Date().getFullYear()}-${String(n + 1).padStart(5, '0')}`,
          amount: event.amount || calcReceivableNet(rec),
          status: 'issued',
          issued_at: paidAt,
        });
        await this.emitPaymentConfirmed({
          companyId: rec.companyId,
          receivableId: rec.id,
          transactionId: tx.id,
          studentId: rec.studentId,
          subscriptionId: rec.subscriptionId,
          amount: event.amount || calcReceivableNet(rec),
          paidAt,
        });
      }
    }
    return updatedTx;
  }

  private async emitPaymentConfirmed(event: PaymentConfirmedEvent) {
    await this.repo.insertOutbox({
      company_id: event.companyId,
      aggregate_type: 'receivable',
      aggregate_id: event.receivableId,
      event_type: PAYMENT_CONFIRMED,
      payload: event,
      status: 'pending',
    });
    this.events.emit(PAYMENT_CONFIRMED, event);
  }

  async cashflow(auth: AuthContext, from?: string, to?: string) {
    const summary = await this.cashflowSummary(auth, undefined, from, to);
    return summary.points;
  }

  private resolveCashRange(
    range?: string,
    from?: string,
    to?: string,
  ): { start: string; end: string } {
    const today = new Date();
    const endDefault = today.toISOString().slice(0, 10);
    if (from && to) return { start: from.slice(0, 10), end: to.slice(0, 10) };
    const r = range || 'month';
    if (r === 'today') return { start: endDefault, end: endDefault };
    if (r === 'week') {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: start.toISOString().slice(0, 10), end: endDefault };
    }
    if (r === 'year') {
      return {
        start: `${today.getFullYear()}-01-01`,
        end: endDefault,
      };
    }
    // month
    return {
      start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
      end: endDefault,
    };
  }

  async cashflowSummary(
    auth: AuthContext,
    range?: string,
    from?: string,
    to?: string,
  ): Promise<CashflowSummary> {
    const ids = this.companyIds(auth);
    const { start, end } = this.resolveCashRange(range, from, to);
    const openingBalance = await this.repo.sumCashBefore(ids, start);
    const rows = await this.repo.listCashMovements(ids, start, end);
    const points = buildCashflow(
      rows.map((r) => ({
        date: String(r.movement_date),
        direction: r.direction as CashDirection,
        amount: Number(r.amount),
      })),
      openingBalance,
    );
    let inflow = 0;
    let outflow = 0;
    for (const r of rows) {
      if (r.direction === 'in') inflow += Number(r.amount);
      else outflow += Number(r.amount);
    }
    return {
      from: start,
      to: end,
      openingBalance,
      inflow: Math.round(inflow * 100) / 100,
      outflow: Math.round(outflow * 100) / 100,
      closingBalance: Math.round((openingBalance + inflow - outflow) * 100) / 100,
      points,
    };
  }

  async openCashSession(user: AuthUser, auth: AuthContext, dto: OpenCashSessionDto) {
    const companyId = this.primaryCompany(auth, auth.companyId);
    const unitId = dto.unitId || auth.defaultUnitId || DEV_UNIT;
    const existing = await this.repo.getOpenCashSession(companyId, unitId);
    if (existing) throw new BadRequestException('Already have an open cash session');
    const opening = dto.openingAmount ?? 0;
    return this.repo.insertCashSession({
      company_id: companyId,
      unit_id: unitId,
      operator_user_id: user.id,
      opening_amount: opening,
      expected_amount: opening,
      status: 'open',
      notes: dto.notes || null,
    });
  }

  async currentCashSession(auth: AuthContext, unitId?: string) {
    const companyId = this.primaryCompany(auth, auth.companyId);
    return this.repo.getOpenCashSession(companyId, unitId || auth.defaultUnitId || DEV_UNIT);
  }

  async sangriaCashSession(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: CashSessionAmountDto,
  ) {
    return this.addSessionMovement(user, auth, id, 'sangria', dto);
  }

  async supplyCashSession(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: CashSessionAmountDto,
  ) {
    return this.addSessionMovement(user, auth, id, 'supply', dto);
  }

  private async addSessionMovement(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    type: 'sangria' | 'supply',
    dto: CashSessionAmountDto,
  ) {
    const session = await this.repo.getCashSession(id);
    if (!session) throw new NotFoundException('Cash session not found');
    this.companyIds(auth, session.companyId);
    if (session.status !== 'open') throw new BadRequestException('Session is closed');
    const delta = type === 'sangria' ? -dto.amount : dto.amount;
    const movement = await this.repo.insertCashSessionMovement({
      session_id: id,
      company_id: session.companyId,
      movement_type: type,
      amount: dto.amount,
      notes: dto.notes || null,
      created_by: user.id,
    });
    await this.repo.insertCashMovement({
      company_id: session.companyId,
      unit_id: session.unitId,
      movement_date: new Date().toISOString().slice(0, 10),
      direction: type === 'sangria' ? 'out' : 'in',
      amount: dto.amount,
      description: type === 'sangria' ? 'Sangria de caixa' : 'Suprimento de caixa',
      source_type: 'cash_session',
      source_id: id,
    });
    const updated = await this.repo.updateCashSession(id, {
      expected_amount: Math.round((session.expectedAmount + delta) * 100) / 100,
    });
    return { session: updated, movement };
  }

  async closeCashSession(user: AuthUser, auth: AuthContext, id: string, dto: CloseCashSessionDto) {
    const session = await this.repo.getCashSession(id);
    if (!session) throw new NotFoundException('Cash session not found');
    this.companyIds(auth, session.companyId);
    if (session.status !== 'open') throw new BadRequestException('Session already closed');
    const difference = Math.round((dto.countedAmount - session.expectedAmount) * 100) / 100;
    return this.repo.updateCashSession(id, {
      status: 'closed',
      closed_at: new Date().toISOString(),
      counted_amount: dto.countedAmount,
      difference,
      notes: dto.notes ?? session.notes,
    });
  }

  async cashSessionReport(auth: AuthContext, id: string) {
    const session = await this.repo.getCashSession(id);
    if (!session) throw new NotFoundException('Cash session not found');
    this.companyIds(auth, session.companyId);
    const movements = await this.repo.listCashSessionMovements(id);
    let salesTotal = 0;
    let sangriaTotal = 0;
    let supplyTotal = 0;
    for (const m of movements) {
      if (m.movementType === 'sale') salesTotal += m.amount;
      if (m.movementType === 'sangria') sangriaTotal += m.amount;
      if (m.movementType === 'supply') supplyTotal += m.amount;
    }
    return {
      session,
      movements,
      salesTotal: Math.round(salesTotal * 100) / 100,
      sangriaTotal: Math.round(sangriaTotal * 100) / 100,
      supplyTotal: Math.round(supplyTotal * 100) / 100,
    };
  }

  async delinquency(auth: AuthContext): Promise<DelinquencyReport> {
    const ids = this.companyIds(auth);
    const today = new Date().toISOString().slice(0, 10);
    await this.repo.markOverdueReceivables(ids, today);
    const rows = await this.repo.delinquencyRows(ids, today);
    const dash = await this.repo.dashboardStats(ids);
    const byStudent = new Map<
      string,
      { amount: number; days: number; receivableIds: string[] }
    >();
    for (const r of rows) {
      if (!r.studentId) continue;
      const remaining = calcReceivableRemaining(r);
      if (remaining <= 0) continue;
      const days = Math.max(
        1,
        Math.floor((new Date(today).getTime() - new Date(r.dueDate).getTime()) / 86400000),
      );
      const cur = byStudent.get(r.studentId) || { amount: 0, days: 0, receivableIds: [] };
      cur.amount += remaining;
      cur.days = Math.max(cur.days, days);
      cur.receivableIds.push(r.id);
      byStudent.set(r.studentId, cur);
    }
    const students = await this.repo.getStudentsByIds([...byStudent.keys()]);
    const studentMap = new Map(students.map((s) => [s.id, s]));
    const items = [...byStudent.entries()]
      .map(([studentId, v]) => {
        const s = studentMap.get(studentId);
        return {
          studentId,
          studentName: s?.full_name || 'Aluno',
          phone: s?.phone || null,
          email: s?.email || null,
          daysOverdue: v.days,
          amount: Math.round(v.amount * 100) / 100,
          receivableIds: v.receivableIds,
        };
      })
      .sort((a, b) => b.amount - a.amount);
    const totalAmount = items.reduce((a, i) => a + i.amount, 0);
    return {
      count: items.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      revenueAtRiskPercent:
        dash.monthRevenue > 0
          ? Math.round((totalAmount / dash.monthRevenue) * 1000) / 10
          : 0,
      items,
    };
  }

  async dueAlerts(auth: AuthContext, daysCsv?: string): Promise<DueAlertItem[]> {
    const days = (daysCsv || '30,15,7,3,1')
      .split(',')
      .map((d) => Number(d.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0);
    const rows = await this.repo.dueAlertReceivables(
      this.companyIds(auth),
      days.length ? days : [30, 15, 7, 3, 1],
    );
    const studentIds = [...new Set(rows.map((r) => r.studentId).filter(Boolean))] as string[];
    const students = await this.repo.getStudentsByIds(studentIds);
    const map = new Map(students.map((s) => [s.id, s.full_name]));
    const today = new Date().toISOString().slice(0, 10);
    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.studentId ? map.get(r.studentId) || null : null,
      description: r.description,
      amount: calcReceivableRemaining(r),
      dueDate: r.dueDate,
      daysUntilDue: Math.floor(
        (new Date(r.dueDate).getTime() - new Date(today).getTime()) / 86400000,
      ),
    }));
  }

  async deleteCashflowDay(user: AuthUser, auth: AuthContext, date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date. Use YYYY-MM-DD');
    }
    const ids = this.companyIds(auth);
    const deleted = await this.repo.deleteCashMovementsByDate(ids, date);
    if (!deleted) throw new NotFoundException('Nenhum lançamento nesse dia');
    await this.audit.log({
      companyId: ids[0],
      userId: user.id,
      module: 'finance',
      action: 'delete_cashflow_day',
      entity: 'cash_movement',
      entityId: date,
      metadata: { deleted },
    });
    return { ok: true, deleted };
  }

  async dre(auth: AuthContext, from?: string, to?: string) {
    const ids = this.companyIds(auth);
    const start =
      from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const end = to || new Date().toISOString().slice(0, 10);
    const receivables = await this.repo.sumReceivables(ids, undefined, start, end);
    const payables = await this.repo.sumPayables(ids, start, end);
    let gross = 0;
    let discounts = 0;
    for (const r of receivables) {
      if (r.status === 'cancelled') continue;
      gross += Number(r.amount);
      discounts += Number(r.discount || 0);
    }
    let costs = 0;
    let expenses = 0;
    for (const p of payables) {
      if (p.status === 'cancelled') continue;
      // treat all payables as expenses in MVP DRE
      expenses += Number(p.amount);
    }
    return buildDre({
      from: start,
      to: end,
      grossRevenue: Math.round(gross * 100) / 100,
      discounts: Math.round(discounts * 100) / 100,
      costs: Math.round(costs * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
    });
  }

  async importReconciliation(user: AuthUser, auth: AuthContext, dto: ReconciliationImportDto) {
    const companyId = this.primaryCompany(auth, dto.companyId || auth.companyId);
    const statement = await this.repo.insertBankStatement({
      company_id: companyId,
      financial_account_id: dto.financialAccountId || null,
      source_format: dto.format,
      file_name: dto.fileName || null,
      created_by: user.id,
    });
    const lines = this.parseStatement(dto.format, dto.content);
    await this.repo.insertBankLines(
      lines.map((l) => ({
        statement_id: statement.id,
        company_id: companyId,
        posted_at: l.date,
        description: l.description,
        amount: Math.abs(l.amount),
        direction: l.amount >= 0 ? 'in' : 'out',
        fitid: l.fitid || null,
        status: 'unmatched',
      })),
    );
    const matched = await this.autoMatch(companyId);
    return { statementId: statement.id, imported: lines.length, matched };
  }

  private parseStatement(
    format: string,
    content: string,
  ): Array<{ date: string; description: string; amount: number; fitid?: string }> {
    if (format === 'csv') {
      return content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.toLowerCase().startsWith('date'))
        .map((line) => {
          const [date, description, amount] = line.split(/[,;]/);
          return {
            date: (date || '').trim().slice(0, 10),
            description: (description || '').trim(),
            amount: Number(String(amount || '0').replace(',', '.')),
          };
        })
        .filter((r) => r.date && !Number.isNaN(r.amount));
    }
    // minimal OFX: <DTPOSTED>YYYYMMDD + <TRNAMT> + <MEMO>
    const rows: Array<{ date: string; description: string; amount: number; fitid?: string }> = [];
    const blocks = content.split(/<STMTTRN>/i).slice(1);
    for (const b of blocks) {
      const dt = b.match(/<DTPOSTED>(\d{8})/i)?.[1];
      const amt = b.match(/<TRNAMT>([-\d.]+)/i)?.[1];
      const memo = b.match(/<MEMO>([^<\r\n]+)/i)?.[1] || '';
      const fitid = b.match(/<FITID>([^<\r\n]+)/i)?.[1];
      if (!dt || !amt) continue;
      rows.push({
        date: `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`,
        description: memo.trim(),
        amount: Number(amt),
        fitid,
      });
    }
    return rows;
  }

  async autoMatch(companyId: string) {
    const lines = await this.repo.listUnmatchedLines([companyId]);
    const receivables = await this.repo.listReceivables([companyId]);
    const open = receivables.filter((r) => r.status === 'open' || r.status === 'overdue');
    let matched = 0;
    for (const line of lines) {
      if (String(line.direction) !== 'in') continue;
      const amount = Number(line.amount);
      const date = String(line.posted_at);
      const hit = open.find(
        (r) =>
          Math.abs(calcReceivableNet(r) - amount) < 0.01 &&
          Math.abs(new Date(r.dueDate).getTime() - new Date(date).getTime()) <= 5 * 86400000,
      );
      if (!hit) continue;
      await this.repo.updateBankLine(String(line.id), {
        matched_receivable_id: hit.id,
        status: 'matched',
      });
      await this.repo.updateReceivable(hit.id, {
        status: 'paid',
        paid_at: new Date().toISOString(),
      });
      await this.repo.insertCashMovement({
        company_id: companyId,
        movement_date: date,
        direction: 'in',
        amount,
        description: `Conciliação ${hit.description}`,
        source_type: 'bank_statement_line',
        source_id: line.id,
      });
      matched += 1;
      open.splice(open.indexOf(hit), 1);
    }
    return matched;
  }

  /** Called from ContractSigned — creates subscription + first receivable (+ enrollment fee) */
  async onContractSigned(payload: ContractSignedEvent) {
    if (!payload.studentId || !payload.planId) return null;
    const plan = await this.repo.getPlan(payload.planId);
    if (!plan) return null;
    const amount = Number(plan.price);
    const enrollmentFee = Number(plan.enrollment_fee || 0);
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + Number(plan.duration_days || 30));
    const sub = await this.repo.insertSubscription({
      company_id: payload.companyId,
      student_id: payload.studentId,
      plan_id: payload.planId,
      enrollment_id: payload.enrollmentId,
      contract_id: payload.contractId,
      gateway: 'stub',
      recurrence: 'monthly',
      next_due_date: nextDue.toISOString().slice(0, 10),
      amount,
      status: 'active',
    });
    const due = new Date().toISOString().slice(0, 10);
    const rec = await this.repo.insertReceivable({
      company_id: payload.companyId,
      student_id: payload.studentId,
      enrollment_id: payload.enrollmentId,
      plan_id: payload.planId,
      contract_id: payload.contractId,
      subscription_id: sub.id,
      description: `Mensalidade ${String(plan.name)}`,
      amount,
      due_date: due,
      competence_month: `${due.slice(0, 8)}01`,
      status: 'open',
    });
    let feeRec = null;
    if (enrollmentFee > 0) {
      feeRec = await this.repo.insertReceivable({
        company_id: payload.companyId,
        student_id: payload.studentId,
        enrollment_id: payload.enrollmentId,
        plan_id: payload.planId,
        contract_id: payload.contractId,
        subscription_id: sub.id,
        description: `Taxa de matrícula ${String(plan.name)}`,
        amount: enrollmentFee,
        due_date: due,
        competence_month: `${due.slice(0, 8)}01`,
        status: 'open',
      });
    }
    await this.repo.insertOutbox({
      company_id: payload.companyId,
      aggregate_type: 'subscription',
      aggregate_id: sub.id,
      event_type: SUBSCRIPTION_CREATED,
      payload: {
        ...payload,
        subscriptionId: sub.id,
        receivableId: rec.id,
        enrollmentFeeReceivableId: feeRec?.id || null,
      },
      status: 'pending',
    });
    this.events.emit(SUBSCRIPTION_CREATED, {
      companyId: payload.companyId,
      subscriptionId: sub.id,
      studentId: payload.studentId,
      planId: payload.planId,
      contractId: payload.contractId,
    });
    return { subscription: sub, receivable: rec, enrollmentFeeReceivable: feeRec };
  }

  /** Used by SalesService.renewEnrollment — keeps finance as source of truth */
  async createReceivableForEnrollmentRenewal(input: {
    companyId: string;
    unitId?: string | null;
    studentId: string;
    enrollmentId: string;
    planId: string;
    planName: string;
    amount: number;
    dueDate: string;
    createdBy?: string;
    description?: string;
  }) {
    const rec = await this.repo.insertReceivable({
      company_id: input.companyId,
      unit_id: input.unitId || DEV_UNIT,
      student_id: input.studentId,
      enrollment_id: input.enrollmentId,
      plan_id: input.planId,
      description: input.description || `Renovação — ${input.planName}`,
      amount: input.amount,
      due_date: input.dueDate.slice(0, 10),
      competence_month: `${input.dueDate.slice(0, 8)}01`,
      status: 'open',
      created_by: input.createdBy || null,
    });
    const existing = await this.repo.findActiveSubscription(input.companyId, input.studentId);
    if (existing && !input.description) {
      const next = new Date(input.dueDate);
      next.setMonth(next.getMonth() + 1);
      await this.repo.updateSubscription(existing.id, {
        next_due_date: next.toISOString().slice(0, 10),
        amount: input.amount,
        enrollment_id: input.enrollmentId,
        plan_id: input.planId,
      });
    }
    return rec;
  }

  async renewDueSubscriptions(asOf = new Date().toISOString().slice(0, 10)) {
    const due = await this.repo.dueSubscriptions(asOf);
    const created = [];
    for (const sub of due) {
      const plan = await this.repo.getPlan(sub.planId);
      const rec = await this.repo.insertReceivable({
        company_id: sub.companyId,
        unit_id: sub.unitId,
        student_id: sub.studentId,
        enrollment_id: sub.enrollmentId,
        plan_id: sub.planId,
        contract_id: sub.contractId,
        subscription_id: sub.id,
        description: `Renovação ${plan ? String(plan.name) : 'assinatura'}`,
        amount: sub.amount,
        due_date: asOf,
        status: 'open',
      });
      const next = new Date(asOf);
      if (sub.recurrence === 'yearly') next.setFullYear(next.getFullYear() + 1);
      else if (sub.recurrence === 'weekly') next.setDate(next.getDate() + 7);
      else if (sub.recurrence === 'quarterly') next.setMonth(next.getMonth() + 3);
      else next.setMonth(next.getMonth() + 1);
      await this.repo.updateSubscription(sub.id, {
        next_due_date: next.toISOString().slice(0, 10),
      });
      await this.repo.insertOutbox({
        company_id: sub.companyId,
        aggregate_type: 'subscription',
        aggregate_id: sub.id,
        event_type: SUBSCRIPTION_RENEWED,
        payload: { subscriptionId: sub.id, receivableId: rec.id },
        status: 'pending',
      });
      this.events.emit(SUBSCRIPTION_RENEWED, { subscriptionId: sub.id, receivableId: rec.id });
      created.push(rec);
    }
    return created;
  }

  /** Loja cost center for PDV / purchases (seed G-5). */
  async resolveLojaCostCenterId(companyId: string): Promise<string | null> {
    const centers = await this.repo.listCostCenters([companyId]);
    const loja = centers.find((c) => /loja/i.test(c.name));
    return loja?.id || centers[0]?.id || null;
  }

  /**
   * PDV sale payment: creates receivable + receives immediately (cash/card/pix/voucher)
   * or leaves receivable open for internal_credit.
   */
  async registerPosSalePayment(
    user: AuthUser,
    auth: AuthContext,
    input: {
      studentId?: string | null;
      description: string;
      amount: number;
      discount?: number;
      unitId?: string | null;
      paymentMethod: 'pix' | 'card' | 'cash' | 'internal_credit' | 'voucher';
      notes?: string;
    },
  ) {
    const companyId = this.primaryCompany(auth, auth.companyId);
    const costCenterId = await this.resolveLojaCostCenterId(companyId);
    const today = new Date().toISOString().slice(0, 10);
    const rec = await this.createReceivable(user, auth, {
      description: input.description,
      amount: input.amount,
      discount: input.discount || 0,
      dueDate: today,
      studentId: input.studentId || undefined,
      unitId: input.unitId || auth.defaultUnitId || DEV_UNIT,
      costCenterId: costCenterId || undefined,
      notes: input.notes || `PDV:${input.paymentMethod}`,
    });

    if (input.paymentMethod === 'internal_credit') {
      return { receivable: rec, paid: false };
    }

    const paid = await this.receiveManual(user, auth, rec.id, {});
    return { receivable: paid, paid: true };
  }

  async createPayableForPurchase(
    user: AuthUser,
    auth: AuthContext,
    input: {
      supplierId: string;
      description: string;
      amount: number;
      unitId?: string | null;
      dueDate?: string;
      notes?: string;
    },
  ) {
    const costCenterId = await this.resolveLojaCostCenterId(
      this.primaryCompany(auth, auth.companyId),
    );
    const due =
      input.dueDate ||
      new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    return this.createPayable(user, auth, {
      description: input.description,
      amount: input.amount,
      dueDate: due,
      supplierId: input.supplierId,
      unitId: input.unitId || auth.defaultUnitId || DEV_UNIT,
      costCenterId: costCenterId || undefined,
      category: 'estoque',
      notes: input.notes,
    });
  }
}
