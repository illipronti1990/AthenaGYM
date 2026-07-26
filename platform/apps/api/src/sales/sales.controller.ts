import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  CreateActivityDto,
  CreateContractDto,
  CreateEnrollmentDto,
  CreateLeadDto,
  CreatePlanDto,
  MoveLeadStageDto,
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

  @Get('enrollments')
  @Permissions('sales.read')
  listEnrollments(@CurrentAuth() auth: AuthContext) {
    return this.sales.listEnrollments(auth);
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
  ) {
    return this.sales.signContract(user, auth, id);
  }
}
