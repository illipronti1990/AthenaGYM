import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@movvo/shared';
import { CurrentAuth } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
  UnitGuard,
} from '../common/guards/rbac.guards';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Post('webhooks/:provider')
  @ApiOperation({ summary: 'Partner webhook (HMAC + idempotency)' })
  webhook(
    @Param('provider') provider: string,
    @Headers('x-signature') signature: string | undefined,
    @Headers('x-hub-signature-256') hubSignature: string | undefined,
    @Headers('x-company-id') companyId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const rawBody = JSON.stringify(body ?? {});
    return this.integrations.handleWebhook(
      provider.toLowerCase(),
      rawBody,
      signature || hubSignature,
      companyId,
      body || {},
    );
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Partners hub list' })
  list(@CurrentAuth() auth: AuthContext) {
    return this.integrations.listHub(auth);
  }

  @Get('logs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('operations.read')
  logs(@CurrentAuth() auth: AuthContext, @Query('provider') provider?: string) {
    return this.integrations.listLogs(auth, provider);
  }

  @Post('logs/:id/retry')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('operations.configure')
  retry(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.integrations.retryLog(auth, id);
  }

  @Get(':provider/dashboard')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('operations.read')
  @ApiOperation({ summary: 'Partner KPI widget' })
  dashboard(@CurrentAuth() auth: AuthContext, @Param('provider') provider: string) {
    return this.integrations.partnerDashboard(auth, provider.toLowerCase());
  }

  @Post(':provider/sync-members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('operations.configure')
  syncMembers(@CurrentAuth() auth: AuthContext, @Param('provider') provider: string) {
    return this.integrations.syncMembers(auth, provider.toLowerCase());
  }

  @Post(':provider/sync-checkins')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('operations.configure')
  syncCheckins(
    @CurrentAuth() auth: AuthContext,
    @Param('provider') provider: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.integrations.syncCheckins(auth, provider.toLowerCase(), from, to);
  }
}
