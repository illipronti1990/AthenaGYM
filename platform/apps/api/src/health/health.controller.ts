import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'athenas-platform-api',
      version: '0.5.0',
      timestamp: new Date().toISOString(),
    };
  }
}
