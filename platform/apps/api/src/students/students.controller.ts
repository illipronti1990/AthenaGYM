import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthContext } from '@athena/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
  UnitGuard,
} from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ChangeStatusDto,
  CreateStudentDto,
  TransferStudentDto,
  UpdateStudentDto,
} from './dto/students.dto';
import { StudentsService } from './students.service';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  @Permissions('students.read')
  @ApiOperation({ summary: 'List students (paginated + filters)' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  list(
    @CurrentAuth() auth: AuthContext,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.students.list(auth, query);
  }

  @Get('search')
  @Permissions('students.read')
  @ApiOperation({ summary: 'Quick search by q=' })
  @ApiQuery({ name: 'q', required: true })
  search(@CurrentAuth() auth: AuthContext, @Query('q') q = '') {
    return this.students.search(auth, q);
  }

  @Get('export')
  @Permissions('students.read')
  @ApiOperation({ summary: 'Export students CSV' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="students.csv"')
  exportCsv(@CurrentAuth() auth: AuthContext) {
    return this.students.exportCsv(auth);
  }

  @Post('import')
  @Permissions('students.create')
  @ApiOperation({ summary: 'Import students CSV' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        csv: { type: 'string' },
        unitId: { type: 'string', format: 'uuid' },
      },
      required: ['csv', 'unitId'],
    },
  })
  importCsv(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() body: { csv: string; unitId: string },
  ) {
    return this.students.importCsv(user, auth, body.csv, body.unitId);
  }

  @Get(':id')
  @Permissions('students.read')
  @ApiOperation({ summary: 'Get student by id' })
  get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.students.getById(auth, id);
  }

  @Get(':id/history')
  @Permissions('students.read')
  @ApiOperation({ summary: 'Status history' })
  history(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.students.history(auth, id);
  }

  @Post()
  @Permissions('students.create')
  @ApiOperation({ summary: 'Create student' })
  create(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateStudentDto,
  ) {
    return this.students.create(user, auth, dto);
  }

  @Patch(':id')
  @Permissions('students.update')
  @ApiOperation({ summary: 'Update student' })
  update(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.students.update(user, auth, id, dto);
  }

  @Delete(':id')
  @Permissions('students.delete')
  @ApiOperation({ summary: 'Soft-delete student' })
  remove(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.students.remove(user, auth, id);
  }

  @Post(':id/status')
  @Permissions('students.update')
  @ApiOperation({ summary: 'Change student status' })
  changeStatus(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.students.changeStatus(user, auth, id, dto);
  }

  @Post(':id/transfer')
  @Permissions('students.update')
  @ApiOperation({ summary: 'Transfer student to another unit' })
  transfer(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: TransferStudentDto,
  ) {
    return this.students.transfer(user, auth, id, dto);
  }

  @Post(':id/photo')
  @Permissions('students.update')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload student photo' })
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.students.uploadPhoto(user, auth, id, file);
  }

  @Post(':id/documents')
  @Permissions('students.update')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload student document' })
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type = 'other',
  ) {
    return this.students.uploadDocument(user, auth, id, file, type);
  }
}
