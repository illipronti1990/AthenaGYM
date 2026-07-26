import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthContext } from '@athena/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
  UnitGuard,
} from '../common/guards/rbac.guards';
import { AuthUser } from './auth.types';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  AcceptInviteDto,
  ChangePasswordDto,
  DevLoginDto,
  InviteUserDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('dev-login')
  @ApiOperation({ summary: 'DEV only — login against Supabase profiles (no Auth API)' })
  @ApiResponse({ status: 200, description: 'accessToken + user' })
  @ApiResponse({ status: 401, description: 'Disabled or invalid credentials' })
  devLogin(@Body() dto: DevLoginDto) {
    return this.auth.devLogin(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, CompanyGuard, UnitGuard)
  @ApiOperation({ summary: 'Current profile + RBAC context' })
  @ApiResponse({ status: 200, description: 'MeResponse' })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }

  @Post('invite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard)
  @Permissions('users.create')
  @ApiOperation({ summary: 'Invite user by email' })
  invite(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: InviteUserDto,
    @Headers('x-forwarded-for') ip?: string,
    @Headers('user-agent') browser?: string,
  ) {
    return this.auth.invite(user, auth, dto, ip, browser);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept invite and set password' })
  accept(@Body() dto: AcceptInviteDto) {
    return this.auth.accept(dto);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change password for current user' })
  changePassword(
    @Req() req: { headers: { authorization?: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    const token = (req.headers.authorization || '').slice(7).trim();
    return this.auth.changePassword(token, dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Send password reset email' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update own profile' })
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user, dto);
  }

  @Post('profile/avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile avatar' })
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.auth.uploadAvatar(user, file);
  }
}
