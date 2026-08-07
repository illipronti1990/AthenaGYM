import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SalesEventListeners } from './events/sales-listeners';
import { CrmController } from './crm.controller';
import { SalesController } from './sales.controller';
import { SalesRepository } from './sales.repository';
import { SalesService } from './sales.service';

@Module({
  imports: [AuthModule, AuditModule, EventEmitterModule.forRoot(), forwardRef(() => FinanceModule), forwardRef(() => AnalyticsModule)],
  controllers: [SalesController, CrmController],
  providers: [SalesRepository, SalesService, SalesEventListeners],
  exports: [SalesService],
})
export class SalesModule {}
