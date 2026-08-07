import { Injectable } from '@nestjs/common';
import type {
  CashSession,
  CashSessionMovement,
  CostCenter,
  FinanceDashboard,
  FinanceSubscription,
  FinancialAccount,
  Payable,
  PaymentMethod,
  PaymentTransaction,
  Receivable,
  Supplier,
} from '@movvo/shared';
import { calcFinancialHealth, resolveReceivableDisplayStatus } from '@movvo/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FinanceRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  mapAccount(row: Record<string, unknown>): FinancialAccount {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      bankName: String(row.bank_name),
      agency: (row.agency as string) || null,
      account: (row.account as string) || null,
      pixKey: (row.pix_key as string) || null,
      status: String(row.status),
    };
  }

  mapCostCenter(row: Record<string, unknown>): CostCenter {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      description: (row.description as string) || null,
      category: (row.category as string) || null,
      active: Boolean(row.active),
    };
  }

  mapMethod(row: Record<string, unknown>): PaymentMethod {
    return {
      id: String(row.id),
      companyId: row.company_id ? String(row.company_id) : null,
      name: String(row.name),
      slug: String(row.slug),
      isSystem: Boolean(row.is_system),
      active: Boolean(row.active),
    };
  }

  mapSupplier(row: Record<string, unknown>): Supplier {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      document: (row.document as string) || null,
      email: (row.email as string) || null,
      phone: (row.phone as string) || null,
      active: Boolean(row.active),
    };
  }

  mapSubscription(row: Record<string, unknown>): FinanceSubscription {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      studentId: String(row.student_id),
      planId: String(row.plan_id),
      enrollmentId: row.enrollment_id ? String(row.enrollment_id) : null,
      contractId: row.contract_id ? String(row.contract_id) : null,
      gateway: String(row.gateway),
      recurrence: String(row.recurrence),
      nextDueDate: row.next_due_date ? String(row.next_due_date) : null,
      amount: Number(row.amount),
      status: String(row.status),
      createdAt: String(row.created_at),
    };
  }

  mapReceivable(row: Record<string, unknown>): Receivable {
    const status = String(row.status);
    const dueDate = String(row.due_date);
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      studentId: row.student_id ? String(row.student_id) : null,
      enrollmentId: row.enrollment_id ? String(row.enrollment_id) : null,
      planId: row.plan_id ? String(row.plan_id) : null,
      trainerId: row.trainer_id ? String(row.trainer_id) : null,
      contractId: row.contract_id ? String(row.contract_id) : null,
      subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
      costCenterId: row.cost_center_id ? String(row.cost_center_id) : null,
      paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : null,
      cashSessionId: row.cash_session_id ? String(row.cash_session_id) : null,
      cashierUserId: row.cashier_user_id ? String(row.cashier_user_id) : null,
      description: String(row.description),
      amount: Number(row.amount),
      discount: Number(row.discount || 0),
      addition: Number(row.addition || 0),
      interest: Number(row.interest || 0),
      fine: Number(row.fine || 0),
      amountPaid: Number(row.amount_paid || 0),
      dueDate,
      paidAt: row.paid_at ? String(row.paid_at) : null,
      status,
      competenceMonth: row.competence_month ? String(row.competence_month) : null,
      notes: row.notes ? String(row.notes) : null,
      createdAt: String(row.created_at),
      studentName: row.student_name ? String(row.student_name) : null,
      studentPhone: row.student_phone ? String(row.student_phone) : null,
      planName: row.plan_name ? String(row.plan_name) : null,
    };
  }

  mapPayable(row: Record<string, unknown>): Payable {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      supplierId: row.supplier_id ? String(row.supplier_id) : null,
      costCenterId: row.cost_center_id ? String(row.cost_center_id) : null,
      description: String(row.description),
      amount: Number(row.amount),
      category: String(row.category || 'outros'),
      competenceMonth: row.competence_month ? String(row.competence_month) : null,
      installmentLabel: row.installment_label ? String(row.installment_label) : null,
      notes: row.notes ? String(row.notes) : null,
      attachmentUrl: row.attachment_url ? String(row.attachment_url) : null,
      dueDate: String(row.due_date),
      paidAt: row.paid_at ? String(row.paid_at) : null,
      status: String(row.status),
      createdAt: String(row.created_at),
      supplierName: row.supplier_name ? String(row.supplier_name) : null,
    };
  }

  mapTx(row: Record<string, unknown>): PaymentTransaction {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      receivableId: row.receivable_id ? String(row.receivable_id) : null,
      subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
      paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : null,
      cashSessionId: row.cash_session_id ? String(row.cash_session_id) : null,
      gateway: String(row.gateway),
      externalId: row.external_id ? String(row.external_id) : null,
      idempotencyKey: String(row.idempotency_key),
      status: String(row.status),
      amount: Number(row.amount),
      paidAt: row.paid_at ? String(row.paid_at) : null,
      qrCode: (row.qr_code as string) || null,
      copyPaste: (row.copy_paste as string) || null,
      nsu: row.nsu ? String(row.nsu) : null,
      authorizationCode: row.authorization_code ? String(row.authorization_code) : null,
      cardBrand: row.card_brand ? String(row.card_brand) : null,
      installments: Number(row.installments || 1),
      createdAt: String(row.created_at),
    };
  }

  mapCashSession(row: Record<string, unknown>): CashSession {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      operatorUserId: String(row.operator_user_id),
      openedAt: String(row.opened_at),
      closedAt: row.closed_at ? String(row.closed_at) : null,
      openingAmount: Number(row.opening_amount || 0),
      expectedAmount: Number(row.expected_amount || 0),
      countedAmount: row.counted_amount != null ? Number(row.counted_amount) : null,
      difference: row.difference != null ? Number(row.difference) : null,
      status: String(row.status),
      notes: row.notes ? String(row.notes) : null,
    };
  }

  mapCashSessionMovement(row: Record<string, unknown>): CashSessionMovement {
    return {
      id: String(row.id),
      sessionId: String(row.session_id),
      companyId: String(row.company_id),
      movementType: String(row.movement_type),
      amount: Number(row.amount),
      paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : null,
      receivableId: row.receivable_id ? String(row.receivable_id) : null,
      notes: row.notes ? String(row.notes) : null,
      createdBy: row.created_by ? String(row.created_by) : null,
      createdAt: String(row.created_at),
    };
  }

  async listAccounts(companyIds: string[]) {
    const { data, error } = await this.admin()
      .from('financial_accounts')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('bank_name');
    if (error) throw error;
    return (data || []).map((r) => this.mapAccount(r as Record<string, unknown>));
  }

  async insertAccount(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('financial_accounts').insert(row).select('*').single();
    if (error) throw error;
    return this.mapAccount(data as Record<string, unknown>);
  }

  async getAccount(id: string) {
    const { data, error } = await this.admin()
      .from('financial_accounts')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapAccount(data as Record<string, unknown>) : null;
  }

  async updateAccount(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('financial_accounts')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapAccount(data as Record<string, unknown>);
  }

  async listCostCenters(companyIds: string[]) {
    const { data, error } = await this.admin()
      .from('cost_centers')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapCostCenter(r as Record<string, unknown>));
  }

  async insertCostCenter(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('cost_centers').insert(row).select('*').single();
    if (error) throw error;
    return this.mapCostCenter(data as Record<string, unknown>);
  }

  async updateCostCenter(id: string, companyIds: string[], patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('cost_centers')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapCostCenter(data as Record<string, unknown>);
  }

  async softDeleteCostCenter(id: string, companyIds: string[]) {
    const { error } = await this.admin()
      .from('cost_centers')
      .update({ deleted_at: new Date().toISOString(), active: false })
      .eq('id', id)
      .in('company_id', companyIds);
    if (error) throw error;
    return { ok: true };
  }

  async listMethods() {
    const { data, error } = await this.admin()
      .from('payment_methods')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapMethod(r as Record<string, unknown>));
  }

  async listReceivables(
    companyIds: string[],
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
    let q = this.admin()
      .from('receivables')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('due_date', { ascending: false });
    if (filters?.studentId) q = q.eq('student_id', filters.studentId);
    if (filters?.planId) q = q.eq('plan_id', filters.planId);
    if (filters?.paymentMethodId) q = q.eq('payment_method_id', filters.paymentMethodId);
    if (filters?.trainerId) q = q.eq('trainer_id', filters.trainerId);
    if (filters?.unitId) q = q.eq('unit_id', filters.unitId);
    if (filters?.from) q = q.gte('due_date', filters.from);
    if (filters?.to) q = q.lte('due_date', filters.to);
    if (filters?.status && !['due_today', 'overdue'].includes(filters.status)) {
      q = q.eq('status', filters.status);
    }
    const { data, error } = await q;
    if (error) throw error;
    let items = (data || []).map((r) => this.mapReceivable(r as Record<string, unknown>));
    const today = new Date().toISOString().slice(0, 10);
    items = items.map((r) => ({
      ...r,
      displayStatus: resolveReceivableDisplayStatus(r.status, r.dueDate, today),
    }));
    if (filters?.status === 'due_today') {
      items = items.filter((r) => r.displayStatus === 'due_today');
    } else if (filters?.status === 'overdue') {
      items = items.filter((r) => r.displayStatus === 'overdue');
    }
    const studentIds = [...new Set(items.map((i) => i.studentId).filter(Boolean))] as string[];
    const planIds = [...new Set(items.map((i) => i.planId).filter(Boolean))] as string[];
    const studentMap = new Map<string, { name: string; phone: string | null }>();
    const planMap = new Map<string, string>();
    if (studentIds.length) {
      const { data: students } = await this.admin()
        .from('students')
        .select('id, full_name, phone')
        .in('id', studentIds);
      for (const s of students || []) {
        studentMap.set(String(s.id), {
          name: String(s.full_name),
          phone: s.phone ? String(s.phone) : null,
        });
      }
    }
    if (planIds.length) {
      const { data: plans } = await this.admin().from('plans').select('id, name').in('id', planIds);
      for (const p of plans || []) planMap.set(String(p.id), String(p.name));
    }
    return items.map((r) => ({
      ...r,
      studentName: r.studentId ? studentMap.get(r.studentId)?.name || null : null,
      studentPhone: r.studentId ? studentMap.get(r.studentId)?.phone || null : null,
      planName: r.planId ? planMap.get(r.planId) || null : null,
    }));
  }

  async getReceivable(id: string) {
    const { data, error } = await this.admin().from('receivables').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? this.mapReceivable(data as Record<string, unknown>) : null;
  }

  async insertReceivable(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('receivables').insert(row).select('*').single();
    if (error) throw error;
    return this.mapReceivable(data as Record<string, unknown>);
  }

  async updateReceivable(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('receivables')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapReceivable(data as Record<string, unknown>);
  }

  async listPayables(companyIds: string[]) {
    const { data, error } = await this.admin()
      .from('payables')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('due_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapPayable(r as Record<string, unknown>));
  }

  async getPayable(id: string) {
    const { data, error } = await this.admin().from('payables').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? this.mapPayable(data as Record<string, unknown>) : null;
  }

  async insertPayable(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('payables').insert(row).select('*').single();
    if (error) throw error;
    return this.mapPayable(data as Record<string, unknown>);
  }

  async updatePayable(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('payables')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapPayable(data as Record<string, unknown>);
  }

  async insertSupplier(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('suppliers').insert(row).select('*').single();
    if (error) throw error;
    return this.mapSupplier(data as Record<string, unknown>);
  }

  async listSubscriptions(companyIds: string[], studentId?: string) {
    let q = this.admin()
      .from('subscriptions')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapSubscription(r as Record<string, unknown>));
  }

  async getSubscription(id: string) {
    const { data, error } = await this.admin().from('subscriptions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? this.mapSubscription(data as Record<string, unknown>) : null;
  }

  async insertSubscription(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('subscriptions').insert(row).select('*').single();
    if (error) throw error;
    return this.mapSubscription(data as Record<string, unknown>);
  }

  async updateSubscription(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('subscriptions')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapSubscription(data as Record<string, unknown>);
  }

  async getPlan(id: string) {
    const { data, error } = await this.admin().from('plans').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  }

  async findPlanByName(companyId: string, name: string) {
    const { data, error } = await this.admin()
      .from('plans')
      .select('*')
      .eq('company_id', companyId)
      .ilike('name', name.trim())
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  }

  async findActiveSubscription(companyId: string, studentId: string) {
    const { data, error } = await this.admin()
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .in('status', ['active', 'past_due', 'paused'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapSubscription(data as Record<string, unknown>) : null;
  }

  async listStudentsWithPlan(companyIds: string[]) {
    const { data, error } = await this.admin()
      .from('students')
      .select('id, company_id, unit_id, plan_name, full_name')
      .in('company_id', companyIds)
      .not('plan_name', 'is', null)
      .neq('plan_name', '')
      .is('deleted_at', null);
    if (error) throw error;
    return (data || []) as Array<{
      id: string;
      company_id: string;
      unit_id: string | null;
      plan_name: string;
      full_name: string;
    }>;
  }

  async getStudentName(id: string) {
    const { data, error } = await this.admin()
      .from('students')
      .select('full_name, plan_name')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as { full_name: string; plan_name: string | null } | null;
  }

  async insertTransaction(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('payment_transactions')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapTx(data as Record<string, unknown>);
  }

  async getTransactionByExternal(gateway: string, externalId: string) {
    const { data, error } = await this.admin()
      .from('payment_transactions')
      .select('*')
      .eq('gateway', gateway)
      .eq('external_id', externalId)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapTx(data as Record<string, unknown>) : null;
  }

  async getTransactionByIdempotency(key: string) {
    const { data, error } = await this.admin()
      .from('payment_transactions')
      .select('*')
      .eq('idempotency_key', key)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapTx(data as Record<string, unknown>) : null;
  }

  async updateTransaction(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('payment_transactions')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapTx(data as Record<string, unknown>);
  }

  async insertCashMovement(row: Record<string, unknown>) {
    const { error } = await this.admin().from('cash_movements').insert(row);
    if (error) throw error;
  }

  async listCashMovements(companyIds: string[], from: string, to: string) {
    const { data, error } = await this.admin()
      .from('cash_movements')
      .select('*')
      .in('company_id', companyIds)
      .gte('movement_date', from)
      .lte('movement_date', to)
      .order('movement_date');
    if (error) throw error;
    return (data || []) as Array<Record<string, unknown>>;
  }

  async deleteCashMovementsByDate(companyIds: string[], date: string) {
    const { data, error } = await this.admin()
      .from('cash_movements')
      .delete()
      .in('company_id', companyIds)
      .eq('movement_date', date)
      .select('id');
    if (error) throw error;
    return (data || []).length;
  }

  async insertOutbox(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('outbox_events').insert(row).select('*').single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async insertWebhookReceipt(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('webhook_receipts').insert(row).select('*').single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async findWebhookReceipt(provider: string, hash: string) {
    const { data, error } = await this.admin()
      .from('webhook_receipts')
      .select('*')
      .eq('provider', provider)
      .eq('payload_hash', hash)
      .maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  }

  async insertBankStatement(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('bank_statements').insert(row).select('*').single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async insertBankLines(rows: Record<string, unknown>[]) {
    if (!rows.length) return;
    const { error } = await this.admin().from('bank_statement_lines').insert(rows);
    if (error) throw error;
  }

  async listUnmatchedLines(companyIds: string[]) {
    const { data, error } = await this.admin()
      .from('bank_statement_lines')
      .select('*')
      .in('company_id', companyIds)
      .eq('status', 'unmatched');
    if (error) throw error;
    return (data || []) as Array<Record<string, unknown>>;
  }

  async updateBankLine(id: string, patch: Record<string, unknown>) {
    const { error } = await this.admin().from('bank_statement_lines').update(patch).eq('id', id);
    if (error) throw error;
  }

  async sumReceivables(companyIds: string[], status?: string, from?: string, to?: string) {
    let q = this.admin()
      .from('receivables')
      .select('amount, discount, addition, interest, fine, amount_paid, status, due_date, paid_at')
      .in('company_id', companyIds)
      .is('deleted_at', null);
    if (status) q = q.eq('status', status);
    if (from) q = q.gte('due_date', from);
    if (to) q = q.lte('due_date', to);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as Array<Record<string, unknown>>;
  }

  async sumPayables(companyIds: string[], from: string, to: string) {
    const { data, error } = await this.admin()
      .from('payables')
      .select('amount, status, due_date, paid_at')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .gte('due_date', from)
      .lte('due_date', to);
    if (error) throw error;
    return (data || []) as Array<Record<string, unknown>>;
  }

  async countInvoice(companyId: string) {
    const { count, error } = await this.admin()
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);
    if (error) throw error;
    return count || 0;
  }

  async insertInvoice(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('invoices').insert(row).select('*').single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async dashboardStats(companyIds: string[]): Promise<FinanceDashboard> {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    const rows = await this.sumReceivables(companyIds, undefined, from, to);
    const payables = await this.sumPayables(companyIds, from, to);
    let monthRevenue = 0;
    let received = 0;
    let toReceive = 0;
    let overdue = 0;
    let openTotal = 0;
    let receivedToday = 0;
    let paidCount = 0;
    for (const r of rows) {
      const net =
        Number(r.amount) -
        Number(r.discount || 0) +
        Number(r.addition || 0) +
        Number(r.interest || 0) +
        Number(r.fine || 0);
      monthRevenue += net;
      if (r.status === 'paid') {
        received += net;
        paidCount += 1;
        if (r.paid_at && String(r.paid_at).slice(0, 10) === today) receivedToday += net;
      }
      if (r.status === 'open' || r.status === 'overdue' || r.status === 'partial' || r.status === 'pix_generated') {
        const remaining = Math.max(0, net - Number(r.amount_paid || 0));
        toReceive += remaining;
        openTotal += remaining;
        if (String(r.due_date) < today) overdue += remaining;
      }
    }
    let expenses = 0;
    for (const p of payables) {
      if (p.status === 'cancelled') continue;
      expenses += Number(p.amount);
    }
    const movements = await this.listCashMovements(companyIds, from, to);
    let cash = 0;
    for (const m of movements) {
      cash += m.direction === 'in' ? Number(m.amount) : -Number(m.amount);
    }
    const { data: subs } = await this.admin()
      .from('subscriptions')
      .select('amount, status')
      .in('company_id', companyIds)
      .eq('status', 'active')
      .is('deleted_at', null);
    const mrr = (subs || []).reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const profit = Math.round((received - expenses) * 100) / 100;
    const delinquencyRate =
      openTotal > 0 ? Math.round((overdue / openTotal) * 1000) / 10 : 0;
    const health = calcFinancialHealth({
      monthRevenue,
      delinquencyRate,
      cashflowBalance: cash,
      expenses,
      profit,
    });
    return {
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      received: Math.round(received * 100) / 100,
      toReceive: Math.round(toReceive * 100) / 100,
      delinquencyRate,
      cashflowBalance: Math.round(cash * 100) / 100,
      profit,
      expenses: Math.round(expenses * 100) / 100,
      averageTicket: paidCount > 0 ? Math.round((received / paidCount) * 100) / 100 : 0,
      mrr: Math.round(mrr * 100) / 100,
      receivedToday: Math.round(receivedToday * 100) / 100,
      cashSessionBalance: Math.round(cash * 100) / 100,
      health,
    };
  }

  async dueSubscriptions(beforeDate: string) {
    const { data, error } = await this.admin()
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .is('deleted_at', null)
      .lte('next_due_date', beforeDate);
    if (error) throw error;
    return (data || []).map((r) => this.mapSubscription(r as Record<string, unknown>));
  }

  async markOverdueReceivables(companyIds: string[], today: string) {
    const { data, error } = await this.admin()
      .from('receivables')
      .update({ status: 'overdue' })
      .in('company_id', companyIds)
      .in('status', ['open', 'partial', 'pix_generated'])
      .lt('due_date', today)
      .is('deleted_at', null)
      .select('id');
    if (error) throw error;
    return (data || []).length;
  }

  async getOpenCashSession(companyId: string, unitId: string | null) {
    let q = this.admin()
      .from('cash_sessions')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1);
    if (unitId) q = q.eq('unit_id', unitId);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data ? this.mapCashSession(data as Record<string, unknown>) : null;
  }

  async getCashSession(id: string) {
    const { data, error } = await this.admin().from('cash_sessions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? this.mapCashSession(data as Record<string, unknown>) : null;
  }

  async insertCashSession(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('cash_sessions').insert(row).select('*').single();
    if (error) throw error;
    return this.mapCashSession(data as Record<string, unknown>);
  }

  async updateCashSession(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('cash_sessions')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapCashSession(data as Record<string, unknown>);
  }

  async insertCashSessionMovement(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('cash_session_movements')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapCashSessionMovement(data as Record<string, unknown>);
  }

  async listCashSessionMovements(sessionId: string) {
    const { data, error } = await this.admin()
      .from('cash_session_movements')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');
    if (error) throw error;
    return (data || []).map((r) => this.mapCashSessionMovement(r as Record<string, unknown>));
  }

  async sumCashBefore(companyIds: string[], beforeDate: string) {
    const { data, error } = await this.admin()
      .from('cash_movements')
      .select('direction, amount')
      .in('company_id', companyIds)
      .lt('movement_date', beforeDate);
    if (error) throw error;
    let bal = 0;
    for (const m of data || []) {
      bal += m.direction === 'in' ? Number(m.amount) : -Number(m.amount);
    }
    return Math.round(bal * 100) / 100;
  }

  async delinquencyRows(companyIds: string[], today: string) {
    const { data, error } = await this.admin()
      .from('receivables')
      .select('*')
      .in('company_id', companyIds)
      .in('status', ['open', 'overdue', 'partial', 'pix_generated'])
      .lt('due_date', today)
      .is('deleted_at', null);
    if (error) throw error;
    return (data || []).map((r) => this.mapReceivable(r as Record<string, unknown>));
  }

  async getStudentsByIds(ids: string[]) {
    if (!ids.length) return [];
    const { data, error } = await this.admin()
      .from('students')
      .select('id, full_name, phone, email')
      .in('id', ids);
    if (error) throw error;
    return (data || []) as Array<{
      id: string;
      full_name: string;
      phone: string | null;
      email: string | null;
    }>;
  }

  async dueAlertReceivables(companyIds: string[], days: number[]) {
    const today = new Date();
    const targets = new Set(
      days.map((d) => {
        const dt = new Date(today);
        dt.setDate(dt.getDate() + d);
        return dt.toISOString().slice(0, 10);
      }),
    );
    const maxDay = Math.max(...days, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + maxDay);
    const { data, error } = await this.admin()
      .from('receivables')
      .select('*')
      .in('company_id', companyIds)
      .in('status', ['open', 'partial', 'pix_generated', 'overdue'])
      .gte('due_date', today.toISOString().slice(0, 10))
      .lte('due_date', end.toISOString().slice(0, 10))
      .is('deleted_at', null)
      .order('due_date');
    if (error) throw error;
    return (data || [])
      .map((r) => this.mapReceivable(r as Record<string, unknown>))
      .filter((r) => targets.has(r.dueDate));
  }
}
