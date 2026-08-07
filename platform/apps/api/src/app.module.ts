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
import { IntegrationsModule } from './integrations/integrations.module';
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
import { FormsModule } from './forms/forms.module';
import { DatagridModule } from './datagrid/datagrid.module';
import { InventoryModule } from './inventory/inventory.module';
import { BrandingModule } from './branding/branding.module';
import { MarketingModule } from './marketing/marketing.module';
import { AdminModule } from './admin/admin.module';
import { SaasBillingModule } from './saas-billing/saas-billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuditModule,
    HealthModule,
    BrandingModule,
    MarketingModule,
    AdminModule,
    SaasBillingModule,
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
    IntegrationsModule,
    WorkoutsModule,
    EngagementModule,
    AnalyticsModule,
    PlatformModule,
    SettingsModule,
    PrintsModule,
    PolishModule,
    DashboardModule,
    FormsModule,
    DatagridModule,
    InventoryModule,
  ],
})
export class AppModule {}

