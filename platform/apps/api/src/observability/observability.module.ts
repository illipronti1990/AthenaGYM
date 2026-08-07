import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { QueueModule } from '../queue/queue.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import {
  MetricsService,
  RequestContextMiddleware,
} from './observability.core';
import { ObservabilityController } from './observability.controller';
import { ObservabilityService } from './observability.service';

@Module({
  imports: [CacheModule, QueueModule, SupabaseModule, AuthModule],
  controllers: [ObservabilityController],
  providers: [MetricsService, ObservabilityService, RequestContextMiddleware],
  exports: [MetricsService, ObservabilityService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
