import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEventListeners } from './events/analytics-listeners';

@Module({
  imports: [AuthModule, AuditModule, EventEmitterModule.forRoot()],
  controllers: [AnalyticsController],
  providers: [AnalyticsRepository, AnalyticsService, AnalyticsEventListeners],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
