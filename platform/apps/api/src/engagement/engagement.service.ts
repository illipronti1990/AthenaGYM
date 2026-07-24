import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  getNotificationProvider,
  LOYALTY_POINTS,
  loyaltyTier,
  type NotificationChannel,
} from '@athenas/sdk-notifications';
import type { AuthContext, AiChatResponse } from '@athenas/shared';
import { AuthUser } from '../auth/auth.types';
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
import {
  ACHIEVEMENT_EARNED,
  CAMPAIGN_SENT,
  LOYALTY_POINTS_EARNED,
  MESSAGE_READ,
  MESSAGE_SENT,
  NOTIFICATION_SENT,
} from './events/engagement.events';
import { EngagementRepository } from './engagement.repository';

@Injectable()
export class EngagementService {
  constructor(
    private readonly repo: EngagementRepository,
    private readonly events: EventEmitter2,
  ) {}

  private companyId(auth: AuthContext) {
    if (!auth.companyId) throw new BadRequestException('companyId required');
    return auth.companyId;
  }

  dashboard(auth: AuthContext) {
    return this.repo.dashboard(this.companyId(auth));
  }

  listNotifications(auth: AuthContext, userId?: string) {
    return this.repo.listNotifications(this.companyId(auth), userId || auth.userId);
  }

  async sendNotification(auth: AuthContext, dto: CreateNotificationDto) {
    const companyId = this.companyId(auth);
    const channel = (dto.channel || 'internal') as NotificationChannel;
    const prefs = await this.repo.ensurePrefs(companyId, dto.userId);

    if (channel === 'push' && prefs.push_enabled === false) {
      throw new ForbiddenException('push_disabled');
    }
    if (channel === 'email' && prefs.email_enabled === false) {
      throw new ForbiddenException('email_disabled');
    }
    if (channel === 'whatsapp' && prefs.whatsapp_enabled === false) {
      throw new ForbiddenException('whatsapp_disabled');
    }

    const provider = getNotificationProvider(channel);
    const send = await provider.send({
      to: dto.userId,
      title: dto.title,
      body: dto.body,
      channel,
    });

    const notification = await this.repo.createNotification({
      company_id: companyId,
      user_id: dto.userId,
      title: dto.title,
      body: dto.body,
      type: dto.type || 'internal',
      channel,
      status: send.ok ? 'sent' : 'failed',
      sent_at: send.ok ? new Date().toISOString() : null,
      payload: { externalId: send.externalId, provider: send.provider },
    });

    this.events.emit(NOTIFICATION_SENT, {
      companyId,
      notificationId: notification.id,
      userId: dto.userId,
      channel,
    });
    return notification;
  }

  markNotificationRead(auth: AuthContext, id: string) {
    return this.repo.markNotificationRead(this.companyId(auth), id);
  }

  listConversations(auth: AuthContext) {
    return this.repo.listConversations(this.companyId(auth));
  }

  async createConversation(user: AuthUser, auth: AuthContext, dto: CreateConversationDto) {
    const companyId = this.companyId(auth);
    const members = [...new Set([user.id, ...(dto.memberIds || [])])];
    if (members.length < 2) throw new BadRequestException('at least 2 members required');

    const conversation = await this.repo.createConversation({
      company_id: companyId,
      type: dto.type || 'direct',
      title: dto.title || null,
      created_by: user.id,
    });
    await this.repo.addMembers(conversation.id, members);
    return conversation;
  }

  listMessages(auth: AuthContext, conversationId: string) {
    return this.repo.listMessages(conversationId);
  }

  async sendMessage(user: AuthUser, auth: AuthContext, dto: CreateMessageDto) {
    const companyId = this.companyId(auth);
    if (!dto.content?.trim()) throw new BadRequestException('content required');

    const message = await this.repo.createMessage({
      conversation_id: dto.conversationId,
      company_id: companyId,
      sender_id: user.id,
      content: dto.content.trim(),
      attachments: [],
    });

    this.events.emit(MESSAGE_SENT, {
      companyId,
      conversationId: dto.conversationId,
      messageId: message.id,
      senderId: user.id,
    });
    return message;
  }

  async markMessageRead(auth: AuthContext, id: string) {
    const message = await this.repo.markMessageRead(id);
    this.events.emit(MESSAGE_READ, {
      companyId: this.companyId(auth),
      messageId: message.id,
      conversationId: message.conversationId,
    });
    return message;
  }

  listCampaigns(auth: AuthContext) {
    return this.repo.listCampaigns(this.companyId(auth));
  }

  async createCampaign(user: AuthUser, auth: AuthContext, dto: CreateCampaignDto) {
    const companyId = this.companyId(auth);
    return this.repo.createCampaign({
      company_id: companyId,
      name: dto.name,
      type: dto.type,
      channel: dto.channel || 'push',
      subject: dto.subject || null,
      body: dto.body,
      status: 'draft',
      schedule_at: dto.scheduleAt || null,
      audience: { profileIds: dto.audienceProfileIds || [] },
      requires_marketing_consent: dto.requiresMarketingConsent !== false,
      created_by: user.id,
    });
  }

  async sendCampaign(auth: AuthContext, campaignId: string) {
    const companyId = this.companyId(auth);
    const row = await this.repo.getCampaign(companyId, campaignId);
    if (!row) throw new NotFoundException('Campaign not found');
    const { campaign, audience, requiresMarketingConsent } = row;

    const profiles = await this.repo.listProfiles(companyId);
    const audienceIds = audience.profileIds || [];
    let targets = profiles;
    if (audienceIds.length) {
      targets = profiles.filter((p) => audienceIds.includes(p.id));
    }

    const deliveries: Record<string, unknown>[] = [];
    let sent = 0;
    for (const profile of targets) {
      const prefs = await this.repo.ensurePrefs(companyId, profile.id);
      if (requiresMarketingConsent && campaign.channel !== 'internal' && prefs.marketing_consent !== true) {
        deliveries.push({
          campaign_id: campaignId,
          profile_id: profile.id,
          channel: campaign.channel,
          status: 'skipped_no_consent',
        });
        continue;
      }

      const provider = getNotificationProvider(campaign.channel as NotificationChannel);
      const result = await provider.send({
        to: profile.email || profile.id,
        title: campaign.subject || campaign.name,
        body: campaign.body,
        channel: campaign.channel as NotificationChannel,
      });

      await this.repo.createNotification({
        company_id: companyId,
        user_id: profile.id,
        title: campaign.subject || campaign.name,
        body: campaign.body,
        type: campaign.type,
        channel: campaign.channel,
        status: result.ok ? 'sent' : 'failed',
        sent_at: result.ok ? new Date().toISOString() : null,
        payload: { campaignId, provider: result.provider },
      });

      deliveries.push({
        campaign_id: campaignId,
        profile_id: profile.id,
        channel: campaign.channel,
        status: result.ok ? 'sent' : 'failed',
        sent_at: result.ok ? new Date().toISOString() : null,
      });
      if (result.ok) sent += 1;
    }

    await this.repo.insertDeliveries(deliveries);
    const updated = await this.repo.updateCampaign(companyId, campaignId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    this.events.emit(CAMPAIGN_SENT, {
      companyId,
      campaignId,
      deliveries: sent,
    });
    return { campaign: updated, deliveries: sent, skipped: deliveries.length - sent };
  }

  getLoyalty(auth: AuthContext, studentId: string) {
    return this.repo.getOrCreateLoyalty(this.companyId(auth), studentId);
  }

  ranking(auth: AuthContext) {
    return this.repo.ranking(this.companyId(auth), 10);
  }

  async awardPoints(auth: AuthContext, dto: AwardPointsDto) {
    const companyId = this.companyId(auth);
    const account = await this.repo.getOrCreateLoyalty(companyId, dto.studentId);
    const map = LOYALTY_POINTS as Record<string, number>;
    const points = dto.points ?? map[dto.reason] ?? 0;
    if (points <= 0) throw new BadRequestException('points required');

    const next = account.points + points;
    const tier = loyaltyTier(next);
    const updated = await this.repo.updateLoyalty(account.id, next, tier);
    await this.repo.insertLedger({
      company_id: companyId,
      student_id: dto.studentId,
      points,
      reason: dto.reason,
    });

    if (dto.reason === 'checkin' && next >= 100) {
      const achievement = await this.repo.grantAchievement({
        company_id: companyId,
        student_id: dto.studentId,
        badge: '100_checkins',
        title: '100 check-ins',
        description: 'Acumulou 100 pontos de check-in / presença',
      });
      this.events.emit(ACHIEVEMENT_EARNED, {
        companyId,
        studentId: dto.studentId,
        badge: achievement.badge,
      });
    }

    this.events.emit(LOYALTY_POINTS_EARNED, {
      companyId,
      studentId: dto.studentId,
      points,
      reason: dto.reason,
      total: next,
    });
    return updated;
  }

  listChallenges(auth: AuthContext) {
    return this.repo.listChallenges(this.companyId(auth));
  }

  createChallenge(auth: AuthContext, dto: CreateChallengeDto) {
    return this.repo.createChallenge({
      company_id: this.companyId(auth),
      title: dto.title,
      description: dto.description || null,
      start_date: dto.startDate,
      end_date: dto.endDate,
      reward: dto.reward || null,
      points_reward: dto.pointsReward ?? 50,
      status: 'active',
    });
  }

  async joinChallenge(auth: AuthContext, challengeId: string, dto: JoinChallengeDto) {
    const challenges = await this.repo.listChallenges(this.companyId(auth));
    if (!challenges.find((c) => c.id === challengeId)) {
      throw new NotFoundException('Challenge not found');
    }
    return this.repo.joinChallenge(challengeId, dto.studentId);
  }

  listAchievements(auth: AuthContext, studentId?: string) {
    return this.repo.listAchievements(this.companyId(auth), studentId);
  }

  async aiChat(auth: AuthContext, dto: AiChatDto): Promise<AiChatResponse> {
    const companyId = this.companyId(auth);
    const q = dto.question.toLowerCase();
    const sources: string[] = [];

    if (q.includes('treino') && (q.includes('hoje') || q.includes('atual'))) {
      const count = await this.repo.countPublishedWorkouts(companyId);
      sources.push('workouts');
      return {
        provider: 'stub-assistant',
        sources,
        answer: `Há ${count} treino(s) publicados na academia. Abra o app ATHENAS Student em Treinos para ver o treino do dia.`,
      };
    }

    if (q.includes('avaliação') && (q.includes('90') || q.includes('sem avaliação'))) {
      const stale = await this.repo.countOverdueAssessmentsHint(companyId);
      sources.push('assessments');
      return {
        provider: 'stub-assistant',
        sources,
        answer: `Encontrei ${stale} aluno(s) cuja última avaliação tem mais de 90 dias (estimativa por última avaliação registrada).`,
      };
    }

    if (q.includes('inadimpl') || q.includes('financeiro')) {
      sources.push('finance');
      return {
        provider: 'stub-assistant',
        sources,
        answer:
          'Consulte o módulo Financeiro → A receber para inadimplência por unidade. Integração analítica completa virá no Integration Hub.',
      };
    }

    if (q.includes('desafio') || q.includes('ranking')) {
      const ranking = await this.repo.ranking(companyId, 3);
      sources.push('loyalty');
      const top = ranking.map((r) => `#${r.position} ${r.studentId.slice(0, 8)}… (${r.points} pts)`).join('; ');
      return {
        provider: 'stub-assistant',
        sources,
        answer: top
          ? `Top ranking: ${top}`
          : 'Ainda não há pontuação de fidelidade. Incentive check-ins e treinos.',
      };
    }

    return {
      provider: 'stub-assistant',
      sources: [],
      answer:
        'Sou o assistente ATHENAS (stub). Pergunte sobre treino do dia, avaliações atrasadas, ranking ou inadimplência.',
    };
  }
}
