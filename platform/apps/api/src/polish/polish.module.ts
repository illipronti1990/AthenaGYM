import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExportService } from './export.service';
import { PolishController } from './polish.controller';
import { PolishService } from './polish.service';

@Module({
  imports: [AuthModule],
  controllers: [PolishController],
  providers: [PolishService, ExportService],
  exports: [PolishService, ExportService],
})
export class PolishModule {}
