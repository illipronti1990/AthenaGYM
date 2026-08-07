import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@athena/shared';
import { CurrentAuth } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import { CompanyGuard, PermissionsGuard, UnitGuard } from '../common/guards/rbac.guards';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from '../analytics/analytics.service';
import { SalesService } from './sales.service';

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller('crm')
export class CrmController {
  constructor(
    private readonly sales: SalesService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('dashboard')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'CRM dashboard aggregated KPIs' })
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.sales.crmDashboard(auth);
  }

  @Get('kpis')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'CRM pipeline KPIs' })
  kpis(@CurrentAuth() auth: AuthContext) {
    return this.sales.crmKpis(auth);
  }

  @Get('birthdays')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Students with birthday on given date (default today)' })
  birthdays(@CurrentAuth() auth: AuthContext, @Query('date') date?: string) {
    return this.sales.crmBirthdays(auth, date);
  }

  @Get('recovery')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Cancelled / inactive students for recovery campaigns' })
  recovery(@CurrentAuth() auth: AuthContext) {
    return this.sales.crmRecovery(auth);
  }

  @Get('risk')
  @Permissions('sales.read', 'predictions.read')
  @ApiOperation({ summary: 'Churn risk list with next-best-actions' })
  risk(@CurrentAuth() auth: AuthContext) {
    return this.analytics.listChurnRisk(auth);
  }

  @Post('risk/refresh')
  @Permissions('sales.update', 'predictions.run')
  @ApiOperation({ summary: 'Recompute churn predictions with real data' })
  refreshRisk(@CurrentAuth() auth: AuthContext, @Body() _body: unknown) {
    return this.analytics.refreshChurnRisk(auth);
  }
}
