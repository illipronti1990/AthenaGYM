import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
  AiChatDto,
  AiInsightsDto,
  CreateExportDto,
  CreateGoalDto,
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
  dashboard(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.analytics.dashboard(auth, from, to, unitId);
  }

  @Get('analytics/kpis')
  @Permissions('analytics.read')
  kpis(
    @CurrentAuth() auth: AuthContext,
    @Query('category') category?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.analytics.kpis(auth, category, from, to, unitId);
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

  @Get('analytics/forecasts')
  @Permissions('predictions.read')
  forecasts(@CurrentAuth() auth: AuthContext, @Query('type') type?: string) {
    return this.analytics.forecasts(auth, type);
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

  @Get('analytics/heatmaps')
  @Permissions('analytics.read')
  heatmaps(@CurrentAuth() auth: AuthContext, @Query('type') type?: string) {
    return this.analytics.heatmaps(auth, type || 'hours');
  }

  @Get('analytics/compare')
  @Permissions('analytics.read')
  compare(
    @CurrentAuth() auth: AuthContext,
    @Query('metric') metric?: string,
    @Query('period') period?: 'day' | 'month' | 'year',
  ) {
    return this.analytics.compare(auth, metric || 'revenue', period || 'month');
  }

  @Get('analytics/benchmark')
  @Permissions('analytics.read')
  benchmark(@CurrentAuth() auth: AuthContext, @Query('dimension') dimension?: string) {
    return this.analytics.benchmark(auth, dimension || 'teacher');
  }

  @Get('analytics/commercial')
  @Permissions('analytics.read')
  commercial(@CurrentAuth() auth: AuthContext) {
    return this.analytics.commercialInsights(auth);
  }

  @Get('analytics/goals')
  @Permissions('analytics.read', 'analytics.goals')
  listGoals(@CurrentAuth() auth: AuthContext) {
    return this.analytics.listGoals(auth);
  }

  @Post('analytics/goals')
  @Permissions('analytics.read', 'analytics.manage', 'analytics.goals')
  createGoal(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateGoalDto,
  ) {
    return this.analytics.createGoal(user, auth, dto);
  }

  @Get('analytics/alerts')
  @Permissions('analytics.read', 'analytics.alerts')
  listAlerts(@CurrentAuth() auth: AuthContext) {
    return this.analytics.listAlerts(auth);
  }

  @Post('analytics/alerts/refresh')
  @Permissions('analytics.read', 'analytics.manage', 'analytics.alerts')
  refreshAlerts(@CurrentAuth() auth: AuthContext) {
    return this.analytics.refreshAlerts(auth);
  }

  @Patch('analytics/alerts/:id/read')
  @Permissions('analytics.read', 'analytics.alerts')
  markAlertRead(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.analytics.markAlertRead(auth, id);
  }

  @Get('analytics/connectors')
  @Permissions('reports.export')
  connectors(@CurrentAuth() auth: AuthContext) {
    return this.analytics.connectors(auth);
  }

  @Get('executive')
  @Permissions('executive.read')
  @ApiOperation({ summary: 'Executive KPI strip' })
  executive(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.analytics.executive(auth, from, to, unitId);
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
  @ApiOperation({ summary: 'BI AI insights (rule-based)' })
  aiInsights(@CurrentAuth() auth: AuthContext, @Body() dto: AiInsightsDto) {
    return this.analytics.aiInsights(auth, dto);
  }

  @Post('analytics/ai/chat')
  @Permissions('ai.chat', 'ai.insights', 'analytics.read')
  @ApiOperation({ summary: 'Movvo AI chat (rule-based + real data)' })
  aiChat(@CurrentAuth() auth: AuthContext, @Body() dto: AiChatDto) {
    return this.analytics.aiChat(auth, dto);
  }

  @Get('crm/risk')
  @Permissions('predictions.read')
  @ApiOperation({ summary: 'Churn risk list with next-best-actions' })
  crmRisk(@CurrentAuth() auth: AuthContext) {
    return this.analytics.listChurnRisk(auth);
  }

  @Post('crm/risk/refresh')
  @Permissions('predictions.run')
  @ApiOperation({ summary: 'Recompute churn predictions with real data' })
  crmRiskRefresh(@CurrentAuth() auth: AuthContext, @Body() _body: unknown) {
    return this.analytics.refreshChurnRisk(auth);
  }
}
