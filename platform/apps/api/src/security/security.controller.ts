import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@movvo/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
} from '../common/guards/rbac.guards';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/auth.types';
import { SessionsService } from './sessions.service';
import { MfaService } from './mfa.service';
import { LgpdService } from './lgpd.service';
import { IntegrationSecretsService, RetentionService } from './retention.service';
import { BackupLogsService, SecurityDashboardService } from './dashboard.service';
import {
  BackupStartDto,
  ConsentDto,
  LgpdSubjectDto,
  MfaCodeDto,
  RetentionDto,
  SecretPutDto,
} from './dto/security.dto';
import { InMemoryRateLimitGuard, THROTTLE_KEY } from './rate-limit.guard';

function Throttle(limit: number, windowSec = 60) {
  return SetMetadata(THROTTLE_KEY, { limit, windowSec });
}

@ApiTags('security')
@ApiBearerAuth()
@Controller('security')
export class SecurityController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly mfa: MfaService,
    private readonly lgpd: LgpdService,
    private readonly retention: RetentionService,
    private readonly secrets: IntegrationSecretsService,
    private readonly dashboard: SecurityDashboardService,
    private readonly backups: BackupLogsService,
  ) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('security.read', 'audit.read')
  dashboardKpis(@CurrentAuth() auth: AuthContext) {
    return this.dashboard.kpis(auth);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard, CompanyGuard)
  mySessions(@CurrentUser() user: AuthUser) {
    return this.sessions.listMine(user);
  }

  @Get('sessions/company')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('security.read')
  companySessions(@CurrentAuth() auth: AuthContext) {
    return this.sessions.listCompany(auth);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  revokeSession(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sessions.revoke(user, id);
  }

  @Post('sessions/revoke-all')
  @UseGuards(JwtAuthGuard)
  revokeAll(@CurrentUser() user: AuthUser, @Body() body: { exceptSessionId?: string }) {
    return this.sessions.revokeAll(user, body?.exceptSessionId);
  }

  @Get('mfa')
  @UseGuards(JwtAuthGuard)
  mfaStatus(@CurrentUser() user: AuthUser) {
    return this.mfa.status(user);
  }

  @Post('mfa/totp/enroll')
  @UseGuards(JwtAuthGuard)
  enrollTotp(
    @CurrentUser() user: AuthUser,
    @Req() req: { headers: { authorization?: string } },
  ) {
    const token = (req.headers.authorization || '').slice(7).trim();
    return this.mfa.enrollTotp(user, token);
  }

  @Post('mfa/totp/verify')
  @UseGuards(JwtAuthGuard)
  verifyTotp(
    @CurrentUser() user: AuthUser,
    @Body() dto: MfaCodeDto,
    @Req() req: { headers: { authorization?: string } },
  ) {
    const token = (req.headers.authorization || '').slice(7).trim();
    return this.mfa.verifyTotp(user, token, dto.code);
  }

  @Post('mfa/totp/disable')
  @UseGuards(JwtAuthGuard)
  disableTotp(
    @CurrentUser() user: AuthUser,
    @Req() req: { headers: { authorization?: string } },
  ) {
    const token = (req.headers.authorization || '').slice(7).trim();
    return this.mfa.disableTotp(user, token);
  }

  @Post('mfa/email/send')
  @UseGuards(JwtAuthGuard, InMemoryRateLimitGuard)
  @Throttle(5, 60)
  sendEmailOtp(@CurrentUser() user: AuthUser) {
    return this.mfa.sendEmailOtp(user);
  }

  @Post('mfa/email/verify')
  @UseGuards(JwtAuthGuard, InMemoryRateLimitGuard)
  @Throttle(10, 60)
  verifyEmailOtp(@CurrentUser() user: AuthUser, @Body() dto: MfaCodeDto) {
    return this.mfa.verifyEmailOtp(user, dto.code);
  }

  @Get('lgpd/consents')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('lgpd.read', 'lgpd.manage')
  listConsents(@CurrentAuth() auth: AuthContext) {
    return this.lgpd.listConsents(auth);
  }

  @Post('lgpd/consents')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('lgpd.manage')
  upsertConsent(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() dto: ConsentDto,
  ) {
    return this.lgpd.upsertConsent(auth, user, dto);
  }

  @Get('lgpd/requests')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('lgpd.read', 'lgpd.manage')
  listLgpdRequests(@CurrentAuth() auth: AuthContext) {
    return this.lgpd.listRequests(auth);
  }

  @Post('lgpd/export')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('lgpd.manage')
  exportData(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() dto: LgpdSubjectDto,
  ) {
    return this.lgpd.requestExport(auth, user, dto.subjectUserId);
  }

  @Post('lgpd/anonymize')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('lgpd.manage')
  anonymize(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() dto: LgpdSubjectDto,
  ) {
    if (!dto.subjectUserId) throw new BadRequestException('subjectUserId required');
    return this.lgpd.requestAnonymize(auth, user, dto.subjectUserId);
  }

  @Post('lgpd/erase')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('lgpd.manage')
  erase(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() dto: LgpdSubjectDto,
  ) {
    if (!dto.subjectUserId) throw new BadRequestException('subjectUserId required');
    return this.lgpd.requestErase(auth, user, dto.subjectUserId);
  }

  @Get('retention')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('security.read')
  listRetention(@CurrentAuth() auth: AuthContext) {
    return this.retention.list(auth);
  }

  @Put('retention')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('security.write')
  upsertRetention(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() dto: RetentionDto,
  ) {
    return this.retention.upsert(auth, user, dto);
  }

  @Post('retention/purge')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('security.write')
  runPurge(@CurrentAuth() auth: AuthContext, @Query('companyId') companyId?: string) {
    return this.retention.runPurge(companyId || auth.companyId || undefined);
  }

  @Get('secrets')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('security.read', 'platform.manage')
  listSecrets(@CurrentAuth() auth: AuthContext) {
    return this.secrets.listMeta(auth);
  }

  @Put('secrets')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('security.write', 'platform.manage')
  putSecret(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() dto: SecretPutDto,
  ) {
    return this.secrets.put(auth, user, dto);
  }

  @Get('backups')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('security.read', 'backup.create', 'settings.read')
  listBackups(@CurrentAuth() auth: AuthContext) {
    return this.backups.list(auth);
  }

  @Post('backups')
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('security.write', 'backup.create')
  startBackup(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() dto: BackupStartDto,
  ) {
    return this.backups.start(auth, user, dto);
  }
}
