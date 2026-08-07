import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../cache/cache.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { HealthController } from './health.controller';

@Module({
  imports: [SupabaseModule, CacheModule, ConfigModule],
  controllers: [HealthController],
})
export class HealthModule {}
