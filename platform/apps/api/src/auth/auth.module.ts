import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import {
  CompanyGuard,
  PermissionsGuard,
  RolesGuard,
  UnitGuard,
} from '../common/guards/rbac.guards';
import { AuthContextService } from './auth-context.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [AuditModule],
  controllers: [AuthController],
  providers: [
    JwtAuthGuard,
    AuthContextService,
    AuthService,
    RolesGuard,
    PermissionsGuard,
    CompanyGuard,
    UnitGuard,
  ],
  exports: [
    JwtAuthGuard,
    AuthContextService,
    AuthService,
    RolesGuard,
    PermissionsGuard,
    CompanyGuard,
    UnitGuard,
  ],
})
export class AuthModule {}
