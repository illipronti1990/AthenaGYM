import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@movvo/shared';
import { CurrentAuth } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
  UnitGuard,
} from '../common/guards/rbac.guards';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UnitsService } from './units.service';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly units: UnitsService) {}

  @Get()
  @Permissions('dashboard.read')
  @ApiQuery({ name: 'companyId', required: false })
  list(@CurrentAuth() auth: AuthContext, @Query('companyId') companyId?: string) {
    return this.units.list(auth, companyId);
  }
}
