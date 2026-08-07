import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@athena/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import { PermissionsGuard } from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @Permissions('roles.read')
  @ApiOperation({ summary: 'List system + company roles with permissions' })
  list(@CurrentAuth() auth: AuthContext) {
    return this.roles.list(auth);
  }

  @Post()
  @Permissions('roles.manage', 'admin.write')
  @ApiOperation({ summary: 'Create company role' })
  create(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; slug: string; description?: string },
  ) {
    return this.roles.create(auth, user, body);
  }

  @Post('assign')
  @Permissions('roles.manage', 'admin.write', 'users.update')
  @ApiOperation({ summary: 'Assign role to user profile' })
  assign(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Body() body: { profileId: string; roleId: string; unitId?: string },
  ) {
    return this.roles.assignUserRole(auth, user, body);
  }

  @Patch(':id')
  @Permissions('roles.manage', 'admin.write')
  @ApiOperation({ summary: 'Update role' })
  update(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.roles.update(auth, user, id, body);
  }

  @Post(':id/permissions')
  @Permissions('roles.manage', 'admin.write')
  @ApiOperation({ summary: 'Replace role permission matrix' })
  setPermissions(
    @CurrentAuth() auth: AuthContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] },
  ) {
    return this.roles.setPermissions(auth, user, id, body.permissionIds || []);
  }
}
