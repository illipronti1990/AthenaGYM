import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PlatformModule } from '../platform/platform.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { SaasBillingController } from './saas-billing.controller';
import { SaasBillingService } from './saas-billing.service';

@Module({
  imports: [SupabaseModule, AuthModule, AuditModule, forwardRef(() => PlatformModule)],
  controllers: [SaasBillingController],
  providers: [SaasBillingService],
  exports: [SaasBillingService],
})
export class SaasBillingModule {}
