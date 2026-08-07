import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

export type MailTemplate =
  | 'demo_confirmation'
  | 'demo_ops_notify'
  | 'welcome'
  | 'invite'
  | 'password_recovery'
  | 'plan_update'
  | 'notice';

@Injectable()
export class MarketingMailer {
  private readonly logger = new Logger(MarketingMailer.name);

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  async send(opts: {
    template: MailTemplate;
    to: string;
    subject: string;
    html: string;
    leadId?: string | null;
  }) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from =
      this.config.get<string>('MARKETING_EMAIL_FROM') || 'Movvo <noreply@movvoerp.com.br>';

    let providerId: string | null = null;
    let status = 'skipped';
    let error: string | null = null;

    if (apiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [opts.to],
            subject: opts.subject,
            html: opts.html,
          }),
        });
        const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
        if (!res.ok) {
          status = 'failed';
          error = body.message || `HTTP ${res.status}`;
        } else {
          status = 'sent';
          providerId = body.id || null;
        }
      } catch (e) {
        status = 'failed';
        error = e instanceof Error ? e.message : 'send failed';
        this.logger.warn(`Resend failed: ${error}`);
      }
    } else {
      this.logger.log(`Email skipped (no RESEND_API_KEY): ${opts.template} → ${opts.to}`);
    }

    const admin = this.supabase.getAdmin();
    await admin.from('marketing_email_log').insert({
      template: opts.template,
      to_email: opts.to,
      lead_id: opts.leadId || null,
      provider_id: providerId,
      status,
      error,
    });

    return { status, providerId };
  }

  wrap(title: string, bodyHtml: string) {
    return `<!doctype html><html><body style="margin:0;background:#080808;color:#f5f5f5;font-family:Inter,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:22px;font-weight:700;color:#D90429;margin-bottom:8px">Movvo ERP</div>
    <div style="color:#D4AF37;font-size:13px;margin-bottom:24px">Movimente sua gestão.</div>
    <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
    <div style="line-height:1.55;color:#d1d5db">${bodyHtml}</div>
    <p style="margin-top:32px;font-size:12px;color:#6b7280">© Movvo ERP · movvoerp.com.br</p>
  </div>
</body></html>`;
  }
}
