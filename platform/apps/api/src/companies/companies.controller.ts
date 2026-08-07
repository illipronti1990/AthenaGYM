import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@movvo/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
} from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompaniesService } from './companies.service';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  @Permissions('dashboard.read')
  list(@CurrentUser() user: AuthUser, @CurrentAuth() auth: AuthContext) {
    return this.companies.list(user, auth);
  }

  @Get(':id')
  @Permissions('dashboard.read')
  get(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.companies.getById(user, auth, id);
  }
}
