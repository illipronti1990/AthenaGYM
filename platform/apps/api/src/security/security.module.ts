import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { MarketingModule } from '../marketing/marketing.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { SecurityController } from './security.controller';
import { SessionsService } from './sessions.service';
import { MfaService } from './mfa.service';
import { LgpdService } from './lgpd.service';
import { IntegrationSecretsService, RetentionService } from './retention.service';
import { BackupLogsService, SecurityDashboardService } from './dashboard.service';
import { SecurityEventsService } from './security-events.service';
import { SecretsCrypto } from './secrets-crypto';
import { InMemoryRateLimitGuard, RateLimitGuard } from './rate-limit.guard';

@Module({
  imports: [SupabaseModule, AuthModule, AuditModule, MarketingModule],
  controllers: [SecurityController],
  providers: [
    SessionsService,
    MfaService,
    LgpdService,
    RetentionService,
    IntegrationSecretsService,
    SecurityDashboardService,
    BackupLogsService,
    SecurityEventsService,
    SecretsCrypto,
    RateLimitGuard,
    InMemoryRateLimitGuard,
  ],
  exports: [
    SessionsService,
    MfaService,
    SecurityEventsService,
    SecretsCrypto,
    IntegrationSecretsService,
    BackupLogsService,
    RateLimitGuard,
    InMemoryRateLimitGuard,
  ],
})
export class SecurityModule {}
