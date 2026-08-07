import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { MarketingController } from './marketing.controller';
import { MarketingMailer } from './marketing.mailer';
import { MarketingService } from './marketing.service';

@Module({
  imports: [SupabaseModule],
  controllers: [MarketingController],
  providers: [MarketingService, MarketingMailer],
  exports: [MarketingService, MarketingMailer],
})
export class MarketingModule {}
