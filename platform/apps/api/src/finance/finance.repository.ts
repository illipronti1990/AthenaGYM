import { Injectable } from '@nestjs/common';
import type {
  CostCenter,
  FinanceDashboard,
  FinanceSubscription,
  FinancialAccount,
  Payable,
  PaymentMethod,
  PaymentTransaction,
  Receivable,
  Supplier,
} from '@athena/shared';
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
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      studentId: row.student_id ? String(row.student_id) : null,
      contractId: row.contract_id ? String(row.contract_id) : null,
      subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
      costCenterId: row.cost_center_id ? String(row.cost_center_id) : null,
      paymentMethodId: row.payment_method_id ? String(row.payment_method_id) : null,
      description: String(row.description),
      amount: Number(row.amount),
      discount: Number(row.discount || 0),
      interest: Number(row.interest || 0),
      fine: Number(row.fine || 0),
      dueDate: String(row.due_date),
      paidAt: row.paid_at ? String(row.paid_at) : null,
      status: String(row.status),
      competenceMonth: row.competence_month ? String(row.competence_month) : null,
      createdAt: String(row.created_at),
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
      dueDate: String(row.due_date),
      paidAt: row.paid_at ? String(row.paid_at) : null,
      status: String(row.status),
      createdAt: String(row.created_at),
    };
  }

  mapTx(row: Record<string, unknown>): PaymentTransaction {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      receivableId: row.receivable_id ? String(row.receivable_id) : null,
      subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
      gateway: String(row.gateway),
      externalId: row.external_id ? String(row.external_id) : null,
      idempotencyKey: String(row.idempotency_key),
      status: String(row.status),
      amount: Number(row.amount),
      paidAt: row.paid_at ? String(row.paid_at) : null,
      qrCode: (row.qr_code as string) || null,
      copyPaste: (row.copy_paste as string) || null,
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

  async listMethods() {
    const { data, error } = await this.admin()
      .from('payment_methods')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapMethod(r as Record<string, unknown>));
  }

  async listReceivables(companyIds: string[], studentId?: string) {
    let q = this.admin()
      .from('receivables')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('due_date', { ascending: false });
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapReceivable(r as Record<string, unknown>));
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
      .select('amount, discount, interest, fine, status, due_date, paid_at')
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
    const rows = await this.sumReceivables(companyIds, undefined, from, to);
    let monthRevenue = 0;
    let received = 0;
    let toReceive = 0;
    let overdue = 0;
    let openTotal = 0;
    const today = now.toISOString().slice(0, 10);
    for (const r of rows) {
      const net =
        Number(r.amount) - Number(r.discount || 0) + Number(r.interest || 0) + Number(r.fine || 0);
      monthRevenue += net;
      if (r.status === 'paid') received += net;
      if (r.status === 'open' || r.status === 'overdue') {
        toReceive += net;
        openTotal += net;
        if (String(r.due_date) < today) overdue += net;
      }
    }
    const movements = await this.listCashMovements(companyIds, from, to);
    let cash = 0;
    for (const m of movements) {
      cash += m.direction === 'in' ? Number(m.amount) : -Number(m.amount);
    }
    return {
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      received: Math.round(received * 100) / 100,
      toReceive: Math.round(toReceive * 100) / 100,
      delinquencyRate:
        openTotal > 0 ? Math.round((overdue / openTotal) * 1000) / 10 : 0,
      cashflowBalance: Math.round(cash * 100) / 100,
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
}
