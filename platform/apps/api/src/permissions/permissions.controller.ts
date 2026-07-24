import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../common/decorators/rbac.decorators';
import { PermissionsGuard } from '../common/guards/rbac.guards';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Permission catalog' })
  async list() {
    const { data } = await this.supabase
      .getAdmin()
      .from('permissions')
      .select('id, module, action, code, description')
      .is('deleted_at', null)
      .order('code');
    return (data || []).map((p) => ({
      id: p.id,
      module: p.module,
      action: p.action,
      code: p.code,
      description: p.description,
    }));
  }
}
