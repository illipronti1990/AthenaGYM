import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@movvo/shared';
import { CurrentAuth } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
} from '../common/guards/rbac.guards';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrintsService } from './prints.service';

@ApiTags('prints')
@ApiBearerAuth()
@ApiProduces('application/pdf')
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
@Controller('prints')
export class PrintsController {
  constructor(private readonly prints: PrintsService) {}

  @Get('contract/:enrollmentId')
  @Permissions('sales.contracts')
  contract(
    @CurrentAuth() auth: AuthContext,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.prints.contract(auth, enrollmentId);
  }

  @Get('receipt/:paymentId')
  @Permissions('finance.read')
  receipt(
    @CurrentAuth() auth: AuthContext,
    @Param('paymentId') paymentId: string,
  ) {
    return this.prints.receipt(auth, paymentId);
  }

  @Get('declaration/:studentId')
  @Permissions('students.read')
  declaration(
    @CurrentAuth() auth: AuthContext,
    @Param('studentId') studentId: string,
  ) {
    return this.prints.declaration(auth, studentId);
  }

  @Get('assessment/:id')
  @Permissions('assessments.read')
  assessment(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.prints.assessment(auth, id);
  }

  @Get('workout/:id')
  @Permissions('workouts.read')
  workout(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.prints.workout(auth, id);
  }

  @Get('progress/:studentId')
  @Permissions('progress.read')
  progress(
    @CurrentAuth() auth: AuthContext,
    @Param('studentId') studentId: string,
  ) {
    return this.prints.progress(auth, studentId);
  }

  @Get('student/:id')
  @Permissions('students.read')
  student(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.prints.studentSheet(auth, id);
  }
}
