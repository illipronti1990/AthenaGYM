import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@athena/shared';
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
  CreateAutomationFlowDto,
  CreateCampaignDto,
  CreateChallengeDto,
  CreateConversationDto,
  CreateMessageDto,
  CreateNotificationDto,
  CreateNpsResponseDto,
  CreateNpsSurveyDto,
  CreateReferralDto,
  CreateSegmentDto,
  CreateTemplateDto,
  EarnLoyaltyDto,
  JoinChallengeDto,
  PortalNpsResponseDto,
  PortalReferralDto,
  RedeemLoyaltyDto,
  RewardReferralDto,
  SendTemplateDto,
  UpdateAutomationFlowDto,
  UpdateSegmentDto,
  UpdateTemplateDto,
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

  @Patch('notifications/read-all')
  @Permissions('notifications.read')
  readAllNotifications(@CurrentAuth() auth: AuthContext) {
    return this.engagement.markAllNotificationsRead(auth);
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
  @ApiOperation({ summary: 'Movvo AI assistant (stub, role-aware answers)' })
  aiChat(@CurrentAuth() auth: AuthContext, @Body() dto: AiChatDto) {
    return this.engagement.aiChat(auth, dto);
  }

  // ---------- G-9: Templates ----------

  @Get('templates')
  @Permissions('campaigns.read')
  listTemplates(@CurrentAuth() auth: AuthContext) {
    return this.engagement.listTemplates(auth);
  }

  @Post('templates')
  @Permissions('campaigns.manage')
  createTemplate(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.engagement.createTemplate(user, auth, dto);
  }

  @Patch('templates/:id')
  @Permissions('campaigns.manage')
  updateTemplate(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.engagement.updateTemplate(auth, id, dto);
  }

  @Post('templates/:id/send')
  @Permissions('campaigns.manage')
  sendTemplate(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: SendTemplateDto,
  ) {
    return this.engagement.sendTemplate(auth, id, dto);
  }

  // ---------- G-9: Referrals ----------

  @Get('referrals')
  @Permissions('engagement.read')
  listReferrals(@CurrentAuth() auth: AuthContext) {
    return this.engagement.listReferrals(auth);
  }

  @Post('referrals')
  @Permissions('engagement.read')
  createReferral(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateReferralDto,
  ) {
    return this.engagement.createReferral(user, auth, dto);
  }

  @Post('referrals/:id/reward')
  @Permissions('campaigns.manage')
  rewardReferral(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: RewardReferralDto,
  ) {
    return this.engagement.rewardReferral(auth, id, dto);
  }

  // ---------- G-9: Loyalty earn rules / rewards / redemptions ----------

  @Get('loyalty/earn-rules')
  @Permissions('loyalty.read')
  listEarnRules(@CurrentAuth() auth: AuthContext) {
    return this.engagement.listEarnRules(auth);
  }

  @Get('loyalty/rewards')
  @Permissions('loyalty.read')
  listRewards(@CurrentAuth() auth: AuthContext) {
    return this.engagement.listRewards(auth);
  }

  @Post('loyalty/earn')
  @Permissions('loyalty.manage')
  earnLoyalty(@CurrentAuth() auth: AuthContext, @Body() dto: EarnLoyaltyDto) {
    return this.engagement.earnLoyalty(auth, dto);
  }

  @Post('loyalty/redeem')
  @Permissions('loyalty.manage')
  redeemLoyalty(@CurrentAuth() auth: AuthContext, @Body() dto: RedeemLoyaltyDto) {
    return this.engagement.redeemLoyalty(auth, dto);
  }

  // ---------- G-9: NPS ----------

  @Get('nps/surveys')
  @Permissions('engagement.read')
  listNpsSurveys(@CurrentAuth() auth: AuthContext) {
    return this.engagement.listNpsSurveys(auth);
  }

  @Post('nps/surveys')
  @Permissions('campaigns.manage')
  createNpsSurvey(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateNpsSurveyDto,
  ) {
    return this.engagement.createNpsSurvey(user, auth, dto);
  }

  @Post('nps/responses')
  @Permissions('engagement.read')
  createNpsResponse(@CurrentAuth() auth: AuthContext, @Body() dto: CreateNpsResponseDto) {
    return this.engagement.createNpsResponse(auth, dto);
  }

  @Get('nps/dashboard')
  @Permissions('engagement.read')
  npsDashboard(@CurrentAuth() auth: AuthContext) {
    return this.engagement.getNpsDashboard(auth);
  }

  // ---------- G-9: Segments ----------

  @Get('segments')
  @Permissions('campaigns.read')
  listSegments(@CurrentAuth() auth: AuthContext) {
    return this.engagement.listSegments(auth);
  }

  @Post('segments')
  @Permissions('campaigns.manage')
  createSegment(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateSegmentDto,
  ) {
    return this.engagement.createSegment(user, auth, dto);
  }

  @Patch('segments/:id')
  @Permissions('campaigns.manage')
  updateSegment(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateSegmentDto,
  ) {
    return this.engagement.updateSegment(auth, id, dto);
  }

  @Delete('segments/:id')
  @Permissions('campaigns.manage')
  deleteSegment(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.engagement.deleteSegment(auth, id);
  }

  @Post('segments/:id/resolve')
  @Permissions('campaigns.read')
  resolveSegment(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.engagement.resolveSegment(auth, id);
  }

  // ---------- G-9: Automations ----------

  @Get('automations')
  @Permissions('campaigns.read')
  listAutomations(@CurrentAuth() auth: AuthContext) {
    return this.engagement.listAutomationFlows(auth);
  }

  @Post('automations')
  @Permissions('campaigns.manage')
  createAutomation(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateAutomationFlowDto,
  ) {
    return this.engagement.createAutomationFlow(user, auth, dto);
  }

  @Patch('automations/:id')
  @Permissions('campaigns.manage')
  updateAutomation(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateAutomationFlowDto,
  ) {
    return this.engagement.updateAutomationFlow(auth, id, dto);
  }

  @Delete('automations/:id')
  @Permissions('campaigns.manage')
  deleteAutomation(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.engagement.deleteAutomationFlow(auth, id);
  }

  @Post('automations/:id/run')
  @Permissions('campaigns.manage')
  runAutomation(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.engagement.runAutomationFlow(auth, id);
  }

  // ---------- G-9: Portal (student-facing) ----------

  @Get('portal/nps')
  @Permissions('engagement.read', 'loyalty.read')
  @ApiOperation({ summary: 'Portal: get active NPS survey' })
  portalGetNps(@CurrentAuth() auth: AuthContext) {
    return this.engagement.portalGetActiveSurvey(auth);
  }

  @Post('portal/nps')
  @Permissions('engagement.read', 'loyalty.read')
  @ApiOperation({ summary: 'Portal: submit NPS score' })
  portalSubmitNps(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: PortalNpsResponseDto,
  ) {
    return this.engagement.portalSubmitNps(auth, dto);
  }

  @Post('portal/referrals')
  @Permissions('engagement.read', 'loyalty.read')
  @ApiOperation({ summary: 'Portal: student creates referral' })
  portalCreateReferral(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: PortalReferralDto,
  ) {
    return this.engagement.portalCreateReferral(user, auth, dto);
  }
}
