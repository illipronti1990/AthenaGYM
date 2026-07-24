import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@athenas/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
  UnitGuard,
} from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  AiChatDto,
  AwardPointsDto,
  CreateCampaignDto,
  CreateChallengeDto,
  CreateConversationDto,
  CreateMessageDto,
  CreateNotificationDto,
  JoinChallengeDto,
} from './dto/engagement.dto';
import { EngagementService } from './engagement.service';

@ApiTags('engagement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller()
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @Get('engagement/dashboard')
  @Permissions('engagement.read')
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.engagement.dashboard(auth);
  }

  @Get('notifications')
  @Permissions('notifications.read')
  listNotifications(@CurrentAuth() auth: AuthContext, @Query('userId') userId?: string) {
    return this.engagement.listNotifications(auth, userId);
  }

  @Post('notifications')
  @Permissions('notifications.send')
  createNotification(@CurrentAuth() auth: AuthContext, @Body() dto: CreateNotificationDto) {
    return this.engagement.sendNotification(auth, dto);
  }

  @Patch('notifications/:id/read')
  @Permissions('notifications.read')
  readNotification(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.engagement.markNotificationRead(auth, id);
  }

  @Get('messages')
  @Permissions('messaging.read')
  @ApiOperation({ summary: 'List messages by conversationId' })
  listMessages(
    @CurrentAuth() auth: AuthContext,
    @Query('conversationId') conversationId: string,
  ) {
    return this.engagement.listMessages(auth, conversationId);
  }

  @Get('conversations')
  @Permissions('messaging.read')
  listConversations(@CurrentAuth() auth: AuthContext) {
    return this.engagement.listConversations(auth);
  }

  @Post('conversations')
  @Permissions('messaging.send')
  createConversation(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateConversationDto,
  ) {
    return this.engagement.createConversation(user, auth, dto);
  }

  @Post('messages')
  @Permissions('messaging.send')
  sendMessage(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateMessageDto,
  ) {
    return this.engagement.sendMessage(user, auth, dto);
  }

  @Patch('messages/:id/read')
  @Permissions('messaging.read')
  readMessage(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.engagement.markMessageRead(auth, id);
  }

  @Get('campaigns')
  @Permissions('campaigns.read')
  listCampaigns(@CurrentAuth() auth: AuthContext) {
    return this.engagement.listCampaigns(auth);
  }

  @Post('campaigns')
  @Permissions('campaigns.manage')
  createCampaign(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.engagement.createCampaign(user, auth, dto);
  }

  @Post('campaigns/:id/send')
  @Permissions('campaigns.manage')
  sendCampaign(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.engagement.sendCampaign(auth, id);
  }

  @Get('loyalty')
  @Permissions('loyalty.read')
  loyalty(@CurrentAuth() auth: AuthContext, @Query('studentId') studentId: string) {
    return this.engagement.getLoyalty(auth, studentId);
  }

  @Post('loyalty/points')
  @Permissions('loyalty.manage')
  awardPoints(@CurrentAuth() auth: AuthContext, @Body() dto: AwardPointsDto) {
    return this.engagement.awardPoints(auth, dto);
  }

  @Get('ranking')
  @Permissions('loyalty.read')
  ranking(@CurrentAuth() auth: AuthContext) {
    return this.engagement.ranking(auth);
  }

  @Get('challenges')
  @Permissions('loyalty.read')
  listChallenges(@CurrentAuth() auth: AuthContext) {
    return this.engagement.listChallenges(auth);
  }

  @Post('challenges')
  @Permissions('loyalty.manage')
  createChallenge(@CurrentAuth() auth: AuthContext, @Body() dto: CreateChallengeDto) {
    return this.engagement.createChallenge(auth, dto);
  }

  @Post('challenges/:id/join')
  @Permissions('loyalty.manage')
  joinChallenge(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: JoinChallengeDto,
  ) {
    return this.engagement.joinChallenge(auth, id, dto);
  }

  @Get('achievements')
  @Permissions('loyalty.read')
  achievements(@CurrentAuth() auth: AuthContext, @Query('studentId') studentId?: string) {
    return this.engagement.listAchievements(auth, studentId);
  }

  @Post('ai/chat')
  @Permissions('ai.chat')
  @ApiOperation({ summary: 'ATHENAS AI assistant (stub, role-aware answers)' })
  aiChat(@CurrentAuth() auth: AuthContext, @Body() dto: AiChatDto) {
    return this.engagement.aiChat(auth, dto);
  }
}
