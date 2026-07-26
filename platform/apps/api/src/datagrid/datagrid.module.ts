import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatagridController } from './datagrid.controller';
import { DatagridRepository } from './datagrid.repository';
import { DatagridService } from './datagrid.service';

@Module({
  imports: [AuthModule],
  controllers: [DatagridController],
  providers: [DatagridRepository, DatagridService],
  exports: [DatagridService],
})
export class DatagridModule {}
