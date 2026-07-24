import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { OperationsEventListeners } from './events/operations-listeners';
import { OperationsController } from './operations.controller';
import { OperationsRepository } from './operations.repository';
import { OperationsService } from './operations.service';

@Module({
  imports: [AuthModule, AuditModule, EventEmitterModule.forRoot()],
  controllers: [OperationsController],
  providers: [OperationsRepository, OperationsService, OperationsEventListeners],
  exports: [OperationsService],
})
export class OperationsModule {}
