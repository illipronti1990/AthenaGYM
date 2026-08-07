import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@movvo/shared';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CurrentAuth } from '../common/decorators/current.decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompanyGuard, PermissionsGuard } from '../common/guards/rbac.guards';
import { Permissions } from '../common/decorators/rbac.decorators';
import { StorageDomain, StorageService } from './storage.service';

class SignedUploadDto {
  @IsString()
  filename!: string;

  @IsIn([
    'alunos',
    'professores',
    'produtos',
    'documentos',
    'patrimonio',
    'branding',
    'backups',
    'contratos',
    'outros',
  ])
  domain!: StorageDomain;

  @IsOptional()
  @IsString()
  bucket?: string;
}

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('signed-upload')
  @Permissions('settings.update', 'students.update', 'admin.write', 'platform.manage')
  signedUpload(@CurrentAuth() auth: AuthContext, @Body() dto: SignedUploadDto) {
    if (!auth.companyId) throw new BadRequestException('companyId required');
    const path = this.storage.path(auth.companyId, dto.domain, dto.filename);
    const bucket = dto.bucket || 'documents';
    return this.storage.createSignedUpload(bucket, path);
  }

  @Post('signed-download')
  @Permissions('settings.read', 'students.read', 'admin.read', 'platform.read')
  async signedDownload(@Body() body: { bucket?: string; path: string }) {
    if (!body.path) throw new BadRequestException('path required');
    const url = await this.storage.createSignedDownload(
      body.bucket || 'documents',
      body.path,
    );
    return { url };
  }
}
