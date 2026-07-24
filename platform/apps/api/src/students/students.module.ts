import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { StudentEventListeners } from './events/student-listeners';
import { StudentsController } from './students.controller';
import { StudentsRepository } from './students.repository';
import { StudentsService } from './students.service';

@Module({
  imports: [AuthModule, AuditModule, EventEmitterModule.forRoot()],
  controllers: [StudentsController],
  providers: [StudentsRepository, StudentsService, StudentEventListeners],
  exports: [StudentsService],
})
export class StudentsModule {}
