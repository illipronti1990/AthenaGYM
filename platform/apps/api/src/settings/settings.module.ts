import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { AuditController } from '../audit/audit.controller';
import { AuditQueryService } from '../audit/audit-query.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [SettingsController, AuditController],
  providers: [SettingsService, AuditQueryService],
  exports: [SettingsService],
})
export class SettingsModule {}
