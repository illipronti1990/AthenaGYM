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
} from '@athena/sdk-notifications';
import type { AuthContext, AiChatResponse } from '@athena/shared';
import { AuthUser } from '../auth/auth.types';
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
import {
  ACHIEVEMENT_EARNED,
  AUTOMATION_RUN_STARTED,
  CAMPAIGN_SENT,
  LOYALTY_POINTS_EARNED,
  MESSAGE_READ,
  MESSAGE_SENT,
  NOTIFICATION_SENT,
  NPS_RESPONSE_RECEIVED,
  REFERRAL_REWARDED,
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
    return this.repo.markNotificationRead(this.companyId(auth), id, auth.userId);
  }

  markAllNotificationsRead(auth: AuthContext) {
    return this.repo.markAllNotificationsRead(this.companyId(auth), auth.userId);
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
      starts_at: dto.startsAt || null,
      ends_at: dto.endsAt || null,
      goal_value: dto.goalValue ?? null,
      owner_id: dto.ownerId || null,
      discount_pct: dto.discountPct ?? null,
      segment_id: dto.segmentId || null,
      budget: dto.budget ?? null,
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
        answer: `Há ${count} treino(s) publicados na academia. Abra o app Movvo Student em Treinos para ver o treino do dia.`,
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
        'Sou o assistente Movvo AI (stub). Pergunte sobre treino do dia, avaliações atrasadas, ranking ou inadimplência.',
    };
  }

  // ---------- G-9: Templates ----------

  listTemplates(auth: AuthContext) {
    return this.repo.listTemplates(this.companyId(auth));
  }

  async getTemplate(auth: AuthContext, id: string) {
    const t = await this.repo.getTemplate(this.companyId(auth), id);
    if (!t) throw new NotFoundException('Template não encontrado');
    return t;
  }

  async createTemplate(user: AuthUser, auth: AuthContext, dto: CreateTemplateDto) {
    const companyId = this.companyId(auth);
    return this.repo.insertTemplate({
      company_id: companyId,
      channel: dto.channel || 'whatsapp',
      slug: dto.slug,
      name: dto.name,
      subject: dto.subject || null,
      body: dto.body,
      variables: dto.variables || [],
      active: true,
      created_by: user.id,
    });
  }

  async updateTemplate(auth: AuthContext, id: string, dto: UpdateTemplateDto) {
    const companyId = this.companyId(auth);
    await this.getTemplate(auth, id);
    return this.repo.updateTemplate(companyId, id, {
      name: dto.name,
      subject: dto.subject,
      body: dto.body,
      variables: dto.variables,
      active: dto.active,
      updated_at: new Date().toISOString(),
    });
  }

  async sendTemplate(auth: AuthContext, id: string, dto: SendTemplateDto) {
    const companyId = this.companyId(auth);
    const template = await this.getTemplate(auth, id);
    let body = template.body;
    if (dto.variables) {
      for (const [k, v] of Object.entries(dto.variables)) {
        body = body.replace(new RegExp(`{{${k}}}`, 'g'), v);
      }
    }
    const channel = template.channel as NotificationChannel;
    const provider = getNotificationProvider(channel);
    const result = await provider.send({ to: dto.recipientId, title: template.subject || template.name, body, channel });
    await this.repo.createNotification({
      company_id: companyId,
      user_id: dto.recipientId,
      title: template.subject || template.name,
      body,
      type: 'template',
      channel,
      status: result.ok ? 'sent' : 'failed',
      sent_at: result.ok ? new Date().toISOString() : null,
      payload: { templateId: id, provider: result.provider },
    });
    return { ok: result.ok, templateId: id };
  }

  // ---------- G-9: Referrals ----------

  listReferrals(auth: AuthContext) {
    return this.repo.listReferrals(this.companyId(auth));
  }

  async createReferral(user: AuthUser, auth: AuthContext, dto: CreateReferralDto) {
    const companyId = this.companyId(auth);
    const settings = await this.repo.getReferralProgramSettings(companyId);
    return this.repo.insertReferral({
      company_id: companyId,
      referrer_student_id: dto.referrerStudentId,
      referred_lead_id: dto.referredLeadId || null,
      referred_student_id: dto.referredStudentId || null,
      status: 'pending',
      benefit_type: settings ? String(settings.benefit_type) : 'discount',
      benefit_value: settings ? Number(settings.benefit_value) : 30,
      notes: dto.notes || null,
      created_by: user.id,
    });
  }

  async rewardReferral(auth: AuthContext, id: string, dto: RewardReferralDto) {
    const companyId = this.companyId(auth);
    const referrals = await this.repo.listReferrals(companyId);
    const referral = referrals.find((r) => r.id === id);
    if (!referral) throw new NotFoundException('Indicação não encontrada');
    if (referral.status === 'rewarded') throw new BadRequestException('Indicação já recompensada');

    const updated = await this.repo.updateReferral(companyId, id, {
      status: 'rewarded',
      rewarded_at: new Date().toISOString(),
      benefit_type: dto.benefitType || referral.benefitType,
      benefit_value: dto.benefitValue ?? referral.benefitValue,
    });

    this.events.emit(REFERRAL_REWARDED, {
      companyId,
      referralId: id,
      referrerStudentId: referral.referrerStudentId,
      benefitType: updated.benefitType,
      benefitValue: updated.benefitValue,
    });

    return updated;
  }

  // ---------- G-9: Loyalty earn rules / rewards / redemptions ----------

  listEarnRules(auth: AuthContext) {
    return this.repo.listEarnRules(this.companyId(auth));
  }

  listRewards(auth: AuthContext) {
    return this.repo.listRewards(this.companyId(auth));
  }

  async earnLoyalty(auth: AuthContext, dto: EarnLoyaltyDto) {
    const companyId = this.companyId(auth);
    const rules = await this.repo.listEarnRules(companyId);
    const rule = rules.find((r) => r.event === dto.event);
    if (!rule) throw new BadRequestException(`Regra de pontos não encontrada para evento "${dto.event}"`);

    const account = await this.repo.getOrCreateLoyalty(companyId, dto.studentId);
    const next = account.points + rule.points;
    const tier = loyaltyTier(next);
    const updated = await this.repo.updateLoyalty(account.id, next, tier);
    await this.repo.insertLedger({
      company_id: companyId,
      student_id: dto.studentId,
      points: rule.points,
      reason: dto.event,
    });

    this.events.emit(LOYALTY_POINTS_EARNED, {
      companyId,
      studentId: dto.studentId,
      points: rule.points,
      reason: dto.event,
      total: next,
    });

    return updated;
  }

  async redeemLoyalty(auth: AuthContext, dto: RedeemLoyaltyDto) {
    const companyId = this.companyId(auth);
    const [account, reward] = await Promise.all([
      this.repo.getOrCreateLoyalty(companyId, dto.studentId),
      this.repo.getReward(companyId, dto.rewardId),
    ]);
    if (!reward) throw new NotFoundException('Recompensa não encontrada');
    if (account.points < reward.pointsCost) {
      throw new BadRequestException(`Pontos insuficientes. Necessário: ${reward.pointsCost}, disponível: ${account.points}`);
    }

    const newPoints = account.points - reward.pointsCost;
    const tier = loyaltyTier(newPoints);
    await this.repo.updateLoyalty(account.id, newPoints, tier);
    await this.repo.insertLedger({
      company_id: companyId,
      student_id: dto.studentId,
      points: -reward.pointsCost,
      reason: `redeem:${reward.slug}`,
    });

    return this.repo.insertRedemption({
      company_id: companyId,
      student_id: dto.studentId,
      reward_id: dto.rewardId,
      points_spent: reward.pointsCost,
      status: 'pending',
    });
  }

  // ---------- G-9: NPS ----------

  listNpsSurveys(auth: AuthContext) {
    return this.repo.listNpsSurveys(this.companyId(auth));
  }

  async createNpsSurvey(user: AuthUser, auth: AuthContext, dto: CreateNpsSurveyDto) {
    const companyId = this.companyId(auth);
    return this.repo.insertNpsSurvey({
      company_id: companyId,
      title: dto.title || 'Pesquisa NPS',
      question: dto.question || 'Quanto você indicaria a Athena para um amigo?',
      active: true,
      created_by: user.id,
    });
  }

  async createNpsResponse(auth: AuthContext, dto: CreateNpsResponseDto) {
    const companyId = this.companyId(auth);
    const response = await this.repo.insertNpsResponse({
      company_id: companyId,
      survey_id: dto.surveyId,
      student_id: dto.studentId || null,
      score: dto.score,
      comment: dto.comment || null,
      channel: dto.channel || 'app',
    });

    this.events.emit(NPS_RESPONSE_RECEIVED, {
      companyId,
      responseId: response.id,
      surveyId: dto.surveyId,
      score: dto.score,
      studentId: dto.studentId || null,
    });

    return response;
  }

  getNpsDashboard(auth: AuthContext) {
    return this.repo.npsDashboard(this.companyId(auth));
  }

  // ---------- G-9: Segments ----------

  listSegments(auth: AuthContext) {
    return this.repo.listSegments(this.companyId(auth));
  }

  async createSegment(user: AuthUser, auth: AuthContext, dto: CreateSegmentDto) {
    const companyId = this.companyId(auth);
    return this.repo.insertSegment({
      company_id: companyId,
      name: dto.name,
      slug: dto.slug,
      rules: dto.rules || {},
      active: true,
      created_by: user.id,
    });
  }

  async updateSegment(auth: AuthContext, id: string, dto: UpdateSegmentDto) {
    const companyId = this.companyId(auth);
    const seg = await this.repo.getSegment(companyId, id);
    if (!seg) throw new NotFoundException('Segmento não encontrado');
    return this.repo.updateSegment(companyId, id, {
      name: dto.name,
      rules: dto.rules,
      active: dto.active,
      updated_at: new Date().toISOString(),
    });
  }

  async deleteSegment(auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const seg = await this.repo.getSegment(companyId, id);
    if (!seg) throw new NotFoundException('Segmento não encontrado');
    await this.repo.softDeleteSegment(companyId, id);
    return { ok: true };
  }

  async resolveSegment(auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const seg = await this.repo.getSegment(companyId, id);
    if (!seg) throw new NotFoundException('Segmento não encontrado');
    return this.repo.resolveSegmentStudents(companyId);
  }

  // ---------- G-9: Automations ----------

  listAutomationFlows(auth: AuthContext) {
    return this.repo.listAutomationFlows(this.companyId(auth));
  }

  async createAutomationFlow(user: AuthUser, auth: AuthContext, dto: CreateAutomationFlowDto) {
    const companyId = this.companyId(auth);
    return this.repo.insertAutomationFlow({
      company_id: companyId,
      name: dto.name,
      trigger_event: dto.triggerEvent,
      steps: dto.steps || [],
      active: true,
      created_by: user.id,
    });
  }

  async updateAutomationFlow(auth: AuthContext, id: string, dto: UpdateAutomationFlowDto) {
    const companyId = this.companyId(auth);
    const flow = await this.repo.getAutomationFlow(companyId, id);
    if (!flow) throw new NotFoundException('Automação não encontrada');
    return this.repo.updateAutomationFlow(companyId, id, {
      name: dto.name,
      steps: dto.steps,
      active: dto.active,
      updated_at: new Date().toISOString(),
    });
  }

  async deleteAutomationFlow(auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const flow = await this.repo.getAutomationFlow(companyId, id);
    if (!flow) throw new NotFoundException('Automação não encontrada');
    await this.repo.softDeleteAutomationFlow(companyId, id);
    return { ok: true };
  }

  async runAutomationFlow(auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const flow = await this.repo.getAutomationFlow(companyId, id);
    if (!flow) throw new NotFoundException('Automação não encontrada');
    if (!flow.active) throw new BadRequestException('Automação inativa');

    const run = await this.repo.insertAutomationRun({
      company_id: companyId,
      flow_id: id,
      status: 'running',
      context: { manual: true, triggeredAt: new Date().toISOString() },
      steps_log: [],
    });

    const stepsLog = flow.steps.map((step, i) => ({
      step: i,
      type: (step as Record<string, unknown>).type,
      status: 'stub_ok',
      at: new Date().toISOString(),
    }));

    const finished = await this.repo.updateAutomationRun(run.id, {
      status: 'completed',
      steps_log: stepsLog,
      finished_at: new Date().toISOString(),
    });

    this.events.emit(AUTOMATION_RUN_STARTED, { companyId, flowId: id, runId: run.id });

    return finished;
  }

  // ---------- G-9: Portal (student-facing) ----------

  async portalGetActiveSurvey(auth: AuthContext) {
    return this.repo.getActiveSurvey(this.companyId(auth));
  }

  async portalSubmitNps(auth: AuthContext, dto: PortalNpsResponseDto) {
    const companyId = this.companyId(auth);
    const survey = await this.repo.getActiveSurvey(companyId);
    if (!survey) throw new NotFoundException('Nenhuma pesquisa NPS ativa');

    const student = await this.repo.getStudentByEmail(companyId, auth.email || '');

    const response = await this.repo.insertNpsResponse({
      company_id: companyId,
      survey_id: survey.id,
      student_id: student ? String(student.id) : null,
      score: dto.score,
      comment: dto.comment || null,
      channel: 'portal',
    });

    this.events.emit(NPS_RESPONSE_RECEIVED, {
      companyId,
      responseId: response.id,
      surveyId: survey.id,
      score: dto.score,
      studentId: student ? String(student.id) : null,
    });

    return response;
  }

  async portalCreateReferral(user: AuthUser, auth: AuthContext, dto: PortalReferralDto) {
    const companyId = this.companyId(auth);
    const student = await this.repo.getStudentByEmail(companyId, auth.email || '');
    if (!student) throw new NotFoundException('Aluno não encontrado para este usuário');

    const settings = await this.repo.getReferralProgramSettings(companyId);
    return this.repo.insertReferral({
      company_id: companyId,
      referrer_student_id: String(student.id),
      referred_lead_id: null,
      referred_student_id: null,
      status: 'pending',
      benefit_type: settings ? String(settings.benefit_type) : 'discount',
      benefit_value: settings ? Number(settings.benefit_value) : 30,
      notes: dto.notes || (dto.referredName ? `Indicado: ${dto.referredName} (${dto.referredPhone || '—'})` : null),
      created_by: user.id,
    });
  }
}
