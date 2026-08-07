import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@athena/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import { PermissionsGuard } from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SaasBillingService } from './saas-billing.service';

@ApiTags('saas-billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('saas-billing')
export class SaasBillingController {
  constructor(private readonly billing: SaasBillingService) {}

  @Get('plans')
  @Permissions('saas.read', 'saas.billing', 'platform.read')
  plans() {
    return this.billing.listPlans();
  }

  @Post('plans')
  @Permissions('saas.manage')
  upsertPlan(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.billing.upsertPlan(auth, user, body as never);
  }

  @Get('subscription')
  @Permissions('saas.billing', 'saas.read', 'platform.read')
  subscription(@CurrentAuth() auth: AuthContext, @Query('companyId') companyId?: string) {
    return this.billing.getSubscription(auth, companyId);
  }

  @Post('trial')
  @Permissions('saas.billing', 'saas.manage')
  trial(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: { companyId: string; planCode?: string },
  ) {
    return this.billing.startTrial(auth, user, body.companyId, body.planCode);
  }

  @Post('subscribe')
  @Permissions('saas.billing', 'saas.manage')
  subscribe(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: { companyId?: string; planCode: string; billingCycle?: 'monthly' | 'yearly' },
  ) {
    return this.billing.subscribe(auth, user, body);
  }

  @Post('change-plan')
  @Permissions('saas.billing', 'saas.manage')
  changePlan(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body()
    body: { companyId?: string; planCode: string; direction: 'upgrade' | 'downgrade' },
  ) {
    return this.billing.changePlan(auth, user, body);
  }

  @Post('cancel')
  @Permissions('saas.billing', 'saas.manage')
  cancel(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: { companyId?: string; reason?: string },
  ) {
    return this.billing.cancel(auth, user, body.companyId, body.reason);
  }

  @Post('renew')
  @Permissions('saas.billing', 'saas.manage')
  renew(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: { companyId?: string },
  ) {
    return this.billing.renew(auth, user, body.companyId);
  }

  @Get('invoices')
  @Permissions('saas.billing', 'saas.read')
  invoices(@CurrentAuth() auth: AuthContext, @Query('companyId') companyId?: string) {
    return this.billing.listInvoices(auth, companyId);
  }

  @Get('payments')
  @Permissions('saas.billing', 'saas.read')
  payments(@CurrentAuth() auth: AuthContext, @Query('companyId') companyId?: string) {
    return this.billing.listPayments(auth, companyId);
  }

  @Get('limits')
  @Permissions('saas.read', 'saas.billing')
  limits(@CurrentAuth() auth: AuthContext, @Query('companyId') companyId?: string) {
    return this.billing.checkLimits(auth, companyId);
  }

  @Get('dashboard')
  @Permissions('saas.read', 'saas.reports')
  @ApiOperation({ summary: 'SaaS operator KPIs' })
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.billing.dashboard(auth);
  }

  @Get('reports/:kind')
  @Permissions('saas.reports')
  async report(@CurrentAuth() auth: AuthContext, @Param('kind') kind: string) {
    const { filename, csv } = await this.billing.reportCsv(auth, kind);
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get('tickets')
  @Permissions('saas.read', 'saas.billing', 'platform.read')
  tickets(@CurrentAuth() auth: AuthContext, @Query('companyId') companyId?: string) {
    return this.billing.listTickets(auth, companyId);
  }

  @Post('tickets')
  @Permissions('saas.billing', 'platform.read')
  createTicket(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: { subject: string; body: string; companyId?: string },
  ) {
    return this.billing.createTicket(auth, user, body);
  }
}
