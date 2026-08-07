import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { resolveFeatureFlags } from '@movvo/shared';
import { TenantsService } from './tenants.service';

@ApiTags('platform')
@Controller('platform')
export class PlatformFeaturesController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('features')
  @ApiOperation({ summary: 'Feature flags: env defaults merged with tenant entitlements' })
  async features(
    @Headers('x-company-id') companyId?: string,
    @Query('companyId') companyIdQ?: string,
    @Query('environment') environment?: string,
  ) {
    const envFlags = resolveFeatureFlags(process.env as Record<string, string | undefined>);
    const cid = companyIdQ || companyId;
    if (!cid) return { flags: envFlags, source: 'env' };
    try {
      const ent = await this.tenants.entitlements(cid, environment || 'production');
      const flags = { ...envFlags, ...ent.flags };
      return { flags, limits: ent.limits, usage: ent.usage, planCode: ent.planCode, source: 'entitlements' };
    } catch {
      return { flags: envFlags, source: 'env' };
    }
  }
}
