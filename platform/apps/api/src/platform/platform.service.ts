import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { AuthContext, PublicApiContext } from '@movvo/shared';
import { INTEGRATION_CATALOG } from '@movvo/integrations';
import { AuditService } from '../audit/audit.service';
import {
  CreateApiClientDto,
  CreateCheckinPublicDto,
  CreateSandboxDto,
  CreateWebhookDto,
  OauthTokenDto,
} from './dto/platform.dto';
import {
  API_CLIENT_CREATED,
  PLUGIN_INSTALLED,
  PLUGIN_REMOVED,
  PUBLIC_EVENT_FANOUT,
  SANDBOX_CREATED,
  WEBHOOK_DELIVERY_QUEUED,
  WEBHOOK_SUBSCRIBED,
} from './events/platform.events';
import {
  filterValidScopes,
  hasScope,
  isRateLimited,
  nextWebhookDelayMinutes,
  parseScopeString,
} from './platform.rules';
import { PlatformRepository } from './platform.repository';

const ACCESS_TTL_SEC = 3600;
const REFRESH_TTL_SEC = 60 * 60 * 24 * 30;

@Injectable()
export class PlatformService {
  constructor(
    private readonly repo: PlatformRepository,
    private readonly events: EventEmitter2,
    private readonly audit: AuditService,
  ) {}

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private hmac(secret: string, body: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
  }

  private safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  }

  private companyId(auth: AuthContext): string {
    const id = auth.companyId || auth.companyIds[0];
    if (!id) throw new BadRequestException('companyId required');
    return id;
  }

  // ---- Developer portal (JWT) ----

  async createApiClient(auth: AuthContext, userId: string, dto: CreateApiClientDto) {
    const companyId = this.companyId(auth);
    const scopes = filterValidScopes(dto.scopes);
    if (!scopes.length) throw new BadRequestException('At least one valid scope is required');

    const clientId = `ath_${randomBytes(12).toString('hex')}`;
    const clientSecret = `ats_${randomBytes(24).toString('hex')}`;
    const client = await this.repo.insertClient({
      company_id: companyId,
      name: dto.name,
      client_id: clientId,
      client_secret_hash: this.hash(clientSecret),
      scopes,
      status: 'active',
      environment: dto.environment || 'production',
      created_by: userId,
    });

    this.events.emit(API_CLIENT_CREATED, {
      companyId,
      clientId: client.clientId,
      environment: client.environment,
    });
    await this.audit.log({
      companyId,
      userId,
      module: 'platform',
      action: 'api_client.create',
      entity: 'api_clients',
      entityId: client.id,
    });

    return { ...client, clientSecret };
  }

  listApiClients(auth: AuthContext) {
    return this.repo.listClients(this.companyId(auth));
  }

  async issueToken(dto: OauthTokenDto) {
    if (dto.grantType === 'refresh_token') {
      return this.refreshToken(dto.refreshToken || '');
    }

    if (!dto.clientId || !dto.clientSecret) {
      throw new UnauthorizedException('clientId and clientSecret required');
    }

    const found = await this.repo.findClientByClientId(dto.clientId);
    if (!found || found.mapped.status !== 'active') {
      throw new UnauthorizedException('Invalid API client');
    }
    if (!this.safeEqual(found.raw.client_secret_hash as string, this.hash(dto.clientSecret))) {
      throw new UnauthorizedException('Invalid client secret');
    }

    let scopes = found.mapped.scopes;
    const requested = parseScopeString(dto.scope);
    if (requested) {
      if (!requested.every((s) => scopes.includes(s))) {
        throw new ForbiddenException('Requested scope exceeds client grants');
      }
      scopes = requested;
    }

    return this.mintTokens(found.mapped.id, found.mapped.companyId, scopes);
  }

  private async refreshToken(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('refreshToken required');
    const row = await this.repo.findOauthByRefreshHash(this.hash(refreshToken));
    if (!row) throw new UnauthorizedException('Invalid refresh token');
    if (row.refresh_expires_at && new Date(String(row.refresh_expires_at)) < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    await this.repo.revokeOauth(String(row.id));
    return this.mintTokens(
      String(row.api_client_id),
      String(row.company_id),
      (row.scopes as string[]) || [],
    );
  }

  private async mintTokens(apiClientDbId: string, companyId: string, scopes: string[]) {
    const accessToken = `atk_${randomBytes(32).toString('hex')}`;
    const refreshToken = `rtk_${randomBytes(32).toString('hex')}`;
    const expiresAt = new Date(Date.now() + ACCESS_TTL_SEC * 1000).toISOString();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000).toISOString();

    await this.repo.insertOauthToken({
      api_client_id: apiClientDbId,
      company_id: companyId,
      access_token_hash: this.hash(accessToken),
      refresh_token_hash: this.hash(refreshToken),
      scopes,
      expires_at: expiresAt,
      refresh_expires_at: refreshExpiresAt,
    });
    await this.repo.touchClient(apiClientDbId);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: ACCESS_TTL_SEC,
      scope: scopes.join(' '),
    };
  }

  async resolvePublicAuth(bearerOrKey: string): Promise<PublicApiContext> {
    const token = bearerOrKey.replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new UnauthorizedException('Missing token');

    // Opaque OAuth access token
    if (token.startsWith('atk_')) {
      const row = await this.repo.findOauthByAccessHash(this.hash(token));
      if (!row) throw new UnauthorizedException('Invalid access token');
      if (new Date(String(row.expires_at)) < new Date()) {
        throw new UnauthorizedException('Access token expired');
      }
      const client = await this.repo.findClientById(String(row.api_client_id));
      if (!client || client.mapped.status !== 'active') {
        throw new UnauthorizedException('API client inactive');
      }
      await this.repo.touchClient(client.mapped.id);
      return {
        companyId: client.mapped.companyId,
        clientId: client.mapped.clientId,
        apiClientDbId: client.mapped.id,
        scopes: (row.scopes as string[]) || client.mapped.scopes,
        environment: client.mapped.environment,
      };
    }

    // Raw client_secret as API key (legacy-style key auth)
    if (token.startsWith('ats_')) {
      throw new UnauthorizedException('Use OAuth2 token endpoint — client secret is not an access token');
    }

    throw new UnauthorizedException('Invalid API key or token');
  }

  async assertScope(ctx: PublicApiContext, required: string | string[]) {
    if (!hasScope(ctx.scopes, required)) {
      throw new ForbiddenException('Insufficient scope');
    }
  }

  async assertRateLimit(ctx: PublicApiContext) {
    const client = await this.repo.findClientById(ctx.apiClientDbId);
    if (!client) throw new UnauthorizedException('API client not found');
    const sinceMinute = new Date(Date.now() - 60_000).toISOString();
    const sinceDay = new Date(Date.now() - 86_400_000).toISOString();
    const perMinute = await this.repo.countUsageSince(ctx.apiClientDbId, sinceMinute);
    const perDay = await this.repo.countUsageSince(ctx.apiClientDbId, sinceDay);
    if (isRateLimited(perMinute, client.mapped.rateLimitPerMinute)) {
      throw new ForbiddenException('Rate limit exceeded (per minute)');
    }
    if (isRateLimited(perDay, client.mapped.rateLimitPerDay)) {
      throw new ForbiddenException('Rate limit exceeded (per day)');
    }
  }

  async logUsage(
    ctx: PublicApiContext,
    endpoint: string,
    method: string,
    statusCode: number,
    latencyMs: number,
    errorCode?: string,
  ) {
    await this.repo.insertUsage({
      company_id: ctx.companyId,
      api_client_id: ctx.apiClientDbId,
      endpoint,
      method,
      status_code: statusCode,
      latency_ms: latencyMs,
      error_code: errorCode || null,
      environment: ctx.environment,
    });
  }

  // ---- Public resources ----

  async publicStudents(ctx: PublicApiContext, page = 1, pageSize = 20) {
    await this.assertScope(ctx, 'students.read');
    if (ctx.environment === 'sandbox') {
      return {
        data: [
          {
            id: 'sandbox-student-1',
            fullName: 'Aluno Sandbox',
            status: 'active',
            unitId: null,
            createdAt: new Date().toISOString(),
          },
        ],
        page: 1,
        pageSize,
        total: 1,
      };
    }
    return this.repo.listStudents(ctx.companyId, page, pageSize);
  }

  async publicPlans(ctx: PublicApiContext) {
    await this.assertScope(ctx, 'finance.read');
    if (ctx.environment === 'sandbox') {
      return [{ id: 'sandbox-plan-1', name: 'Plano Sandbox', price: 99.9, status: 'active' }];
    }
    return this.repo.listPlans(ctx.companyId);
  }

  async publicUnits(ctx: PublicApiContext) {
    await this.assertScope(ctx, 'students.read');
    if (ctx.environment === 'sandbox') {
      return [{ id: 'sandbox-unit-1', name: 'Unidade Sandbox', code: 'SBX', status: 'active' }];
    }
    return this.repo.listUnits(ctx.companyId);
  }

  async publicWorkouts(ctx: PublicApiContext, page = 1, pageSize = 20) {
    await this.assertScope(ctx, 'workouts.read');
    if (ctx.environment === 'sandbox') {
      return {
        data: [{ id: 'sandbox-workout-1', name: 'Treino A', status: 'published', studentId: null }],
        page: 1,
        pageSize,
        total: 1,
      };
    }
    return this.repo.listWorkouts(ctx.companyId, page, pageSize);
  }

  async publicPayments(ctx: PublicApiContext, page = 1, pageSize = 20) {
    await this.assertScope(ctx, 'finance.read');
    if (ctx.environment === 'sandbox') {
      return {
        data: [{ id: 'sandbox-pay-1', amount: 99.9, status: 'paid', dueDate: null, paidAt: new Date().toISOString() }],
        page: 1,
        pageSize,
        total: 1,
      };
    }
    return this.repo.listPayments(ctx.companyId, page, pageSize);
  }

  async publicCheckin(ctx: PublicApiContext, dto: CreateCheckinPublicDto) {
    await this.assertScope(ctx, 'checkins.create');
    const result = {
      id: `chk_${randomBytes(8).toString('hex')}`,
      studentId: dto.studentId,
      unitId: dto.unitId || null,
      status: 'ok',
      environment: ctx.environment,
      createdAt: new Date().toISOString(),
    };
    await this.fanoutPublicEvent(ctx.companyId, 'checkin.created', result, ctx.environment);
    return result;
  }

  // ---- Webhooks ----

  async createWebhook(
    authOrCtx: AuthContext | PublicApiContext,
    dto: CreateWebhookDto,
    apiClientId?: string | null,
  ) {
    const companyId =
      'companyIds' in authOrCtx ? this.companyId(authOrCtx) : authOrCtx.companyId;
    if ('scopes' in authOrCtx) {
      await this.assertScope(authOrCtx, 'webhooks.manage');
    }

    const secret = `whsec_${randomBytes(24).toString('hex')}`;
    const sub = await this.repo.insertWebhook({
      company_id: companyId,
      api_client_id: apiClientId || ('apiClientDbId' in authOrCtx ? authOrCtx.apiClientDbId : null),
      url: dto.url,
      signing_secret: secret,
      secret_hint: secret.slice(-8),
      events: dto.events,
      status: 'active',
      environment: dto.environment || ('environment' in authOrCtx ? authOrCtx.environment : 'production'),
    });

    this.events.emit(WEBHOOK_SUBSCRIBED, {
      companyId,
      subscriptionId: sub.id,
      events: dto.events,
    });

    return { ...sub, secret };
  }

  listWebhooks(auth: AuthContext) {
    return this.repo.listWebhooks(this.companyId(auth));
  }

  listDeliveries(auth: AuthContext) {
    return this.repo.listDeliveries(this.companyId(auth));
  }

  async updateWebhook(
    auth: AuthContext,
    id: string,
    patch: { url?: string; events?: string[]; status?: string },
  ) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.findWebhookRaw(id);
    if (!existing || String(existing.company_id) !== companyId) {
      throw new NotFoundException('Webhook not found');
    }
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.url) row.url = patch.url;
    if (patch.events) row.events = patch.events;
    if (patch.status) row.status = patch.status;
    return this.repo.updateWebhook(id, row);
  }

  async deleteWebhook(auth: AuthContext, id: string) {
    return this.updateWebhook(auth, id, { status: 'disabled' });
  }

  async replayDelivery(auth: AuthContext, deliveryId: string) {
    const companyId = this.companyId(auth);
    const delivery = await this.repo.findDelivery(deliveryId);
    if (!delivery || String(delivery.company_id) !== companyId) {
      throw new NotFoundException('Delivery not found');
    }
    return this.repo.insertDelivery({
      company_id: companyId,
      subscription_id: delivery.subscription_id,
      event_type: delivery.event_type,
      payload: delivery.payload,
      status: 'pending',
      attempts: 0,
      next_retry_at: new Date().toISOString(),
    });
  }

  async rotateApiClient(auth: AuthContext, userId: string, clientDbId: string) {
    const companyId = this.companyId(auth);
    const client = await this.repo.findClientById(clientDbId);
    if (!client || client.mapped.companyId !== companyId) {
      throw new NotFoundException('API client not found');
    }
    const clientSecret = `ats_${randomBytes(24).toString('hex')}`;
    await this.repo.updateClient(clientDbId, {
      client_secret_hash: this.hash(clientSecret),
      secret_hint: clientSecret.slice(-6),
      updated_at: new Date().toISOString(),
    });
    await this.audit.log({
      companyId,
      userId,
      module: 'platform',
      action: 'rotate',
      entity: 'api_client',
      entityId: clientDbId,
    });
    return { id: clientDbId, clientId: client.mapped.clientId, clientSecret };
  }

  async revokeApiClient(auth: AuthContext, userId: string, clientDbId: string) {
    const companyId = this.companyId(auth);
    const client = await this.repo.findClientById(clientDbId);
    if (!client || client.mapped.companyId !== companyId) {
      throw new NotFoundException('API client not found');
    }
    await this.repo.updateClient(clientDbId, { status: 'revoked' });
    await this.audit.log({
      companyId,
      userId,
      module: 'platform',
      action: 'revoke',
      entity: 'api_client',
      entityId: clientDbId,
    });
    return { ok: true };
  }

  /** Verify partner HMAC (for webhook tester) */
  verifyPartnerSignature(secret: string, body: string, signature: string): boolean {
    const expected = this.hmac(secret, body);
    return signature === expected || signature === `sha256=${expected}`;
  }

  async fanoutPublicEvent(
    companyId: string,
    eventType: string,
    payload: Record<string, unknown>,
    environment: 'production' | 'sandbox' = 'production',
  ) {
    this.events.emit(PUBLIC_EVENT_FANOUT, { companyId, eventType, payload, environment });
    const subs = await this.repo.listActiveWebhooksForEvent(companyId, eventType, environment);
    for (const sub of subs) {
      const delivery = await this.repo.insertDelivery({
        company_id: companyId,
        subscription_id: sub.id,
        event_type: eventType,
        payload,
        status: 'pending',
        attempts: 0,
        next_attempt_at: new Date().toISOString(),
      });
      this.events.emit(WEBHOOK_DELIVERY_QUEUED, {
        companyId,
        deliveryId: delivery.id,
        subscriptionId: String(sub.id),
        eventType,
      });
      await this.repo.insertOutbox({
        company_id: companyId,
        aggregate_type: 'webhook_delivery',
        aggregate_id: delivery.id,
        event_type: 'platform.webhook.deliver',
        payload: {
          deliveryId: delivery.id,
          subscriptionId: sub.id,
          url: sub.url,
          signingSecret: sub.signing_secret,
          eventType,
          payload,
          attempt: 0,
        },
        status: 'pending',
      });
    }
  }

  /** Used by worker / tests — compute next retry */
  webhookRetryDelay(attempt: number) {
    return nextWebhookDelayMinutes(attempt);
  }

  // ---- Marketplace ----

  listPlugins() {
    return this.repo.listPlugins();
  }

  async listInstallations(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const installs = await this.repo.listInstallations(companyId);
    const plugins = await this.repo.listPlugins();
    const byId = new Map(plugins.map((p) => [p.id, p]));
    return installs.map((i) => ({ ...i, plugin: byId.get(i.pluginId) }));
  }

  async installPlugin(auth: AuthContext, userId: string, pluginId: string, config?: Record<string, unknown>) {
    const companyId = this.companyId(auth);
    const plugin = await this.repo.findPluginById(pluginId);
    if (!plugin) throw new NotFoundException('Plugin not found');

    const installation = await this.repo.upsertInstallation({
      company_id: companyId,
      plugin_id: pluginId,
      status: 'installed',
      config: config || {},
      installed_by: userId,
      installed_at: new Date().toISOString(),
    });

    this.events.emit(PLUGIN_INSTALLED, {
      companyId,
      pluginId,
      slug: plugin.slug,
    });
    await this.audit.log({
      companyId,
      userId,
      module: 'marketplace',
      action: 'plugin.install',
      entity: 'marketplace_installations',
      entityId: installation.id,
      metadata: { slug: plugin.slug },
    });
    return { ...installation, plugin };
  }

  async configurePlugin(auth: AuthContext, installationId: string, config: Record<string, unknown>) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.findInstallationById(installationId);
    if (!existing) throw new NotFoundException('Installation not found');
    if (existing.companyId !== companyId && !auth.isSuperAdmin) {
      throw new ForbiddenException('Installation not in company');
    }
    return this.repo.updateInstallation(installationId, {
      config,
      status: 'configured',
    });
  }

  async removePlugin(auth: AuthContext, userId: string, installationId: string) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.findInstallationById(installationId);
    if (!existing) throw new NotFoundException('Installation not found');
    if (existing.companyId !== companyId && !auth.isSuperAdmin) {
      throw new ForbiddenException('Installation not in company');
    }
    const updated = await this.repo.updateInstallation(installationId, { status: 'removed' });
    this.events.emit(PLUGIN_REMOVED, { companyId, installationId });
    await this.audit.log({
      companyId,
      userId,
      module: 'marketplace',
      action: 'plugin.remove',
      entity: 'marketplace_installations',
      entityId: installationId,
    });
    return updated;
  }

  // ---- Sandbox ----

  async createSandbox(auth: AuthContext, userId: string, dto: CreateSandboxDto) {
    const companyId = this.companyId(auth);
    const sandbox = await this.repo.insertSandbox({
      company_id: companyId,
      name: dto.name,
      status: 'active',
      mock_data: {
        students: 1,
        plans: 1,
        workouts: 1,
      },
      created_by: userId,
    });
    this.events.emit(SANDBOX_CREATED, { companyId, sandboxId: sandbox.id });
    return sandbox;
  }

  listSandboxes(auth: AuthContext) {
    return this.repo.listSandboxes(this.companyId(auth));
  }

  // ---- Observability / hub ----

  usage(auth: AuthContext) {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    return this.repo.usageSummary(this.companyId(auth), since);
  }

  integrationCatalog() {
    return INTEGRATION_CATALOG;
  }

  openApiPublicPaths() {
    return {
      basePath: '/api/v1/public',
      gatewayAlias: '/api/public/v1',
      oauth: '/api/v1/oauth/token',
      endpoints: [
        'GET /alunos',
        'GET /plans',
        'GET /units',
        'GET /workouts',
        'GET /payments',
        'POST /checkins',
        'POST /webhooks',
      ],
      scopes: filterValidScopes([
        'students.read',
        'students.write',
        'finance.read',
        'payments.create',
        'workouts.read',
        'crm.read',
        'analytics.read',
        'webhooks.manage',
        'checkins.create',
      ]),
    };
  }
}
