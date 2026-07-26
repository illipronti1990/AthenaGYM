import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthContext } from '@athena/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
} from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatchGymSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings')
  @Permissions('settings.read')
  get(@CurrentAuth() auth: AuthContext) {
    return this.settings.getSettings(auth);
  }

  @Patch('settings')
  @Permissions('settings.update')
  patch(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: PatchGymSettingsDto,
  ) {
    return this.settings.patchSettings(user, auth, dto);
  }

  @Post('settings/logo')
  @Permissions('settings.update')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.settings.uploadLogo(user, auth, file);
  }

  @Get('dashboard')
  @Permissions('dashboard.read')
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.settings.dashboard(auth);
  }

  @Post('backup')
  @Permissions('backup.create')
  backup(@CurrentUser() user: AuthUser, @CurrentAuth() auth: AuthContext) {
    return this.settings.createBackup(user, auth);
  }
}
