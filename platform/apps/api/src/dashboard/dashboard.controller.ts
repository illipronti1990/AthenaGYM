import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthContext, DashboardChartPeriod } from '@movvo/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import { CompanyGuard, PermissionsGuard } from '../common/guards/rbac.guards';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/auth.types';
import { DashboardService } from './dashboard.service';
import { PatchDashboardLayoutDto } from './dto/dashboard.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @Permissions('dashboard.read')
  executive(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Query('period') period?: DashboardChartPeriod,
    @Query('name') name?: string,
  ) {
    const firstName = (name || user.email || 'gestor').split(/[\s@]/)[0];
    return this.dashboard.getExecutive(auth, { period, firstName });
  }

  @Get('kpis')
  @Permissions('dashboard.read')
  kpis(@CurrentAuth() auth: AuthContext) {
    return this.dashboard.getKpis(auth);
  }

  @Get('charts')
  @Permissions('dashboard.read')
  async charts(
    @CurrentAuth() auth: AuthContext,
    @Query('period') period?: DashboardChartPeriod,
  ) {
    const [revenueChart, checkinChart] = await Promise.all([
      this.dashboard.getRevenueChart(auth, period || '30d'),
      this.dashboard.getCheckinChart(auth),
    ]);
    return { revenueChart, checkinChart, period: period || '30d' };
  }

  @Get('agenda')
  @Permissions('dashboard.read')
  agenda(@CurrentAuth() auth: AuthContext) {
    return this.dashboard.getAgenda(auth);
  }

  @Get('activities')
  @Permissions('dashboard.read')
  activities(@CurrentAuth() auth: AuthContext) {
    return this.dashboard.getActivities(auth);
  }

  @Get('birthdays')
  @Permissions('dashboard.read')
  birthdays(@CurrentAuth() auth: AuthContext) {
    return this.dashboard.getBirthdays(auth);
  }

  @Get('goals')
  @Permissions('dashboard.read')
  goals(@CurrentAuth() auth: AuthContext) {
    return this.dashboard.getGoals(auth);
  }

  @Get('layout')
  @Permissions('dashboard.read')
  layout(@CurrentAuth() auth: AuthContext) {
    return this.dashboard.getLayout(auth);
  }

  @Patch('layout')
  @Permissions('dashboard.read')
  saveLayout(@CurrentAuth() auth: AuthContext, @Body() dto: PatchDashboardLayoutDto) {
    return this.dashboard.saveLayout(auth, dto.layout as never);
  }
}
