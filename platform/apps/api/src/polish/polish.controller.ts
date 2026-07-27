import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@athena/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
} from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExportService } from './export.service';
import { PolishService } from './polish.service';

@ApiTags('polish')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
@Controller()
export class PolishController {
  constructor(
    private readonly polish: PolishService,
    private readonly exports: ExportService,
  ) {}

  @Get('search')
  @Permissions('dashboard.read')
  @ApiQuery({ name: 'q', required: true })
  search(@CurrentAuth() auth: AuthContext, @Query('q') q: string) {
    return this.polish.search(auth, q || '');
  }

  @Get('favorites')
  @Permissions('dashboard.read')
  listFavorites(@CurrentUser() user: AuthUser, @CurrentAuth() auth: AuthContext) {
    return this.polish.listFavorites(user, auth);
  }

  @Post('favorites')
  @Permissions('dashboard.read')
  addFavorite(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() body: { href: string; label: string },
  ) {
    return this.polish.addFavorite(user, auth, body);
  }

  @Delete('favorites/:id')
  @Permissions('dashboard.read')
  async removeFavorite(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    await this.polish.removeFavorite(user, auth, id);
    return { ok: true };
  }

  @Get('timeline/:entity/:id')
  @Permissions('dashboard.read')
  timeline(
    @CurrentAuth() auth: AuthContext,
    @Param('entity') entity: string,
    @Param('id') id: string,
  ) {
    return this.polish.timeline(auth, entity, id);
  }

  @Get('exports/alunos')
  @Permissions('students.read')
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'xlsx', 'pdf'] })
  exportAlunos(
    @CurrentAuth() auth: AuthContext,
    @Query('format') format?: string,
  ) {
    return this.exports.exportStudents(auth, this.fmt(format));
  }

  /** @deprecated use exports/alunos */
  @Get('exports/students')
  @Permissions('students.read')
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'xlsx', 'pdf'] })
  exportStudents(
    @CurrentAuth() auth: AuthContext,
    @Query('format') format?: string,
  ) {
    return this.exports.exportStudents(auth, this.fmt(format));
  }

  @Get('exports/receivables')
  @Permissions('finance.read')
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'xlsx', 'pdf'] })
  exportReceivables(
    @CurrentAuth() auth: AuthContext,
    @Query('format') format?: string,
  ) {
    return this.exports.exportReceivables(auth, this.fmt(format));
  }

  @Get('exports/checkins')
  @Permissions('operations.read')
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'xlsx', 'pdf'] })
  exportCheckins(
    @CurrentAuth() auth: AuthContext,
    @Query('format') format?: string,
  ) {
    return this.exports.exportCheckins(auth, this.fmt(format));
  }

  private fmt(format?: string): 'csv' | 'xlsx' | 'pdf' {
    if (format === 'xlsx' || format === 'pdf' || format === 'csv') return format;
    return 'csv';
  }
}
