import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EngagementEventListeners } from './events/engagement-listeners';
import { EngagementController } from './engagement.controller';
import { EngagementRepository } from './engagement.repository';
import { EngagementService } from './engagement.service';

@Module({
  imports: [AuthModule, AuditModule, EventEmitterModule.forRoot()],
  controllers: [EngagementController],
  providers: [EngagementRepository, EngagementService, EngagementEventListeners],
  exports: [EngagementService],
})
export class EngagementModule {}
