import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@movvo/shared';
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
  CancelEnrollmentDto,
  ChangePlanDto,
  CompleteEnrollmentDto,
  ConvertLeadDto,
  CreateActivityDto,
  CreateContractDto,
  CreateEnrollmentDto,
  CreateLeadDto,
  CreatePlanDto,
  FreezeEnrollmentDto,
  MoveLeadStageDto,
  RenewEnrollmentDto,
  SignContractDto,
  UpdateLeadDto,
  UpdatePlanDto,
} from './dto/sales.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get('dashboard')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Commercial dashboard KPIs' })
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.sales.dashboard(auth);
  }

  @Get('leads')
  @Permissions('sales.read')
  listLeads(@CurrentAuth() auth: AuthContext) {
    return this.sales.listLeads(auth);
  }

  @Get('leads/:id')
  @Permissions('sales.read')
  getLead(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.sales.getLead(auth, id);
  }

  @Post('leads')
  @Permissions('sales.create')
  createLead(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateLeadDto,
  ) {
    return this.sales.createLead(user, auth, dto);
  }

  @Patch('leads/:id')
  @Permissions('sales.update')
  updateLead(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.sales.updateLead(user, auth, id, dto);
  }

  @Delete('leads/:id')
  @Permissions('sales.delete')
  deleteLead(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.sales.deleteLead(user, auth, id);
  }

  @Post('leads/:id/convert')
  @Permissions('sales.create')
  @ApiOperation({ summary: 'Convert lead to student and mark stage as Matrícula' })
  convertLead(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
  ) {
    return this.sales.convertLead(user, auth, id, dto);
  }

  @Patch('leads/:id/stage')
  @Permissions('sales.pipeline')
  moveStage(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: MoveLeadStageDto,
  ) {
    return this.sales.moveLeadStage(user, auth, id, dto);
  }

  @Get('leads/:id/activities')
  @Permissions('sales.read')
  listActivities(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.sales.listActivities(auth, id);
  }

  @Post('leads/:id/activities')
  @Permissions('sales.create')
  addActivity(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.sales.addActivity(user, auth, id, dto);
  }

  @Get('pipeline')
  @Permissions('sales.pipeline')
  pipeline(@CurrentAuth() auth: AuthContext) {
    return this.sales.getPipeline(auth);
  }

  @Get('sources')
  @Permissions('sales.read')
  sources() {
    return this.sales.listSources();
  }

  @Get('plans')
  @Permissions('sales.plans')
  listPlans(@CurrentAuth() auth: AuthContext) {
    return this.sales.listPlans(auth);
  }

  @Post('plans')
  @Permissions('sales.plans')
  createPlan(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreatePlanDto,
  ) {
    return this.sales.createPlan(user, auth, dto);
  }

  @Patch('plans/:id')
  @Permissions('sales.plans')
  updatePlan(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.sales.updatePlan(user, auth, id, dto);
  }

  @Delete('plans/:id')
  @Permissions('sales.plans')
  @ApiOperation({ summary: 'Soft-delete plan' })
  deletePlan(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.sales.deletePlan(user, auth, id);
  }

  @Get('enrollments/renewals-due')
  @Permissions('sales.read')
  @ApiOperation({ summary: 'Enrollments expiring in N days' })
  renewalsDue(@CurrentAuth() auth: AuthContext, @Query('days') days?: string) {
    return this.sales.listRenewalsDue(auth, days);
  }

  @Post('enrollments/complete')
  @Permissions('sales.create')
  @ApiOperation({ summary: 'Complete enrollment wizard (student + plan + contract + sign)' })
  completeEnrollment(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CompleteEnrollmentDto,
  ) {
    return this.sales.completeEnrollment(user, auth, dto);
  }

  @Get('enrollments')
  @Permissions('sales.read')
  listEnrollments(@CurrentAuth() auth: AuthContext) {
    return this.sales.listEnrollments(auth);
  }

  @Get('enrollments/:id')
  @Permissions('sales.read')
  getEnrollment(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.sales.getEnrollment(auth, id);
  }

  @Get('enrollments/:id/events')
  @Permissions('sales.read')
  enrollmentEvents(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.sales.listEnrollmentEvents(auth, id);
  }

  @Post('enrollments')
  @Permissions('sales.create')
  createEnrollment(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.sales.createEnrollment(user, auth, dto);
  }

  @Post('enrollments/:id/renew')
  @Permissions('sales.update')
  renewEnrollment(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: RenewEnrollmentDto,
  ) {
    return this.sales.renewEnrollment(user, auth, id, dto);
  }

  @Post('enrollments/:id/freeze')
  @Permissions('sales.update')
  freezeEnrollment(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: FreezeEnrollmentDto,
  ) {
    return this.sales.freezeEnrollment(user, auth, id, dto);
  }

  @Post('enrollments/:id/unfreeze')
  @Permissions('sales.update')
  unfreezeEnrollment(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.sales.unfreezeEnrollment(user, auth, id);
  }

  @Post('enrollments/:id/cancel')
  @Permissions('sales.update')
  cancelEnrollment(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: CancelEnrollmentDto,
  ) {
    return this.sales.cancelEnrollment(user, auth, id, dto);
  }

  @Post('enrollments/:id/change-plan')
  @Permissions('sales.update')
  changePlan(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ChangePlanDto,
  ) {
    return this.sales.changePlan(user, auth, id, dto);
  }

  @Get('contracts')
  @Permissions('sales.contracts')
  listContracts(@CurrentAuth() auth: AuthContext) {
    return this.sales.listContracts(auth);
  }

  @Get('contracts/:id')
  @Permissions('sales.contracts')
  getContract(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.sales.getContract(auth, id);
  }

  @Post('contracts')
  @Permissions('sales.contracts')
  createContract(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateContractDto,
  ) {
    return this.sales.createContract(user, auth, dto);
  }

  @Post('contracts/:id/sign')
  @Permissions('sales.contracts')
  signContract(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: SignContractDto,
  ) {
    return this.sales.signContract(user, auth, id, dto);
  }
}
