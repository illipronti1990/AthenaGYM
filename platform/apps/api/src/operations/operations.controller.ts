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
  CreateCheckinDto,
  CreatePartnerAccessRequestDto,
  CreateRoomDto,
  CreateScheduleDto,
  EnrollClassDto,
  GenerateQrDto,
  OpenGateDto,
  RejectPartnerAccessDto,
  UpdatePartnerIntegrationDto,
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

  // --- schedule ---
  @Get('schedule')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'List agenda / schedules' })
  listSchedule(@CurrentAuth() auth: AuthContext) {
    return this.ops.listSchedules(auth);
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

  @Patch('schedule/:id')
  @Permissions('operations.update')
  @ApiOperation({ summary: 'Update schedule' })
  updateSchedule(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.ops.updateSchedule(auth, id, dto);
  }

  @Get('schedule/:id')
  @Permissions('operations.read')
  getSchedule(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.ops.getSchedule(auth, id);
  }

  // --- classes ---
  @Get('classes')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'List class schedules (type=class)' })
  async listClasses(@CurrentAuth() auth: AuthContext) {
    const all = await this.ops.listSchedules(auth);
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
  @Permissions('operations.delete')
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

  // --- checkins ---
  @Post('checkins')
  @Permissions('operations.checkin')
  @ApiOperation({ summary: 'Register check-in (manual/QR/biometric)' })
  createCheckin(@CurrentAuth() auth: AuthContext, @Body() dto: CreateCheckinDto) {
    return this.ops.createCheckin(auth, dto);
  }

  @Get('checkins/history')
  @Permissions('operations.read')
  history(@CurrentAuth() auth: AuthContext, @Query('studentId') studentId?: string) {
    return this.ops.history(auth, studentId);
  }

  @Post('checkins/qr')
  @Permissions('operations.checkin')
  @ApiOperation({ summary: 'Generate dynamic QR (30s TTL)' })
  generateQr(@CurrentAuth() auth: AuthContext, @Body() dto: GenerateQrDto) {
    return this.ops.generateQr(auth, dto);
  }

  // --- access ---
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

  // --- occupancy ---
  @Get('occupancy')
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Operational occupancy dashboard' })
  occupancy(@CurrentAuth() auth: AuthContext) {
    return this.ops.occupancy(auth);
  }

  // --- rooms ---
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

  // --- partner access (Wellhub / TotalPass) ---
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
