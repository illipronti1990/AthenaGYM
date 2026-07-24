import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { WorkoutsEventListeners } from './events/workouts-listeners';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsRepository } from './workouts.repository';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [AuthModule, AuditModule, EventEmitterModule.forRoot()],
  controllers: [WorkoutsController],
  providers: [WorkoutsRepository, WorkoutsService, WorkoutsEventListeners],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
