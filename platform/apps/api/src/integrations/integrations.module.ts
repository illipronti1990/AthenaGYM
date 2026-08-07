import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsRepository } from './integrations.repository';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsRepository, IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
