import { Injectable, StreamableFile } from '@nestjs/common';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { buildPdf } from '../prints/pdf.util';
import { CreateDemoRequestDto, UpdateDemoRequestDto } from './dto/demo-request.dto';
import { MarketingMailer } from './marketing.mailer';

@Injectable()
export class MarketingService {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly mailer: MarketingMailer,
  ) {}

  assertRateLimit(ip: string) {
    const key = ip || 'unknown';
    const now = Date.now();
    const windowMs = 60_000;
    const max = 8;
    const cur = this.hits.get(key);
    if (!cur || cur.resetAt < now) {
      this.hits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    cur.count += 1;
    if (cur.count > max) {
      const err = new Error('Too many requests');
      (err as Error & { status: number }).status = 429;
      throw err;
    }
  }

  async createDemoRequest(
    dto: CreateDemoRequestDto,
    meta: { ip?: string; userAgent?: string },
  ) {
    if (dto.website && dto.website.trim()) {
      return { ok: true, id: null as string | null, message: 'accepted' };
    }
    if (!dto.consentLgpd) {
      const err = new Error('LGPD consent required');
      (err as Error & { status: number }).status = 400;
      throw err;
    }

    const phone = (dto.whatsapp || dto.phone || '').trim();
    if (phone.length < 8) {
      const err = new Error('WhatsApp/telefone obrigatório');
      (err as Error & { status: number }).status = 400;
      throw err;
    }

    this.assertRateLimit(meta.ip || 'unknown');

    const ipHash = meta.ip
      ? createHash('sha256').update(meta.ip).digest('hex').slice(0, 32)
      : null;

    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('marketing_demo_requests')
      .insert({
        full_name: dto.fullName.trim(),
        academy_name: dto.academyName.trim(),
        city: dto.city.trim(),
        state: dto.state?.trim().toUpperCase() || null,
        email: dto.email.trim().toLowerCase(),
        phone,
        whatsapp: phone,
        student_count: dto.studentCount,
        primary_interest: dto.primaryInterest?.trim() || null,
        plan_interest: dto.planInterest?.trim() || null,
        message: dto.message?.trim() || null,
        consent_lgpd: true,
        utm_source: dto.utmSource || null,
        utm_medium: dto.utmMedium || null,
        utm_campaign: dto.utmCampaign || null,
        referrer: dto.referrer || null,
        user_agent: meta.userAgent || null,
        ip_hash: ipHash,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      const err = new Error(error.message);
      (err as Error & { status: number }).status = 500;
      throw err;
    }

    const leadId = data.id as string;

    void this.mailer.send({
      template: 'demo_confirmation',
      to: dto.email.trim().toLowerCase(),
      leadId,
      subject: 'Recebemos seu pedido de demonstração — Movvo ERP',
      html: this.mailer.wrap(
        'Demonstração solicitada',
        `<p>Olá <strong>${dto.fullName}</strong>,</p>
         <p>Recebemos o pedido de demonstração para <strong>${dto.academyName}</strong>.</p>
         <p>Nossa equipe comercial entrará em contato em breve pelo WhatsApp/e-mail informados.</p>
         <p><a href="https://movvoerp.com.br/demonstracao/obrigado?id=${leadId}" style="color:#D90429">Ver confirmação</a></p>`,
      ),
    });

    const opsEmail = this.config.get<string>('MARKETING_OPS_EMAIL');
    if (opsEmail) {
      void this.mailer.send({
        template: 'demo_ops_notify',
        to: opsEmail,
        leadId,
        subject: `[Lead] ${dto.academyName} — ${dto.fullName}`,
        html: this.mailer.wrap(
          'Novo lead comercial',
          `<p><strong>${dto.fullName}</strong> · ${dto.academyName}</p>
           <p>${dto.city}${dto.state ? `/${dto.state}` : ''} · ${dto.studentCount} alunos</p>
           <p>${dto.email} · ${phone}</p>
           <p>Interesse: ${dto.primaryInterest || '—'} · Plano: ${dto.planInterest || '—'}</p>`,
        ),
      });
    }

    const webhook = this.config.get<string>('MARKETING_WEBHOOK_URL');
    if (webhook) {
      void fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'marketing.demo_request',
          id: leadId,
          email: dto.email,
          academyName: dto.academyName,
          city: dto.city,
          state: dto.state,
          studentCount: dto.studentCount,
          planInterest: dto.planInterest,
          primaryInterest: dto.primaryInterest,
        }),
      }).catch(() => undefined);
    }

    return { ok: true, id: leadId, message: 'Demo request received' };
  }

  async listDemoRequests(filters?: { status?: string }) {
    const admin = this.supabase.getAdmin();
    let q = admin
      .from('marketing_demo_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filters?.status) q = q.eq('status', filters.status);
    const { data, error } = await q;
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    return data || [];
  }

  async getDemoRequest(id: string) {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('marketing_demo_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    if (!data) throw Object.assign(new Error('Lead not found'), { status: 404 });
    return data;
  }

  async updateDemoRequest(id: string, dto: UpdateDemoRequestDto) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.status) patch.status = dto.status;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (dto.scheduledAt !== undefined) patch.scheduled_at = dto.scheduledAt || null;
    if (dto.ownerUserId !== undefined) patch.owner_user_id = dto.ownerUserId || null;

    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('marketing_demo_requests')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    return data;
  }

  async analyticsSummary() {
    const rows = await this.listDemoRequests();
    const byStatus: Record<string, number> = {};
    const byUtm: Record<string, number> = {};
    let scheduled = 0;
    for (const r of rows as Array<Record<string, unknown>>) {
      const st = String(r.status || 'new');
      byStatus[st] = (byStatus[st] || 0) + 1;
      const src = String(r.utm_source || 'direct');
      byUtm[src] = (byUtm[src] || 0) + 1;
      if (r.scheduled_at || st === 'demo_scheduled') scheduled += 1;
    }
    return {
      totalLeads: rows.length,
      byStatus,
      byUtm,
      demosScheduled: scheduled,
    };
  }

  async listOnboarding() {
    const admin = this.supabase.getAdmin();
    const { data, error } = await admin
      .from('commercial_onboarding')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(100);
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    return data || [];
  }

  async upsertOnboarding(body: {
    id?: string;
    leadId?: string;
    academyName?: string;
    stage?: string;
    checklist?: Record<string, boolean>;
    notes?: string;
  }) {
    const admin = this.supabase.getAdmin();
    const row: Record<string, unknown> = {
      lead_id: body.leadId || null,
      academy_name: body.academyName || null,
      stage: body.stage || 'cadastro',
      checklist: body.checklist || {},
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };
    if (body.id) row.id = body.id;
    const { data, error } = await admin
      .from('commercial_onboarding')
      .upsert(row)
      .select('*')
      .single();
    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    return data;
  }

  async onePagerPdf() {
    const buffer = await buildPdf({
      title: 'Movvo ERP',
      subtitle: 'Gestão inteligente para academias — one-pager comercial',
      lines: [
        { text: 'O que inclui', bold: true, size: 13 },
        '• Alunos, matrículas e portal',
        '• Financeiro (caixa, receber, pagar, mensalidades)',
        '• Treinos, agenda e acesso',
        '• CRM, campanhas e engajamento',
        '• Estoque / PDV · BI · Movvo AI',
        '• Multiunidade · API · White label (conforme plano)',
        '',
        { text: 'Planos', bold: true, size: 13 },
        'Start · Pro · Enterprise — preços sob consulta',
        '',
        { text: 'Contato', bold: true, size: 13 },
        'https://movvoerp.com.br/demonstracao',
        'vendas@movvoerp.com.br',
      ],
      footer: 'Movvo ERP · movvoerp.com.br · Material comercial M-3',
    });
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: 'inline; filename="movvo-one-pager.pdf"',
    });
  }
}
