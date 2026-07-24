import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current.decorators';
import { AuthUser } from '../auth/auth.types';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProfilesController {
  constructor(private readonly auth: AuthService) {}

  /** @deprecated Prefer GET /auth/me */
  @Get('me')
  @ApiOperation({ summary: 'Alias of /auth/me (Sprint 0 compat)' })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }
}
