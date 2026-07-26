import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FormsController } from './forms.controller';
import { FormsRepository } from './forms.repository';
import { FormsService } from './forms.service';

@Module({
  imports: [AuthModule],
  controllers: [FormsController],
  providers: [FormsRepository, FormsService],
  exports: [FormsService],
})
export class FormsModule {}
