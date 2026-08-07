import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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
  ConfigurePluginDto,
  CreateApiClientDto,
  CreateSandboxDto,
  CreateWebhookDto,
  InstallPluginDto,
} from './dto/platform.dto';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('docs')
  @Permissions('platform.read')
  @ApiOperation({ summary: 'Public API OpenAPI summary for developer portal' })
  docs() {
    return this.platform.openApiPublicPaths();
  }

  @Get('usage')
  @Permissions('platform.read')
  usage(@CurrentAuth() auth: AuthContext) {
    return this.platform.usage(auth);
  }

  @Get('clients')
  @Permissions('platform.read')
  clients(@CurrentAuth() auth: AuthContext) {
    return this.platform.listApiClients(auth);
  }

  @Post('clients')
  @Permissions('platform.manage')
  createClient(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateApiClientDto,
  ) {
    return this.platform.createApiClient(auth, user.id, dto);
  }

  @Post('clients/:id/rotate')
  @Permissions('platform.manage')
  rotateClient(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.platform.rotateApiClient(auth, user.id, id);
  }

  @Post('clients/:id/revoke')
  @Permissions('platform.manage')
  revokeClient(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.platform.revokeApiClient(auth, user.id, id);
  }

  @Get('webhooks')
  @Permissions('platform.webhooks')
  webhooks(@CurrentAuth() auth: AuthContext) {
    return this.platform.listWebhooks(auth);
  }

  @Post('webhooks')
  @Permissions('platform.webhooks')
  createWebhook(@CurrentAuth() auth: AuthContext, @Body() dto: CreateWebhookDto) {
    return this.platform.createWebhook(auth, dto);
  }

  @Get('webhooks/deliveries')
  @Permissions('platform.webhooks')
  deliveries(@CurrentAuth() auth: AuthContext) {
    return this.platform.listDeliveries(auth);
  }

  @Post('webhooks/deliveries/:id/replay')
  @Permissions('platform.webhooks')
  replay(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.platform.replayDelivery(auth, id);
  }

  @Patch('webhooks/:id')
  @Permissions('platform.webhooks')
  patchWebhook(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() body: { url?: string; events?: string[]; status?: string },
  ) {
    return this.platform.updateWebhook(auth, id, body);
  }

  @Delete('webhooks/:id')
  @Permissions('platform.webhooks')
  removeWebhook(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.platform.deleteWebhook(auth, id);
  }

  @Get('sandbox')
  @Permissions('platform.read')
  sandboxes(@CurrentAuth() auth: AuthContext) {
    return this.platform.listSandboxes(auth);
  }

  @Post('sandbox')
  @Permissions('platform.manage')
  createSandbox(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSandboxDto,
  ) {
    return this.platform.createSandbox(auth, user.id, dto);
  }

  @Get('integrations')
  @Permissions('integrations.read')
  integrations() {
    return this.platform.integrationCatalog();
  }
}

@ApiTags('marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly platform: PlatformService) {}

  @Get('plugins')
  @Permissions('marketplace.read')
  plugins() {
    return this.platform.listPlugins();
  }

  @Get('installations')
  @Permissions('marketplace.read')
  installations(@CurrentAuth() auth: AuthContext) {
    return this.platform.listInstallations(auth);
  }

  @Post('plugins/:pluginId/install')
  @Permissions('marketplace.manage')
  install(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('pluginId') pluginId: string,
    @Body() dto: InstallPluginDto,
  ) {
    return this.platform.installPlugin(auth, user.id, pluginId, dto.config);
  }

  @Post('installations/:id/configure')
  @Permissions('marketplace.manage')
  configure(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ConfigurePluginDto,
  ) {
    return this.platform.configurePlugin(auth, id, dto.config);
  }

  @Post('installations/:id/remove')
  @Permissions('marketplace.manage')
  remove(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.platform.removePlugin(auth, user.id, id);
  }
}
