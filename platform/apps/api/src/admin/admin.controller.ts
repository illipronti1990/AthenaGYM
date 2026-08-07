import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
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
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  @Permissions('admin.read')
  @ApiOperation({ summary: 'Admin KPI dashboard' })
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.admin.dashboard(auth);
  }

  @Get('calendar')
  @Permissions('admin.read')
  calendar(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.admin.calendar(auth, from, to);
  }

  @Get('settings')
  @Permissions('admin.read')
  settings(@CurrentAuth() auth: AuthContext) {
    return this.admin.getSettings(auth);
  }

  @Patch('settings')
  @Permissions('admin.write')
  saveSettings(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: { settings: Record<string, unknown> },
  ) {
    return this.admin.saveSettings(auth, user, body.settings || {});
  }

  // ---- departments / titles ----
  @Get('departments')
  @Permissions('admin.read', 'admin.employees')
  listDepartments(@CurrentAuth() auth: AuthContext) {
    return this.admin.listDepartments(auth);
  }

  @Post('departments')
  @Permissions('admin.write', 'admin.employees')
  upsertDepartment(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: { id?: string; name: string; active?: boolean },
  ) {
    return this.admin.upsertDepartment(auth, user, body);
  }

  @Get('job-titles')
  @Permissions('admin.read', 'admin.employees')
  listJobTitles(@CurrentAuth() auth: AuthContext) {
    return this.admin.listJobTitles(auth);
  }

  @Post('job-titles')
  @Permissions('admin.write', 'admin.employees')
  upsertJobTitle(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body()
    body: { id?: string; name: string; departmentId?: string; active?: boolean },
  ) {
    return this.admin.upsertJobTitle(auth, user, body);
  }

  // ---- employees ----
  @Get('employees')
  @Permissions('admin.employees', 'admin.read')
  listEmployees(@CurrentAuth() auth: AuthContext, @Query('status') status?: string) {
    return this.admin.listEmployees(auth, status);
  }

  @Get('employees/:id')
  @Permissions('admin.employees', 'admin.read')
  getEmployee(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.admin.getEmployee(auth, id);
  }

  @Post('employees')
  @Permissions('admin.employees', 'admin.write')
  createEmployee(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.createEmployee(auth, user, body);
  }

  @Patch('employees/:id')
  @Permissions('admin.employees', 'admin.write')
  updateEmployee(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.updateEmployee(auth, user, id, body);
  }

  @Delete('employees/:id')
  @Permissions('admin.employees', 'admin.write')
  deleteEmployee(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.admin.deleteEmployee(auth, user, id);
  }

  // ---- schedules ----
  @Get('schedules')
  @Permissions('admin.employees', 'admin.read')
  listSchedules(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.admin.listSchedules(auth, from, to, employeeId);
  }

  @Post('schedules')
  @Permissions('admin.employees', 'admin.write')
  upsertSchedule(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.upsertSchedule(auth, user, body);
  }

  // ---- assets ----
  @Get('asset-categories')
  @Permissions('admin.assets', 'admin.read')
  listAssetCategories(@CurrentAuth() auth: AuthContext) {
    return this.admin.listAssetCategories(auth);
  }

  @Post('asset-categories')
  @Permissions('admin.assets', 'admin.write')
  upsertAssetCategory(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: { id?: string; name: string },
  ) {
    return this.admin.upsertAssetCategory(auth, user, body);
  }

  @Get('assets')
  @Permissions('admin.assets', 'admin.read')
  listAssets(@CurrentAuth() auth: AuthContext) {
    return this.admin.listAssets(auth);
  }

  @Post('assets')
  @Permissions('admin.assets', 'admin.write')
  upsertAsset(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.upsertAsset(auth, user, body);
  }

  @Delete('assets/:id')
  @Permissions('admin.assets', 'admin.write')
  deleteAsset(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.admin.deleteAsset(auth, user, id);
  }

  // ---- maintenance ----
  @Get('maintenance')
  @Permissions('admin.maintenance', 'admin.read')
  listMaintenance(@CurrentAuth() auth: AuthContext, @Query('status') status?: string) {
    return this.admin.listMaintenance(auth, status);
  }

  @Post('maintenance')
  @Permissions('admin.maintenance', 'admin.write')
  upsertMaintenance(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.upsertMaintenance(auth, user, body);
  }

  // ---- documents ----
  @Get('document-categories')
  @Permissions('admin.documents', 'admin.read')
  listDocCategories(@CurrentAuth() auth: AuthContext) {
    return this.admin.listDocumentCategories(auth);
  }

  @Get('documents')
  @Permissions('admin.documents', 'admin.read')
  listDocuments(@CurrentAuth() auth: AuthContext) {
    return this.admin.listDocuments(auth);
  }

  @Post('documents')
  @Permissions('admin.documents', 'admin.write')
  upsertDocument(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.upsertDocument(auth, user, body);
  }

  @Delete('documents/:id')
  @Permissions('admin.documents', 'admin.write')
  deleteDocument(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.admin.deleteDocument(auth, user, id);
  }

  // ---- incidents / announcements ----
  @Get('incidents')
  @Permissions('admin.incidents', 'admin.read')
  listIncidents(@CurrentAuth() auth: AuthContext) {
    return this.admin.listIncidents(auth);
  }

  @Post('incidents')
  @Permissions('admin.incidents', 'admin.write')
  upsertIncident(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.upsertIncident(auth, user, body);
  }

  @Get('announcements')
  @Permissions('admin.announcements', 'admin.read')
  listAnnouncements(@CurrentAuth() auth: AuthContext) {
    return this.admin.listAnnouncements(auth);
  }

  @Post('announcements')
  @Permissions('admin.announcements', 'admin.write')
  upsertAnnouncement(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.upsertAnnouncement(auth, user, body);
  }

  // ---- reports ----
  @Get('reports/:kind')
  @Permissions('admin.reports', 'admin.read')
  async report(@CurrentAuth() auth: AuthContext, @Param('kind') kind: string) {
    const { filename, csv } = await this.admin.reportCsv(auth, kind);
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
