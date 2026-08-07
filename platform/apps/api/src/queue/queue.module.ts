import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
