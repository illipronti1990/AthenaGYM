import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import { PermissionsGuard } from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantsService } from './tenants.service';

@ApiTags('platform-tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('platform/tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  @Permissions('saas.read', 'saas.manage')
  @ApiOperation({ summary: 'List SaaS tenants (companies)' })
  list(@CurrentAuth() auth: AuthContext) {
    return this.tenants.list(auth);
  }

  @Post()
  @Permissions('saas.manage')
  create(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      name: string;
      tradeName?: string;
      legalName?: string;
      document?: string;
      planCode?: string;
    },
  ) {
    return this.tenants.create(auth, user, body);
  }

  @Get(':id')
  @Permissions('saas.read', 'saas.manage')
  get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.tenants.get(auth, id);
  }

  @Patch(':id')
  @Permissions('saas.manage')
  update(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.tenants.update(auth, user, id, body);
  }

  @Delete(':id')
  @Permissions('saas.manage')
  remove(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.tenants.softDelete(auth, user, id);
  }

  @Post(':id/suspend')
  @Permissions('saas.manage')
  suspend(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.tenants.suspend(auth, user, id);
  }

  @Post(':id/activate')
  @Permissions('saas.manage')
  activate(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.tenants.activate(auth, user, id);
  }

  @Get(':id/domains')
  @Permissions('saas.read', 'saas.manage', 'platform.manage')
  domains(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.tenants.listDomains(auth, id);
  }

  @Post(':id/domains')
  @Permissions('saas.manage', 'platform.manage')
  addDomain(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { hostname: string },
  ) {
    return this.tenants.addDomain(auth, user, id, body.hostname);
  }

  @Post('domains/:domainId/verify')
  @Permissions('saas.manage', 'platform.manage')
  verifyDomain(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('domainId') domainId: string,
  ) {
    return this.tenants.verifyDomain(auth, user, domainId);
  }

  @Get(':id/entitlements')
  @Permissions('saas.read', 'platform.read')
  entitlements(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Query('environment') environment?: string,
  ) {
    if (!auth.isSuperAdmin && !auth.companyIds.includes(id)) {
      return this.tenants.entitlements(auth.companyId || auth.companyIds[0], environment);
    }
    return this.tenants.entitlements(id, environment);
  }

  @Post(':id/features')
  @Permissions('saas.manage')
  setFeature(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { flagKey: string; enabled: boolean; environment?: string; reason?: string },
  ) {
    return this.tenants.setTenantFeature(auth, user, id, body);
  }
}

@ApiTags('platform')
@Controller('platform')
export class PlatformEntitlementsPublicController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('resolve-host')
  @ApiOperation({ summary: 'Resolve companyId by custom hostname (public)' })
  async resolveHost(@Headers('host') host?: string, @Query('hostname') hostname?: string) {
    const h = hostname || host || '';
    const companyId = await this.tenants.resolveCompanyByHost(h);
    return { companyId, hostname: h };
  }
}
