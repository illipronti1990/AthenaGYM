import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthContext } from '@movvo/shared';
import { CurrentAuth } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import { CompanyGuard, PermissionsGuard } from '../common/guards/rbac.guards';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AutosaveDto, CreateTemplateDto, SignatureDto } from './dto/forms.dto';
import { FormsService } from './forms.service';

@ApiTags('forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
@Controller()
export class FormsController {
  constructor(private readonly forms: FormsService) {}

  @Get('lookup/cep/:cep')
  @Permissions('students.read', 'settings.read')
  @ApiOperation({ summary: 'Lookup CEP (ViaCEP)' })
  lookupCep(@Param('cep') cep: string) {
    return this.forms.lookupCep(cep);
  }

  @Get('lookup/cpf/:cpf')
  @Permissions('students.read')
  @ApiOperation({ summary: 'Valida CPF e detecta aluno existente' })
  lookupCpf(@CurrentAuth() auth: AuthContext, @Param('cpf') cpf: string) {
    return this.forms.lookupCpf(auth, cpf);
  }

  @Post('autosave')
  @Permissions('students.write', 'settings.write', 'workouts.write')
  autosave(@CurrentAuth() auth: AuthContext, @Body() body: AutosaveDto) {
    return this.forms.autosave(auth, body);
  }

  @Get('autosave')
  @Permissions('students.read', 'settings.read', 'workouts.read')
  getDraft(
    @CurrentAuth() auth: AuthContext,
    @Query('formKey') formKey: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.forms.getDraft(auth, formKey, entityId);
  }

  @Get('templates')
  @Permissions('students.read', 'workouts.read', 'sales.read')
  templates(@CurrentAuth() auth: AuthContext, @Query('kind') kind?: string) {
    return this.forms.listTemplates(auth, kind);
  }

  @Post('templates')
  @Permissions('students.write', 'workouts.write', 'sales.write')
  createTemplate(@CurrentAuth() auth: AuthContext, @Body() body: CreateTemplateDto) {
    return this.forms.createTemplate(auth, body);
  }

  @Post('upload')
  @Permissions('students.write', 'sales.write', 'settings.write')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file'))
  upload(@CurrentAuth() auth: AuthContext, @UploadedFile() file: Express.Multer.File) {
    return this.forms.upload(auth, file);
  }

  @Post('signature')
  @Permissions('sales.write', 'students.write')
  signature(@CurrentAuth() auth: AuthContext, @Body() body: SignatureDto) {
    return this.forms.saveSignature(auth, body);
  }
}
