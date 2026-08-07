import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@movvo/shared';
import { CurrentAuth } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import { CompanyGuard, PermissionsGuard } from '../common/guards/rbac.guards';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSavedFilterDto, SaveTablePreferencesDto } from './dto/datagrid.dto';
import { DatagridService } from './datagrid.service';

@ApiTags('datagrid')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
@Controller()
export class DatagridController {
  constructor(private readonly datagrid: DatagridService) {}

  @Get('saved-filters')
  @Permissions('students.read', 'finance.read', 'workouts.read')
  @ApiOperation({ summary: 'Listar filtros salvos da tabela' })
  listFilters(@CurrentAuth() auth: AuthContext, @Query('tableName') tableName: string) {
    return this.datagrid.listSavedFilters(auth, tableName);
  }

  @Post('saved-filters')
  @Permissions('students.read', 'finance.read', 'workouts.read')
  createFilter(@CurrentAuth() auth: AuthContext, @Body() body: CreateSavedFilterDto) {
    return this.datagrid.createSavedFilter(auth, body);
  }

  @Delete('saved-filters/:id')
  @Permissions('students.read', 'finance.read', 'workouts.read')
  deleteFilter(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.datagrid.deleteSavedFilter(auth, id);
  }

  @Get('table-preferences')
  @Permissions('students.read', 'finance.read', 'workouts.read')
  getPrefs(@CurrentAuth() auth: AuthContext, @Query('tableName') tableName: string) {
    return this.datagrid.getPreferences(auth, tableName);
  }

  @Put('table-preferences')
  @Permissions('students.read', 'finance.read', 'workouts.read')
  savePrefs(@CurrentAuth() auth: AuthContext, @Body() body: SaveTablePreferencesDto) {
    return this.datagrid.savePreferences(auth, body);
  }
}
