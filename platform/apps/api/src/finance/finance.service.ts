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
  splitInstallments,
  type AuthContext,
  type CashDirection,
} from '@athenas/shared';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { ContractSignedEvent } from '../sales/events/sales.events';
import {
  CreateAccountDto,
  CreateCostCenterDto,
  CreatePayableDto,
  CreatePixDto,
  CreateReceivableDto,
  CreateSubscriptionDto,
  InstallmentsDto,
  ReconciliationImportDto,
  RenegotiateDto,
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

  listCostCenters(auth: AuthContext) {
    return this.repo.listCostCenters(this.companyIds(auth));
  }

  async createCostCenter(auth: AuthContext, dto: CreateCostCenterDto) {
    const companyId = this.primaryCompany(auth, dto.companyId || auth.companyId);
    return this.repo.insertCostCenter({
      company_id: companyId,
      name: dto.name,
      description: dto.description || null,
      active: true,
    });
  }

  listMethods() {
    return this.repo.listMethods();
  }

  listReceivables(auth: AuthContext) {
    return this.repo.listReceivables(this.companyIds(auth));
  }

  async createReceivable(user: AuthUser, auth: AuthContext, dto: CreateReceivableDto) {
    const companyId = this.primaryCompany(auth, dto.companyId || auth.companyId);
    const due = dto.dueDate.slice(0, 10);
    const rec = await this.repo.insertReceivable({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId || DEV_UNIT,
      student_id: dto.studentId || null,
      contract_id: dto.contractId || null,
      subscription_id: dto.subscriptionId || null,
      cost_center_id: dto.costCenterId || null,
      description: dto.description,
      amount: dto.amount,
      discount: dto.discount || 0,
      due_date: due,
      competence_month: `${due.slice(0, 8)}01`,
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
    return rec;
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
      interest: dto.interest ?? existing.interest,
      fine: dto.fine ?? existing.fine,
      status: dto.status ?? existing.status,
    });
  }

  async receiveManual(user: AuthUser, auth: AuthContext, id: string) {
    const rec = await this.repo.getReceivable(id);
    if (!rec) throw new NotFoundException('Receivable not found');
    this.companyIds(auth, rec.companyId);
    if (rec.status === 'paid') throw new BadRequestException('Already paid');
    const paidAt = new Date().toISOString();
    const amount = calcReceivableNet(rec);
    const updated = await this.repo.updateReceivable(id, {
      status: 'paid',
      paid_at: paidAt,
    });
    await this.repo.insertCashMovement({
      company_id: rec.companyId,
      unit_id: rec.unitId,
      cost_center_id: rec.costCenterId,
      movement_date: paidAt.slice(0, 10),
      direction: 'in',
      amount,
      description: `Recebimento ${rec.description}`,
      source_type: 'receivable',
      source_id: id,
    });
    await this.emitPaymentConfirmed({
      companyId: rec.companyId,
      receivableId: id,
      transactionId: id,
      studentId: rec.studentId,
      subscriptionId: rec.subscriptionId,
      amount,
      paidAt,
    });
    await this.audit.log({
      companyId: rec.companyId,
      userId: user.id,
      module: 'finance',
      action: 'receive',
      entity: 'receivable',
      entityId: id,
    });
    return updated;
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
    const pay = await this.repo.insertPayable({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId || DEV_UNIT,
      supplier_id: supplierId,
      cost_center_id: dto.costCenterId || null,
      description: dto.description,
      amount: dto.amount,
      due_date: dto.dueDate.slice(0, 10),
      status: 'open',
      created_by: user.id,
    });
    return pay;
  }

  async payPayable(user: AuthUser, auth: AuthContext, id: string) {
    const pay = await this.repo.getPayable(id);
    if (!pay) throw new NotFoundException('Payable not found');
    this.companyIds(auth, pay.companyId);
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

  listSubscriptions(auth: AuthContext) {
    return this.repo.listSubscriptions(this.companyIds(auth));
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
      signature: headers['x-athenas-signature'] || headers['asaas-access-token'] || null,
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
    const ids = this.companyIds(auth);
    const start =
      from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const end = to || new Date().toISOString().slice(0, 10);
    const rows = await this.repo.listCashMovements(ids, start, end);
    return buildCashflow(
      rows.map((r) => ({
        date: String(r.movement_date),
        direction: r.direction as CashDirection,
        amount: Number(r.amount),
      })),
    );
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

  /** Called from ContractSigned — creates subscription + first receivable */
  async onContractSigned(payload: ContractSignedEvent) {
    if (!payload.studentId || !payload.planId) return null;
    const plan = await this.repo.getPlan(payload.planId);
    if (!plan) return null;
    const amount = Number(plan.price);
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 30);
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
      contract_id: payload.contractId,
      subscription_id: sub.id,
      description: `Mensalidade ${String(plan.name)}`,
      amount,
      due_date: due,
      competence_month: `${due.slice(0, 8)}01`,
      status: 'open',
    });
    await this.repo.insertOutbox({
      company_id: payload.companyId,
      aggregate_type: 'subscription',
      aggregate_id: sub.id,
      event_type: SUBSCRIPTION_CREATED,
      payload: { ...payload, subscriptionId: sub.id, receivableId: rec.id },
      status: 'pending',
    });
    this.events.emit(SUBSCRIPTION_CREATED, {
      companyId: payload.companyId,
      subscriptionId: sub.id,
      studentId: payload.studentId,
      planId: payload.planId,
      contractId: payload.contractId,
    });
    return { subscription: sub, receivable: rec };
  }

  async renewDueSubscriptions(asOf = new Date().toISOString().slice(0, 10)) {
    const due = await this.repo.dueSubscriptions(asOf);
    const created = [];
    for (const sub of due) {
      const rec = await this.repo.insertReceivable({
        company_id: sub.companyId,
        unit_id: sub.unitId,
        student_id: sub.studentId,
        contract_id: sub.contractId,
        subscription_id: sub.id,
        description: `Renovação assinatura`,
        amount: sub.amount,
        due_date: asOf,
        status: 'open',
      });
      const next = new Date(asOf);
      if (sub.recurrence === 'yearly') next.setFullYear(next.getFullYear() + 1);
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
}
