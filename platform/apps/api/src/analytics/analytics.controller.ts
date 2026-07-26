import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@athena/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
  UnitGuard,
} from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AiInsightsDto,
  CreateExportDto,
  CreateReportDto,
  CreateScheduleDto,
  RunPredictionsDto,
} from './dto/analytics.dto';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('analytics/dashboard')
  @Permissions('analytics.read')
  @ApiOperation({ summary: 'Analytics dashboard with KPIs by category' })
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.analytics.dashboard(auth);
  }

  @Get('analytics/kpis')
  @Permissions('analytics.read')
  kpis(@CurrentAuth() auth: AuthContext) {
    return this.analytics.kpis(auth);
  }

  @Get('analytics/churn')
  @Permissions('predictions.read')
  churn(@CurrentAuth() auth: AuthContext) {
    return this.analytics.listPredictions(auth, 'churn');
  }

  @Get('analytics/predictions')
  @Permissions('predictions.read')
  predictions(@CurrentAuth() auth: AuthContext, @Query('type') type?: string) {
    return this.analytics.listPredictions(auth, type);
  }

  @Post('analytics/predictions/run')
  @Permissions('predictions.run')
  runPredictions(@CurrentAuth() auth: AuthContext, @Body() dto: RunPredictionsDto) {
    return this.analytics.runPredictions(auth, dto);
  }

  @Post('analytics/warehouse/sync')
  @Permissions('analytics.manage')
  syncWarehouse(@CurrentAuth() auth: AuthContext) {
    return this.analytics.syncWarehouse(auth);
  }

  @Get('executive')
  @Permissions('executive.read')
  @ApiOperation({ summary: 'Executive KPI strip' })
  executive(@CurrentAuth() auth: AuthContext) {
    return this.analytics.executive(auth);
  }

  @Get('reports')
  @Permissions('reports.read')
  listReports(@CurrentAuth() auth: AuthContext) {
    return this.analytics.listReports(auth);
  }

  @Get('reports/sources')
  @Permissions('reports.read')
  sources() {
    return this.analytics.reportSources();
  }

  @Get('reports/schedules')
  @Permissions('reports.schedule')
  listSchedules(@CurrentAuth() auth: AuthContext) {
    return this.analytics.listSchedules(auth);
  }

  @Post('reports/schedules')
  @Permissions('reports.schedule')
  createSchedule(@CurrentAuth() auth: AuthContext, @Body() dto: CreateScheduleDto) {
    return this.analytics.createSchedule(auth, dto);
  }

  @Post('reports')
  @Permissions('reports.create')
  createReport(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateReportDto,
  ) {
    return this.analytics.createReport(user, auth, dto);
  }

  @Get('reports/:id')
  @Permissions('reports.read')
  getReport(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.analytics.getReport(auth, id);
  }

  @Post('exports')
  @Permissions('reports.export')
  createExport(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateExportDto,
  ) {
    return this.analytics.createExport(user, auth, dto);
  }

  @Get('exports')
  @Permissions('reports.export')
  listExports(@CurrentAuth() auth: AuthContext) {
    return this.analytics.listExports(auth);
  }

  @Post('ai/insights')
  @Permissions('ai.insights')
  @ApiOperation({ summary: 'BI AI insights (stub)' })
  aiInsights(@CurrentAuth() auth: AuthContext, @Body() dto: AiInsightsDto) {
    return this.analytics.aiInsights(auth, dto);
  }
}
