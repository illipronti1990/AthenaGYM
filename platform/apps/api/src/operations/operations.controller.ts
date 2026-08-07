import {
  BadRequestException,
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
  AttendanceBatchDto,
  CheckinByCodeDto,
  CheckinByCpfDto,
  CopyWeekDto,
  CreateCheckinDto,
  CreateModalityDto,
  CreatePartnerAccessRequestDto,
  CreateRoomDto,
  CreateScheduleDto,
  EnrollClassDto,
  FromTemplateDto,
  GenerateQrDto,
  OpenGateDto,
  RejectPartnerAccessDto,
  UpdateAccessRulesDto,
  UpdateEnrollmentDto,
  UpdateModalityDto,
  UpdatePartnerIntegrationDto,
  UpdateRoomDto,
  UpdateScheduleDto,
  ValidateAccessDto,
} from './dto/operations.dto';
import { OperationsService } from './operations.service';

@ApiTags('operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller()
export class OperationsController {
  constructor(private readonly ops: OperationsService) {}

  @Get('schedule')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'List agenda / schedules' })
  listSchedule(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
    @Query('teacherId') teacherId?: string,
    @Query('roomId') roomId?: string,
    @Query('modalityId') modalityId?: string,
    @Query('view') view?: string,
  ) {
    return this.ops.listSchedules(auth, {
      from,
      to,
      type,
      teacherId,
      roomId,
      modalityId,
      view,
    });
  }

  @Post('schedule')
  @Permissions('operations.create')
  @ApiOperation({ summary: 'Create schedule entry' })
  createSchedule(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.ops.createSchedule(user, auth, dto);
  }

  @Post('schedule/copy-week')
  @Permissions('operations.create')
  @ApiOperation({ summary: 'Copy week of schedules' })
  copyWeek(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CopyWeekDto,
  ) {
    return this.ops.copyWeek(user, auth, dto);
  }

  @Post('schedule/from-template')
  @Permissions('operations.create')
  @ApiOperation({ summary: 'Generate schedules from weekly template' })
  fromTemplate(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: FromTemplateDto,
  ) {
    return this.ops.fromTemplate(user, auth, dto);
  }

  @Patch('schedule/:id')
  @Permissions('operations.update')
  @ApiOperation({ summary: 'Update schedule' })
  updateSchedule(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.ops.updateSchedule(user, auth, id, dto);
  }

  @Post('schedule/:id/cancel')
  @Permissions('operations.update')
  @ApiOperation({ summary: 'Cancel schedule + audit' })
  cancelSchedule(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.ops.cancelSchedule(user, auth, id);
  }

  @Get('schedule/:id')
  @Permissions('operations.read')
  getSchedule(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.ops.getSchedule(auth, id);
  }

  @Get('agenda/dashboard')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Agenda hub KPIs' })
  agendaDashboard(@CurrentAuth() auth: AuthContext) {
    return this.ops.agendaDashboard(auth);
  }

  @Get('agenda/kpis')
  @Permissions('operations.read')
  agendaKpis(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ops.agendaKpis(auth, from, to);
  }

  @Get('agenda/teacher')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Teacher own agenda' })
  teacherAgenda(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ops.teacherAgenda(auth, from, to);
  }

  @Get('agenda/suggestions')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Grade suggestions stub (heuristic)' })
  agendaSuggestions(@CurrentAuth() auth: AuthContext) {
    return this.ops.agendaSuggestions(auth);
  }

  @Get('portal/agenda')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Student portal agenda' })
  portalAgenda(@CurrentAuth() auth: AuthContext) {
    return this.ops.portalAgenda(auth);
  }

  @Post('portal/agenda/:scheduleId/enroll')
  @Permissions('operations.read')
  portalEnroll(@CurrentAuth() auth: AuthContext, @Param('scheduleId') scheduleId: string) {
    return this.ops.portalEnroll(auth, scheduleId);
  }

  @Delete('portal/agenda/:scheduleId/enroll')
  @Permissions('operations.read')
  portalCancelEnroll(
    @CurrentAuth() auth: AuthContext,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.ops.portalCancelEnroll(auth, scheduleId);
  }

  @Get('classes')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'List class schedules (type=class)' })
  async listClasses(@CurrentAuth() auth: AuthContext) {
    const all = await this.ops.listSchedules(auth, { type: 'class' });
    return all.filter((s) => s.type === 'class');
  }

  @Get('classes/:id/enrollments')
  @Permissions('operations.read')
  listEnrollments(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.ops.listClassEnrollments(auth, id);
  }

  @Post('classes/:id/enroll')
  @Permissions('operations.create')
  @ApiOperation({ summary: 'Reserve class seat or join waitlist' })
  enroll(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: EnrollClassDto,
  ) {
    return this.ops.enroll(auth, id, dto);
  }

  @Delete('classes/:id/enroll')
  @Permissions('operations.update', 'operations.delete')
  @ApiOperation({ summary: 'Cancel reservation and promote waitlist' })
  cancelEnroll(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Query('studentId') studentId: string,
  ) {
    if (!studentId) {
      throw new BadRequestException('studentId query required');
    }
    return this.ops.cancelEnroll(auth, id, studentId);
  }

  @Patch('classes/:id/enrollments/:enrollmentId')
  @Permissions('operations.update')
  updateEnrollment(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.ops.updateEnrollment(user, auth, id, enrollmentId, dto);
  }

  @Post('classes/:id/attendance')
  @Permissions('operations.update')
  @ApiOperation({ summary: 'Batch attendance roll call' })
  attendance(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: AttendanceBatchDto,
  ) {
    return this.ops.attendanceBatch(user, auth, id, dto);
  }

  @Post('classes/:id/complete')
  @Permissions('operations.update')
  @ApiOperation({ summary: 'Complete class + partner consumption stub' })
  completeClass(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.ops.completeClass(user, auth, id);
  }

  @Get('modalities')
  @Permissions('operations.read')
  listModalities(@CurrentAuth() auth: AuthContext) {
    return this.ops.listModalities(auth);
  }

  @Post('modalities')
  @Permissions('operations.create')
  createModality(@CurrentAuth() auth: AuthContext, @Body() dto: CreateModalityDto) {
    return this.ops.createModality(auth, dto);
  }

  @Patch('modalities/:id')
  @Permissions('operations.update')
  updateModality(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateModalityDto,
  ) {
    return this.ops.updateModality(auth, id, dto);
  }

  @Post('checkins')
  @Permissions('operations.checkin')
  @ApiOperation({ summary: 'Register check-in (manual/QR/CPF/code/partner)' })
  createCheckin(@CurrentAuth() auth: AuthContext, @Body() dto: CreateCheckinDto) {
    return this.ops.createCheckin(auth, dto);
  }

  @Post('checkins/by-cpf')
  @Permissions('operations.checkin')
  @ApiOperation({ summary: 'Check-in by CPF' })
  checkinByCpf(@CurrentAuth() auth: AuthContext, @Body() dto: CheckinByCpfDto) {
    return this.ops.createCheckinByCpf(auth, dto);
  }

  @Post('checkins/by-code')
  @Permissions('operations.checkin')
  @ApiOperation({ summary: 'Check-in by access code / card' })
  checkinByCode(@CurrentAuth() auth: AuthContext, @Body() dto: CheckinByCodeDto) {
    return this.ops.createCheckinByCode(auth, dto);
  }

  @Get('checkins/history')
  @Permissions('operations.read')
  history(@CurrentAuth() auth: AuthContext, @Query('studentId') studentId?: string) {
    return this.ops.history(auth, studentId);
  }

  @Get('checkins/agenda')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Check-in timeline for period' })
  agenda(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ops.agendaTimeline(auth, from, to);
  }

  @Post('checkins/qr')
  @Permissions('operations.checkin')
  @ApiOperation({ summary: 'Generate dynamic QR (30s TTL)' })
  generateQr(@CurrentAuth() auth: AuthContext, @Body() dto: GenerateQrDto) {
    return this.ops.generateQr(auth, dto);
  }

  @Post('access/validate')
  @Permissions('operations.access')
  @ApiOperation({ summary: 'Validate student access rules' })
  validate(@CurrentAuth() auth: AuthContext, @Body() dto: ValidateAccessDto) {
    return this.ops.validateAccess(auth, dto);
  }

  @Post('access/open-gate')
  @Permissions('operations.access')
  @ApiOperation({ summary: 'Open turnstile / gate via AccessProvider' })
  openGate(@CurrentAuth() auth: AuthContext, @Body() dto: OpenGateDto) {
    return this.ops.openGate(auth, dto);
  }

  @Get('access/devices')
  @Permissions('operations.read')
  devices(@CurrentAuth() auth: AuthContext) {
    return this.ops.listDevices(auth);
  }

  @Get('access/health')
  @Permissions('operations.access')
  health(@CurrentAuth() auth: AuthContext, @Query('deviceId') deviceId?: string) {
    return this.ops.providerHealth(auth, deviceId);
  }

  @Get('access/rules')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Get access rules for unit' })
  getRules(@CurrentAuth() auth: AuthContext, @Query('unitId') unitId?: string) {
    return this.ops.getAccessRules(auth, unitId);
  }

  @Patch('access/rules')
  @Permissions('operations.configure')
  @ApiOperation({ summary: 'Update access rules' })
  patchRules(@CurrentAuth() auth: AuthContext, @Body() dto: UpdateAccessRulesDto) {
    return this.ops.updateAccessRules(auth, dto);
  }

  @Get('access/live')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Live access feed (polling)' })
  live(@CurrentAuth() auth: AuthContext, @Query('limit') limit?: string) {
    return this.ops.liveAccess(auth, limit ? Number(limit) : 30);
  }

  @Get('presence')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Who is inside now + KPIs' })
  presence(@CurrentAuth() auth: AuthContext) {
    return this.ops.presence(auth);
  }

  @Get('operations/dashboard')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Operations access KPIs' })
  opsDashboard(@CurrentAuth() auth: AuthContext) {
    return this.ops.operationsDashboard(auth);
  }

  @Get('occupancy')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Operational occupancy dashboard' })
  occupancy(@CurrentAuth() auth: AuthContext) {
    return this.ops.occupancy(auth);
  }

  @Get('rooms')
  @Permissions('operations.read')
  rooms(@CurrentAuth() auth: AuthContext) {
    return this.ops.listRooms(auth);
  }

  @Post('rooms')
  @Permissions('operations.configure')
  createRoom(@CurrentAuth() auth: AuthContext, @Body() dto: CreateRoomDto) {
    return this.ops.createRoom(auth, dto);
  }

  @Patch('rooms/:id')
  @Permissions('operations.configure', 'operations.update')
  updateRoom(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.ops.updateRoom(auth, id, dto);
  }

  @Get('partners/integrations')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'List Wellhub / TotalPass integration status' })
  partnerIntegrations(@CurrentAuth() auth: AuthContext) {
    return this.ops.listPartnerIntegrations(auth);
  }

  @Patch('partners/integrations')
  @Permissions('operations.configure')
  @ApiOperation({ summary: 'Enable/disable partner integration' })
  updatePartnerIntegration(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: UpdatePartnerIntegrationDto,
  ) {
    return this.ops.updatePartnerIntegration(auth, dto);
  }

  @Get('partners/access-requests')
  @Permissions('operations.access')
  @ApiOperation({ summary: 'List partner login/access requests for approval' })
  partnerAccessRequests(
    @CurrentAuth() auth: AuthContext,
    @Query('status') status?: string,
  ) {
    return this.ops.listPartnerAccessRequests(auth, status);
  }

  @Post('partners/access-requests')
  @Permissions('operations.access')
  @ApiOperation({ summary: 'Register inbound partner access request (manual/webhook sim)' })
  createPartnerAccessRequest(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreatePartnerAccessRequestDto,
  ) {
    return this.ops.createPartnerAccessRequest(auth, dto);
  }

  @Post('partners/access-requests/:id/approve')
  @Permissions('operations.access')
  @ApiOperation({ summary: 'Approve partner access at reception' })
  approvePartnerAccess(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.ops.approvePartnerAccess(user, auth, id);
  }

  @Post('partners/access-requests/:id/reject')
  @Permissions('operations.access')
  @ApiOperation({ summary: 'Reject partner access at reception' })
  rejectPartnerAccess(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: RejectPartnerAccessDto,
  ) {
    return this.ops.rejectPartnerAccess(user, auth, id, dto);
  }
}
