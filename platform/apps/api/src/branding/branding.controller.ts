import { Controller, Get, Headers } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrandingService } from './branding.service';

@ApiTags('branding')
@Controller('branding')
export class BrandingController {
  constructor(private readonly branding: BrandingService) {}

  @Get()
  @ApiOperation({
    summary: 'Public product branding (Movvo) with optional tenant override via X-Company-Id',
  })
  @ApiHeader({ name: 'X-Company-Id', required: false })
  getPublic(
    @Headers('x-company-id') companyId?: string,
    @Headers('host') host?: string,
    @Headers('x-forwarded-host') forwardedHost?: string,
  ) {
    return this.branding.getPublic(companyId, forwardedHost || host);
  }
}
