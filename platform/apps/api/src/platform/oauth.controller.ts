import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OauthTokenDto } from './dto/platform.dto';
import { PlatformService } from './platform.service';

@ApiTags('oauth')
@Controller('oauth')
export class OauthController {
  constructor(private readonly platform: PlatformService) {}

  @Post('token')
  @ApiOperation({
    summary: 'OAuth2 token (client_credentials | refresh_token)',
    description: 'Exchange client_id/client_secret for access + refresh tokens',
  })
  token(@Body() dto: OauthTokenDto) {
    return this.platform.issueToken(dto);
  }
}
