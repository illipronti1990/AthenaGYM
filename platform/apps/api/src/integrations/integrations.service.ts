import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getBenefitPartnerAdapter } from '@athena/integrations';
import type { AuthContext } from '@athena/shared';
import { verifyHmacSignature } from '../operations/operations.rules';
import { IntegrationsRepository } from './integrations.repository';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly repo: IntegrationsRepository,
    private readonly config: ConfigService,
  ) {}

  private companyId(auth: AuthContext) {
    if (!auth.companyId) throw new BadRequestException('companyId required');
    return auth.companyId;
  }

  private webhookSecret(provider: string, settings?: Record<string, unknown>) {
    const fromSettings = settings?.webhookSecret || settings?.hmac_secret;
    if (typeof fromSettings === 'string' && fromSettings) return fromSettings;
    return (
      this.config.get<string>(`PARTNER_WEBHOOK_SECRET_${provider.toUpperCase()}`) ||
      this.config.get<string>('PARTNER_WEBHOOK_SECRET') ||
      'athena-partner-webhook-dev'
    );
  }

  listHub(auth: AuthContext) {
    return this.repo.listPartners(this.companyId(auth));
  }

  async partnerDashboard(auth: AuthContext, provider: string) {
    const companyId = this.companyId(auth);
    const checkinsToday = await this.repo.countPartnerCheckinsToday(companyId, provider);
    const pending = await this.repo.countPendingAccessRequests(companyId, provider);
    const integration = await this.repo.getPartnerIntegration(companyId, provider);
    return {
      provider,
      checkinsToday,
      pendingApprovals: pending,
      estimatedRevenueStub: checkinsToday * 12.5,
      enabled: Boolean(integration?.enabled),
      lastSyncAt: integration?.last_sync_at ? String(integration.last_sync_at) : null,
      status: integration ? String(integration.status) : 'disconnected',
    };
  }

  async syncMembers(auth: AuthContext, provider: string) {
    const companyId = this.companyId(auth);
    const adapter = getBenefitPartnerAdapter(provider);
    const started = Date.now();
    try {
      const result = await adapter.syncMembers(companyId);
      await this.repo.touchLastSync(companyId, provider);
      await this.repo.insertLog({
        company_id: companyId,
        provider,
        endpoint: 'sync-members',
        status: 'ok',
        http_status: 200,
        payload: this.repo.redactPayload({ synced: result.synced }),
        duration_ms: Date.now() - started,
      });
      return result;
    } catch (err) {
      await this.repo.insertLog({
        company_id: companyId,
        provider,
        endpoint: 'sync-members',
        status: 'failed',
        http_status: 500,
        error: err instanceof Error ? err.message : 'sync failed',
        payload: {},
        duration_ms: Date.now() - started,
      });
      throw err;
    }
  }

  async syncCheckins(auth: AuthContext, provider: string, from?: string, to?: string) {
    const companyId = this.companyId(auth);
    const adapter = getBenefitPartnerAdapter(provider);
    const started = Date.now();
    const start = from || new Date(Date.now() - 86_400_000).toISOString();
    const end = to || new Date().toISOString();
    try {
      const result = await adapter.syncCheckins(companyId, start, end);
      await this.repo.touchLastSync(companyId, provider);
      await this.repo.insertLog({
        company_id: companyId,
        provider,
        endpoint: 'sync-checkins',
        status: 'ok',
        http_status: 200,
        payload: this.repo.redactPayload({ imported: result.imported, from: start, to: end }),
        duration_ms: Date.now() - started,
      });
      return result;
    } catch (err) {
      await this.repo.insertLog({
        company_id: companyId,
        provider,
        endpoint: 'sync-checkins',
        status: 'failed',
        http_status: 500,
        error: err instanceof Error ? err.message : 'sync failed',
        payload: {},
        duration_ms: Date.now() - started,
      });
      throw err;
    }
  }

  listLogs(auth: AuthContext, provider?: string) {
    return this.repo.listLogs(this.companyId(auth), provider);
  }

  async retryLog(auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const log = await this.repo.getLog(companyId, id);
    if (!log) throw new NotFoundException('Log not found');
    if (log.status !== 'failed') {
      throw new BadRequestException('Only failed logs can be retried');
    }
    const started = Date.now();
    const adapter = getBenefitPartnerAdapter(log.provider);
    try {
      if (log.endpoint.includes('sync-members')) {
        await adapter.syncMembers(companyId);
      } else if (log.endpoint.includes('sync-checkins')) {
        await adapter.syncCheckins(
          companyId,
          new Date(Date.now() - 86_400_000).toISOString(),
          new Date().toISOString(),
        );
      } else if (log.endpoint.includes('webhook')) {
        // re-ack only
      }
      return this.repo.updateLog(id, {
        status: 'ok',
        error: null,
        http_status: 200,
        duration_ms: Date.now() - started,
      });
    } catch (err) {
      return this.repo.updateLog(id, {
        status: 'failed',
        error: err instanceof Error ? err.message : 'retry failed',
        duration_ms: Date.now() - started,
      });
    }
  }

  async handleWebhook(
    provider: string,
    rawBody: string,
    signature: string | undefined,
    companyIdHeader: string | undefined,
    payload: Record<string, unknown>,
  ) {
    const companyId =
      companyIdHeader ||
      (typeof payload.companyId === 'string' ? payload.companyId : null) ||
      '11111111-1111-1111-1111-111111111111';

    const integration = await this.repo.getPartnerIntegration(companyId, provider);
    const settings = (integration?.settings as Record<string, unknown>) || {};
    const secret = this.webhookSecret(provider, settings);

    if (!verifyHmacSignature(rawBody, signature, secret)) {
      await this.repo.insertLog({
        company_id: companyId,
        provider,
        endpoint: `webhooks/${provider}`,
        status: 'failed',
        http_status: 401,
        error: 'invalid_hmac',
        payload: this.repo.redactPayload(payload),
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payloadHash = this.repo.hashPayload(payload);
    const existing = await this.repo.findLogByHash(companyId, provider, payloadHash);
    if (existing) {
      return { ok: true, idempotent: true, logId: existing.id };
    }

    const started = Date.now();
    const adapter = getBenefitPartnerAdapter(provider);
    const event = String(payload.event || payload.type || 'checkin');
    const externalMemberId = String(
      payload.externalMemberId || payload.memberId || payload.user_id || '',
    );
    const document = payload.document ? String(payload.document) : undefined;

    try {
      if (event.includes('cancel') || event === 'membership.cancelled') {
        if (externalMemberId) await adapter.cancelMembership(externalMemberId);
      } else {
        const validation = await adapter.validateMember({
          companyId,
          externalMemberId: externalMemberId || undefined,
          document,
          email: payload.email ? String(payload.email) : undefined,
        });
        if (!validation.eligible) {
          await this.repo.insertAccessRequest({
            company_id: companyId,
            unit_id: payload.unitId || null,
            provider,
            status: 'pending',
            member_name: validation.memberName || String(payload.memberName || 'Parceiro'),
            member_document: document || null,
            member_email: payload.email ? String(payload.email) : null,
            external_member_id: validation.externalMemberId || externalMemberId || null,
            raw_payload: this.repo.redactPayload(payload),
          });
        } else {
          let student = externalMemberId
            ? await this.repo.findStudentByPartnerId(companyId, provider, externalMemberId)
            : null;
          if (!student && validation.externalMemberId) {
            student = await this.repo.findStudentByPartnerId(
              companyId,
              provider,
              validation.externalMemberId,
            );
          }
          if (!student && document) {
            student = await this.repo.findStudentByCpf(companyId, document);
          }
          let studentId = student ? String(student.id) : null;
          const unitId =
            (payload.unitId ? String(payload.unitId) : null) ||
            (student?.unit_id ? String(student.unit_id) : null) ||
            '22222222-2222-2222-2222-222222222222';

          if (!studentId) {
            const insert: Record<string, unknown> = {
              company_id: companyId,
              unit_id: unitId,
              full_name: validation.memberName || String(payload.memberName || 'Membro parceiro'),
              registration_number: `P-${provider.slice(0, 2).toUpperCase()}-${Date.now()}`,
              status: 'active',
              partner_status: 'active',
              partner_plan_name: validation.plan || null,
              partner_synced_at: new Date().toISOString(),
            };
            if (provider === 'totalpass') {
              insert.totalpass_id = validation.externalMemberId || externalMemberId;
            } else {
              insert.wellhub_id = validation.externalMemberId || externalMemberId;
            }
            if (document) {
              const digits = document.replace(/\D/g, '');
              const byCpf = await this.repo.findStudentByCpf(companyId, digits);
              if (byCpf) {
                studentId = String(byCpf.id);
              } else {
                insert.cpf = digits;
              }
            }
            if (!studentId) {
              studentId = await this.repo.createPartnerStudent(insert);
            } else {
              await this.repo.upsertStudentPartnerFields(companyId, studentId, provider, {
                externalId: validation.externalMemberId || externalMemberId,
                plan: validation.plan,
                status: 'active',
              });
            }
          } else {
            await this.repo.upsertStudentPartnerFields(companyId, studentId, provider, {
              externalId: validation.externalMemberId || externalMemberId,
              plan: validation.plan,
              status: 'active',
            });
          }

          const reg = await adapter.registerCheckin({
            companyId,
            unitId,
            externalMemberId: validation.externalMemberId || externalMemberId || 'unknown',
            studentId,
          });
          await this.repo.insertCheckin({
            company_id: companyId,
            unit_id: unitId,
            student_id: studentId,
            method: 'partner',
            direction: 'in',
            partner: provider,
            external_checkin_id: reg.externalId,
          });
        }
      }

      const log = await this.repo.insertLog({
        company_id: companyId,
        provider,
        endpoint: `webhooks/${provider}`,
        status: 'ok',
        http_status: 200,
        payload: this.repo.redactPayload(payload),
        payload_hash: payloadHash,
        duration_ms: Date.now() - started,
      });
      return { ok: true, idempotent: false, logId: log.id };
    } catch (err) {
      await this.repo.insertLog({
        company_id: companyId,
        provider,
        endpoint: `webhooks/${provider}`,
        status: 'failed',
        http_status: 500,
        error: err instanceof Error ? err.message : 'webhook failed',
        payload: this.repo.redactPayload(payload),
        payload_hash: payloadHash,
        duration_ms: Date.now() - started,
      });
      throw err;
    }
  }
}
