import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { HealthModule } from './health/health.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RolesModule } from './roles/roles.module';
import { SalesModule } from './sales/sales.module';
import { FinanceModule } from './finance/finance.module';
import { OperationsModule } from './operations/operations.module';
import { StudentsModule } from './students/students.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UnitsModule } from './units/units.module';
import { UsersModule } from './users/users.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { EngagementModule } from './engagement/engagement.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PlatformModule } from './platform/platform.module';
import { SettingsModule } from './settings/settings.module';
import { PrintsModule } from './prints/prints.module';
import { PolishModule } from './polish/polish.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuditModule,
    HealthModule,
    AuthModule,
    ProfilesModule,
    CompaniesModule,
    UnitsModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    StudentsModule,
    SalesModule,
    FinanceModule,
    OperationsModule,
    WorkoutsModule,
    EngagementModule,
    AnalyticsModule,
    PlatformModule,
    SettingsModule,
    PrintsModule,
    PolishModule,
    DashboardModule,
  ],
})
export class AppModule {}

