import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { PrintsController } from './prints.controller';
import { PrintsService } from './prints.service';

@Module({
  imports: [AuthModule, SettingsModule],
  controllers: [PrintsController],
  providers: [PrintsService],
})
export class PrintsModule {}
