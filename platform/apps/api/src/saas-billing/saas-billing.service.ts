import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AuthContext,
  SaasInvoice,
  SaasPlan,
  SaasSubscription,
} from '@athena/shared';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { SupabaseService } from '../supabase/supabase.service';
import { TenantsService } from '../platform/tenants.service';

@Injectable()
export class SaasBillingService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
    private readonly tenants: TenantsService,
  ) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  private companyId(auth: AuthContext, override?: string): string {
    if (auth.isSuperAdmin && override) return override;
    const id = override || auth.companyId || auth.companyIds[0];
    if (!id) throw new BadRequestException('companyId required');
    if (!auth.isSuperAdmin && !auth.companyIds.includes(id)) {
      throw new BadRequestException('Company not allowed');
    }
    return id;
  }

  async listPlans(): Promise<SaasPlan[]> {
    const { data: plans, error } = await this.admin()
      .from('saas_plans')
      .select('*')
      .is('deleted_at', null)
      .eq('active', true)
      .order('sort_order');
    if (error) throw new BadRequestException(error.message);
    const ids = (plans || []).map((p) => p.id);
    const [feats, lims] = await Promise.all([
      this.admin().from('saas_plan_features').select('*').in('plan_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
      this.admin().from('saas_plan_limits').select('*').in('plan_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
    ]);
    return (plans || []).map((p) => {
      const features: Record<string, boolean> = {};
      const limits: Record<string, number | null> = {};
      for (const f of feats.data || []) {
        if (f.plan_id === p.id) features[String(f.feature_key)] = Boolean(f.enabled);
      }
      for (const l of lims.data || []) {
        if (l.plan_id === p.id) limits[String(l.limit_key)] = l.limit_value == null ? null : Number(l.limit_value);
      }
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        priceMonthly: Number(p.price_monthly || 0),
        priceYearly: Number(p.price_yearly || 0),
        trialDays: Number(p.trial_days || 0),
        sortOrder: Number(p.sort_order || 0),
        active: Boolean(p.active),
        features,
        limits,
      };
    });
  }

  async upsertPlan(
    auth: AuthContext,
    user: AuthUser,
    body: {
      id?: string;
      code: string;
      name: string;
      description?: string;
      priceMonthly?: number;
      priceYearly?: number;
      trialDays?: number;
      features?: Record<string, boolean>;
      limits?: Record<string, number | null>;
    },
  ) {
    if (!auth.isSuperAdmin) throw new BadRequestException('Platform operator required');
    const row: Record<string, unknown> = {
      code: body.code,
      name: body.name,
      description: body.description || null,
      price_monthly: body.priceMonthly ?? 0,
      price_yearly: body.priceYearly ?? 0,
      trial_days: body.trialDays ?? 14,
      active: true,
      updated_at: new Date().toISOString(),
    };
    if (body.id) row.id = body.id;
    const { data, error } = await this.admin().from('saas_plans').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);

    if (body.features) {
      for (const [k, en] of Object.entries(body.features)) {
        await this.admin()
          .from('saas_plan_features')
          .upsert({ plan_id: data.id, feature_key: k, enabled: en });
      }
    }
    if (body.limits) {
      for (const [k, v] of Object.entries(body.limits)) {
        await this.admin()
          .from('saas_plan_limits')
          .upsert({ plan_id: data.id, limit_key: k, limit_value: v });
      }
    }
    await this.audit.log({
      companyId: null,
      userId: user.id,
      module: 'saas_billing',
      action: body.id ? 'update' : 'create',
      entity: 'saas_plan',
      entityId: data.id,
    });
    const plans = await this.listPlans();
    return plans.find((p) => p.id === data.id)!;
  }

  private mapSub(r: Record<string, unknown>, planCode?: string): SaasSubscription {
    return {
      id: String(r.id),
      companyId: String(r.company_id),
      planId: String(r.plan_id),
      planCode,
      status: r.status as SaasSubscription['status'],
      billingCycle: r.billing_cycle as SaasSubscription['billingCycle'],
      currentPeriodStart: r.current_period_start ? String(r.current_period_start) : null,
      currentPeriodEnd: r.current_period_end ? String(r.current_period_end) : null,
      trialEndsAt: r.trial_ends_at ? String(r.trial_ends_at) : null,
      cancelledAt: r.cancelled_at ? String(r.cancelled_at) : null,
    };
  }

  private mapInvoice(r: Record<string, unknown>): SaasInvoice {
    return {
      id: String(r.id),
      companyId: String(r.company_id),
      subscriptionId: r.subscription_id ? String(r.subscription_id) : null,
      number: String(r.number),
      status: r.status as SaasInvoice['status'],
      amount: Number(r.amount || 0),
      currency: String(r.currency || 'BRL'),
      dueAt: r.due_at ? String(r.due_at) : null,
      paidAt: r.paid_at ? String(r.paid_at) : null,
    };
  }

  async getSubscription(auth: AuthContext, companyId?: string) {
    const cid = this.companyId(auth, companyId);
    const { data, error } = await this.admin()
      .from('saas_subscriptions')
      .select('*, saas_plans(code)')
      .eq('company_id', cid)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) return null;
    const plan = data.saas_plans as { code?: string } | null;
    return this.mapSub(data as Record<string, unknown>, plan?.code);
  }

  async startTrial(auth: AuthContext, user: AuthUser, companyId: string, planCode = 'start') {
    const cid = this.companyId(auth, companyId);
    const { data: plan } = await this.admin()
      .from('saas_plans')
      .select('*')
      .eq('code', planCode)
      .maybeSingle();
    if (!plan) throw new NotFoundException('Plan not found');
    const trialEnds = new Date(Date.now() + Number(plan.trial_days || 14) * 86400000).toISOString();
    const { data, error } = await this.admin()
      .from('saas_subscriptions')
      .insert({
        company_id: cid,
        plan_id: plan.id,
        status: 'trial',
        billing_cycle: 'monthly',
        trial_ends_at: trialEnds,
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnds,
        gateway: 'stub',
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.admin()
      .from('companies')
      .update({
        plan_code: planCode,
        saas_status: 'trial',
        trial_ends_at: trialEnds,
        activated_at: new Date().toISOString(),
      })
      .eq('id', cid);
    await this.event(data.id, cid, 'trial_started', { planCode });
    await this.audit.log({
      companyId: cid,
      userId: user.id,
      module: 'saas_billing',
      action: 'create',
      entity: 'saas_subscription',
      entityId: data.id,
    });
    return this.mapSub(data as Record<string, unknown>, planCode);
  }

  async subscribe(
    auth: AuthContext,
    user: AuthUser,
    body: { companyId?: string; planCode: string; billingCycle?: 'monthly' | 'yearly' },
  ) {
    const cid = this.companyId(auth, body.companyId);
    const { data: plan } = await this.admin()
      .from('saas_plans')
      .select('*')
      .eq('code', body.planCode)
      .maybeSingle();
    if (!plan) throw new NotFoundException('Plan not found');

    const cycle = body.billingCycle || 'monthly';
    const amount = cycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (cycle === 'yearly' ? 12 : 1));

    await this.admin()
      .from('saas_billing_customers')
      .upsert({
        company_id: cid,
        gateway: 'stub',
        external_customer_id: `stub_cust_${cid.slice(0, 8)}`,
        updated_at: new Date().toISOString(),
      });

    const existing = await this.getSubscription(auth, cid);
    let subId = existing?.id;
    if (existing) {
      const { data, error } = await this.admin()
        .from('saas_subscriptions')
        .update({
          plan_id: plan.id,
          status: 'active',
          billing_cycle: cycle,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancelled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw new BadRequestException(error.message);
      subId = data.id;
      await this.event(data.id, cid, 'subscribed', { planCode: body.planCode, cycle });
    } else {
      const { data, error } = await this.admin()
        .from('saas_subscriptions')
        .insert({
          company_id: cid,
          plan_id: plan.id,
          status: 'active',
          billing_cycle: cycle,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          gateway: 'stub',
          external_subscription_id: `stub_sub_${Date.now()}`,
        })
        .select('*')
        .single();
      if (error) throw new BadRequestException(error.message);
      subId = data.id;
      await this.event(data.id, cid, 'subscribed', { planCode: body.planCode, cycle });
    }

    const invoice = await this.createInvoice(cid, subId!, amount, periodEnd);
    await this.stubCharge(cid, invoice.id, amount);

    await this.admin()
      .from('companies')
      .update({
        plan_code: body.planCode,
        saas_status: 'active',
        next_due_at: periodEnd.toISOString().slice(0, 10),
        activated_at: new Date().toISOString(),
      })
      .eq('id', cid);

    await this.audit.log({
      companyId: cid,
      userId: user.id,
      module: 'saas_billing',
      action: 'subscribe',
      entity: 'saas_subscription',
      entityId: subId,
    });
    return this.getSubscription(auth, cid);
  }

  async changePlan(
    auth: AuthContext,
    user: AuthUser,
    body: { companyId?: string; planCode: string; direction: 'upgrade' | 'downgrade' },
  ) {
    const sub = await this.subscribe(auth, user, {
      companyId: body.companyId,
      planCode: body.planCode,
    });
    if (sub) {
      await this.event(sub.id, sub.companyId, body.direction, { planCode: body.planCode });
    }
    return sub;
  }

  async cancel(auth: AuthContext, user: AuthUser, companyId?: string, reason?: string) {
    const cid = this.companyId(auth, companyId);
    const sub = await this.getSubscription(auth, cid);
    if (!sub) throw new NotFoundException('No subscription');
    const { data, error } = await this.admin()
      .from('saas_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason || null,
      })
      .eq('id', sub.id)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.admin()
      .from('companies')
      .update({ saas_status: 'cancelled' })
      .eq('id', cid);
    await this.event(sub.id, cid, 'cancelled', { reason });
    await this.audit.log({
      companyId: cid,
      userId: user.id,
      module: 'saas_billing',
      action: 'cancel',
      entity: 'saas_subscription',
      entityId: sub.id,
    });
    return this.mapSub(data as Record<string, unknown>);
  }

  async renew(auth: AuthContext, user: AuthUser, companyId?: string) {
    const cid = this.companyId(auth, companyId);
    const sub = await this.getSubscription(auth, cid);
    if (!sub) throw new NotFoundException('No subscription');
    const { data: plan } = await this.admin()
      .from('saas_plans')
      .select('*')
      .eq('id', sub.planId)
      .maybeSingle();
    if (!plan) throw new NotFoundException('Plan not found');
    const amount =
      sub.billingCycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (sub.billingCycle === 'yearly' ? 12 : 1));
    await this.admin()
      .from('saas_subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq('id', sub.id);
    const invoice = await this.createInvoice(cid, sub.id, amount, periodEnd);
    await this.stubCharge(cid, invoice.id, amount);
    await this.admin()
      .from('companies')
      .update({ next_due_at: periodEnd.toISOString().slice(0, 10), saas_status: 'active' })
      .eq('id', cid);
    await this.event(sub.id, cid, 'renewed', {});
    await this.audit.log({
      companyId: cid,
      userId: user.id,
      module: 'saas_billing',
      action: 'renew',
      entity: 'saas_subscription',
      entityId: sub.id,
    });
    return this.getSubscription(auth, cid);
  }

  private async createInvoice(companyId: string, subscriptionId: string, amount: number, periodEnd: Date) {
    const number = `INV-${Date.now()}`;
    const { data, error } = await this.admin()
      .from('saas_invoices')
      .insert({
        company_id: companyId,
        subscription_id: subscriptionId,
        number,
        status: 'open',
        amount,
        due_at: periodEnd.toISOString().slice(0, 10),
        period_start: new Date().toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return this.mapInvoice(data as Record<string, unknown>);
  }

  /** Stub gateway charge — always succeeds */
  private async stubCharge(companyId: string, invoiceId: string, amount: number) {
    await this.admin().from('saas_payments').insert({
      company_id: companyId,
      invoice_id: invoiceId,
      amount,
      status: 'paid',
      gateway: 'stub',
      external_payment_id: `stub_pay_${Date.now()}`,
      paid_at: new Date().toISOString(),
    });
    await this.admin()
      .from('saas_invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoiceId);
  }

  private async event(subscriptionId: string, companyId: string, eventType: string, payload: Record<string, unknown>) {
    await this.admin().from('saas_subscription_events').insert({
      subscription_id: subscriptionId,
      company_id: companyId,
      event_type: eventType,
      payload,
    });
  }

  async listInvoices(auth: AuthContext, companyId?: string) {
    const cid = this.companyId(auth, companyId);
    const { data, error } = await this.admin()
      .from('saas_invoices')
      .select('*')
      .eq('company_id', cid)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new BadRequestException(error.message);
    return (data || []).map((r) => this.mapInvoice(r as Record<string, unknown>));
  }

  async listPayments(auth: AuthContext, companyId?: string) {
    const cid = this.companyId(auth, companyId);
    const { data, error } = await this.admin()
      .from('saas_payments')
      .select('*')
      .eq('company_id', cid)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async checkLimits(auth: AuthContext, companyId?: string) {
    const cid = this.companyId(auth, companyId);
    const ent = await this.tenants.entitlements(cid);
    const alerts: Array<{ key: string; used: number; limit: number | null; over: boolean }> = [];
    for (const [key, limit] of Object.entries(ent.limits)) {
      const used = ent.usage[key] || 0;
      const over = limit != null && used >= limit;
      alerts.push({ key, used, limit, over });
      if (over && auth.userId) {
        void this.admin()
          .from('notifications')
          .insert({
            company_id: cid,
            user_id: auth.userId,
            title: `Limite de ${key} atingido`,
            body: `Uso ${used}/${limit}`,
            type: 'saas.limit',
            channel: 'internal',
            status: 'pending',
          });
      }
    }
    return { entitlements: ent, alerts };
  }

  async dashboard(auth: AuthContext) {
    if (!auth.isSuperAdmin) throw new BadRequestException('Platform operator required');
    const { data: companies } = await this.admin()
      .from('companies')
      .select('id, saas_status, plan_code')
      .is('deleted_at', null);
    const list = companies || [];
    const { data: subs } = await this.admin()
      .from('saas_subscriptions')
      .select('id, status, plan_id, billing_cycle, saas_plans(price_monthly, price_yearly, code)')
      .is('deleted_at', null);
    let mrr = 0;
    for (const s of subs || []) {
      if (s.status !== 'active' && s.status !== 'trial') continue;
      const plan = s.saas_plans as { price_monthly?: number; price_yearly?: number } | null;
      if (!plan) continue;
      mrr +=
        s.billing_cycle === 'yearly'
          ? Number(plan.price_yearly || 0) / 12
          : Number(plan.price_monthly || 0);
    }
    const active = list.filter((c) => c.saas_status === 'active').length;
    const trial = list.filter((c) => c.saas_status === 'trial').length;
    const cancelled = list.filter((c) => c.saas_status === 'cancelled').length;
    const churn = list.length ? cancelled / list.length : 0;
    const { count: integrations } = await this.admin()
      .from('marketplace_installations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'installed');
    return {
      companiesActive: active,
      companiesTrial: trial,
      companiesCancelled: cancelled,
      companiesTotal: list.length,
      mrr,
      churn,
      conversion: list.length ? active / list.length : 0,
      planBreakdown: list.reduce(
        (acc, c) => {
          const k = String(c.plan_code || 'none');
          acc[k] = (acc[k] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      integrationsActive: integrations || 0,
    };
  }

  async reportCsv(auth: AuthContext, kind: string): Promise<{ filename: string; csv: string }> {
    if (!auth.isSuperAdmin) throw new BadRequestException('Platform operator required');
    if (kind === 'tenants') {
      const rows = await this.tenants.list(auth);
      const csv = [
        'nome,fantasia,plano,status,cnpj',
        ...rows.map(
          (r) =>
            `"${r.name}","${r.tradeName || ''}",${r.planCode || ''},${r.saasStatus},"${r.document || ''}"`,
        ),
      ].join('\n');
      return { filename: 'tenants.csv', csv };
    }
    if (kind === 'subscriptions') {
      const { data } = await this.admin()
        .from('saas_subscriptions')
        .select('*, saas_plans(code), companies(name)')
        .is('deleted_at', null);
      const csv = [
        'empresa,plano,status,ciclo',
        ...(data || []).map((r) => {
          const co = r.companies as { name?: string } | null;
          const pl = r.saas_plans as { code?: string } | null;
          return `"${co?.name || ''}",${pl?.code || ''},${r.status},${r.billing_cycle}`;
        }),
      ].join('\n');
      return { filename: 'subscriptions.csv', csv };
    }
    if (kind === 'invoices') {
      const { data } = await this.admin().from('saas_invoices').select('*').limit(500);
      const csv = [
        'numero,status,valor,vencimento',
        ...(data || []).map((r) => `${r.number},${r.status},${r.amount},${r.due_at || ''}`),
      ].join('\n');
      return { filename: 'invoices.csv', csv };
    }
    throw new BadRequestException('Unknown report');
  }

  async createTicket(
    auth: AuthContext,
    user: AuthUser,
    body: { subject: string; body: string; companyId?: string },
  ) {
    const cid = this.companyId(auth, body.companyId);
    const { data, error } = await this.admin()
      .from('saas_support_tickets')
      .insert({
        company_id: cid,
        created_by: user.id,
        subject: body.subject,
        body: body.body,
        status: 'open',
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async listTickets(auth: AuthContext, companyId?: string) {
    const cid = this.companyId(auth, companyId);
    const { data, error } = await this.admin()
      .from('saas_support_tickets')
      .select('*')
      .eq('company_id', cid)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }
}
