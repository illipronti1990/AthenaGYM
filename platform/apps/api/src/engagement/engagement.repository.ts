import { Injectable } from '@nestjs/common';
import type {
  Achievement,
  AppNotification,
  Campaign,
  Challenge,
  ChallengeParticipant,
  ChatMessage,
  Conversation,
  EngagementDashboard,
  LoyaltyAccount,
  RankingEntry,
} from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EngagementRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  mapNotification(row: Record<string, unknown>): AppNotification {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      userId: String(row.user_id),
      title: String(row.title),
      body: String(row.body),
      type: String(row.type),
      channel: String(row.channel),
      status: String(row.status),
      readAt: row.read_at ? String(row.read_at) : null,
      createdAt: String(row.created_at),
    };
  }

  mapConversation(row: Record<string, unknown>): Conversation {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      type: String(row.type),
      title: row.title ? String(row.title) : null,
      createdAt: String(row.created_at),
    };
  }

  mapMessage(row: Record<string, unknown>): ChatMessage {
    return {
      id: String(row.id),
      conversationId: String(row.conversation_id),
      senderId: String(row.sender_id),
      content: String(row.content),
      attachments: (row.attachments as unknown[]) || [],
      readAt: row.read_at ? String(row.read_at) : null,
      createdAt: String(row.created_at),
    };
  }

  mapCampaign(row: Record<string, unknown>): Campaign {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      type: String(row.type),
      channel: String(row.channel),
      subject: row.subject ? String(row.subject) : null,
      body: String(row.body),
      status: String(row.status),
      scheduleAt: row.schedule_at ? String(row.schedule_at) : null,
      sentAt: row.sent_at ? String(row.sent_at) : null,
      startsAt: row.starts_at ? String(row.starts_at) : null,
      endsAt: row.ends_at ? String(row.ends_at) : null,
      goalValue: row.goal_value != null ? Number(row.goal_value) : null,
      ownerId: row.owner_id ? String(row.owner_id) : null,
      discountPct: row.discount_pct != null ? Number(row.discount_pct) : null,
      segmentId: row.segment_id ? String(row.segment_id) : null,
      budget: row.budget != null ? Number(row.budget) : null,
    };
  }

  mapLoyalty(row: Record<string, unknown>): LoyaltyAccount {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      studentId: String(row.student_id),
      points: Number(row.points),
      tier: String(row.tier),
    };
  }

  mapChallenge(row: Record<string, unknown>): Challenge {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      startDate: String(row.start_date),
      endDate: String(row.end_date),
      reward: row.reward ? String(row.reward) : null,
      pointsReward: Number(row.points_reward || 0),
      status: String(row.status),
    };
  }

  async listNotifications(companyId: string, userId?: string) {
    let q = this.admin()
      .from('notifications')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapNotification(r as Record<string, unknown>));
  }

  async createNotification(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('notifications')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapNotification(data as Record<string, unknown>);
  }

  async markNotificationRead(companyId: string, id: string, userId: string) {
    const { data, error } = await this.admin()
      .from('notifications')
      .update({ read_at: new Date().toISOString(), status: 'read' })
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapNotification(data as Record<string, unknown>);
  }

  async markAllNotificationsRead(companyId: string, userId: string) {
    const { data, error } = await this.admin()
      .from('notifications')
      .update({ read_at: new Date().toISOString(), status: 'read' })
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .is('read_at', null)
      .select('id');
    if (error) throw error;
    return { updated: (data || []).length };
  }

  async getPrefs(companyId: string, profileId: string) {
    const { data, error } = await this.admin()
      .from('communication_preferences')
      .select('*')
      .eq('company_id', companyId)
      .eq('profile_id', profileId)
      .maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  }

  async ensurePrefs(companyId: string, profileId: string) {
    const existing = await this.getPrefs(companyId, profileId);
    if (existing) return existing;
    const { data, error } = await this.admin()
      .from('communication_preferences')
      .insert({
        company_id: companyId,
        profile_id: profileId,
        marketing_consent: false,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async createConversation(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('conversations')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapConversation(data as Record<string, unknown>);
  }

  async addMembers(conversationId: string, profileIds: string[]) {
    if (!profileIds.length) return;
    const { error } = await this.admin().from('conversation_members').insert(
      profileIds.map((profile_id) => ({ conversation_id: conversationId, profile_id })),
    );
    if (error) throw error;
  }

  async listConversations(companyId: string) {
    const { data, error } = await this.admin()
      .from('conversations')
      .select('*')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapConversation(r as Record<string, unknown>));
  }

  async listMessages(conversationId: string) {
    const { data, error } = await this.admin()
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) throw error;
    return (data || []).map((r) => this.mapMessage(r as Record<string, unknown>));
  }

  async createMessage(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('messages').insert(row).select('*').single();
    if (error) throw error;
    await this.admin()
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', row.conversation_id);
    return this.mapMessage(data as Record<string, unknown>);
  }

  async markMessageRead(id: string) {
    const { data, error } = await this.admin()
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapMessage(data as Record<string, unknown>);
  }

  async getCampaign(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('campaigns')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      campaign: this.mapCampaign(data as Record<string, unknown>),
      audience: ((data as Record<string, unknown>).audience || {}) as {
        profileIds?: string[];
      },
      requiresMarketingConsent: Boolean(
        (data as Record<string, unknown>).requires_marketing_consent,
      ),
    };
  }

  async listCampaigns(companyId: string) {
    const { data, error } = await this.admin()
      .from('campaigns')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapCampaign(r as Record<string, unknown>));
  }

  async createCampaign(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('campaigns').insert(row).select('*').single();
    if (error) throw error;
    return this.mapCampaign(data as Record<string, unknown>);
  }

  async updateCampaign(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('campaigns')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapCampaign(data as Record<string, unknown>);
  }

  async insertDeliveries(rows: Record<string, unknown>[]) {
    if (!rows.length) return;
    const { error } = await this.admin().from('campaign_deliveries').insert(rows);
    if (error) throw error;
  }

  async listProfiles(companyId: string) {
    const { data, error } = await this.admin()
      .from('profiles')
      .select('id, email, full_name')
      .eq('company_id', companyId)
      .is('deleted_at', null);
    if (error) throw error;
    return (data || []) as Array<{ id: string; email: string | null; full_name: string | null }>;
  }

  async getOrCreateLoyalty(companyId: string, studentId: string) {
    const { data, error } = await this.admin()
      .from('loyalty_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (error) throw error;
    if (data) return this.mapLoyalty(data as Record<string, unknown>);
    const { data: created, error: e2 } = await this.admin()
      .from('loyalty_accounts')
      .insert({ company_id: companyId, student_id: studentId, points: 0, tier: 'bronze' })
      .select('*')
      .single();
    if (e2) throw e2;
    return this.mapLoyalty(created as Record<string, unknown>);
  }

  async updateLoyalty(id: string, points: number, tier: string) {
    const { data, error } = await this.admin()
      .from('loyalty_accounts')
      .update({ points, tier })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapLoyalty(data as Record<string, unknown>);
  }

  async insertLedger(row: Record<string, unknown>) {
    const { error } = await this.admin().from('loyalty_ledger').insert(row);
    if (error) throw error;
  }

  async ranking(companyId: string, limit = 10): Promise<RankingEntry[]> {
    const { data, error } = await this.admin()
      .from('loyalty_accounts')
      .select('*')
      .eq('company_id', companyId)
      .order('points', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((r, i) => ({
      studentId: String(r.student_id),
      points: Number(r.points),
      tier: String(r.tier),
      position: i + 1,
    }));
  }

  async listChallenges(companyId: string) {
    const { data, error } = await this.admin()
      .from('challenges')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapChallenge(r as Record<string, unknown>));
  }

  async createChallenge(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('challenges').insert(row).select('*').single();
    if (error) throw error;
    return this.mapChallenge(data as Record<string, unknown>);
  }

  async joinChallenge(challengeId: string, studentId: string): Promise<ChallengeParticipant> {
    const { data, error } = await this.admin()
      .from('challenge_participants')
      .upsert(
        { challenge_id: challengeId, student_id: studentId, score: 0 },
        { onConflict: 'challenge_id,student_id' },
      )
      .select('*')
      .single();
    if (error) throw error;
    const r = data as Record<string, unknown>;
    return {
      id: String(r.id),
      challengeId: String(r.challenge_id),
      studentId: String(r.student_id),
      score: Number(r.score),
      position: r.position != null ? Number(r.position) : null,
    };
  }

  async listAchievements(companyId: string, studentId?: string) {
    let q = this.admin()
      .from('achievements')
      .select('*')
      .eq('company_id', companyId)
      .order('earned_at', { ascending: false });
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        companyId: String(row.company_id),
        studentId: String(row.student_id),
        badge: String(row.badge),
        title: String(row.title),
        description: row.description ? String(row.description) : null,
        earnedAt: String(row.earned_at),
      } satisfies Achievement;
    });
  }

  async grantAchievement(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('achievements')
      .upsert(row, { onConflict: 'company_id,student_id,badge' })
      .select('*')
      .single();
    if (error) throw error;
    const r = data as Record<string, unknown>;
    return {
      id: String(r.id),
      companyId: String(r.company_id),
      studentId: String(r.student_id),
      badge: String(r.badge),
      title: String(r.title),
      description: r.description ? String(r.description) : null,
      earnedAt: String(r.earned_at),
    } satisfies Achievement;
  }

  async dashboard(companyId: string): Promise<EngagementDashboard> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const iso = start.toISOString();

    const { data: msgs } = await this.admin()
      .from('messages')
      .select('id')
      .eq('company_id', companyId)
      .gte('created_at', iso);

    const { data: push } = await this.admin()
      .from('notifications')
      .select('id')
      .eq('company_id', companyId)
      .eq('channel', 'push')
      .in('status', ['sent', 'read']);

    const { data: challenges } = await this.admin()
      .from('challenges')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .is('deleted_at', null);

    const { count: loyaltyMembers } = await this.admin()
      .from('loyalty_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId);

    const { count: students } = await this.admin()
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('deleted_at', null);

    const members = loyaltyMembers || 0;
    const total = students || 0;
    const engaged = total ? Math.round((members / total) * 1000) / 10 : 0;

    return {
      messagesToday: (msgs || []).length,
      pushSent: (push || []).length,
      activeChallenges: (challenges || []).length,
      engagedStudentsPct: engaged,
      loyaltyMembers: members,
    };
  }

  async countPublishedWorkouts(companyId: string) {
    const { count } = await this.admin()
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'published')
      .is('deleted_at', null);
    return count || 0;
  }

  async countOverdueAssessmentsHint(companyId: string) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const { data } = await this.admin()
      .from('assessments')
      .select('student_id, created_at')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    const latest = new Map<string, string>();
    for (const row of data || []) {
      const sid = String(row.student_id);
      if (!latest.has(sid)) latest.set(sid, String(row.created_at));
    }
    let stale = 0;
    for (const at of latest.values()) {
      if (new Date(at) < cutoff) stale += 1;
    }
    return stale;
  }

  // ---------- G-9: Templates ----------

  async listTemplates(companyId: string) {
    const { data, error } = await this.admin()
      .from('message_templates')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapTemplate(r as Record<string, unknown>));
  }

  async getTemplate(companyId: string, id: string) {
    const { data } = await this.admin()
      .from('message_templates')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    return data ? this.mapTemplate(data as Record<string, unknown>) : null;
  }

  async insertTemplate(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('message_templates').insert(row).select('*').single();
    if (error) throw error;
    return this.mapTemplate(data as Record<string, unknown>);
  }

  async updateTemplate(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('message_templates')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapTemplate(data as Record<string, unknown>);
  }

  mapTemplate(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      channel: String(row.channel),
      slug: String(row.slug),
      name: String(row.name),
      subject: row.subject ? String(row.subject) : null,
      body: String(row.body),
      variables: (row.variables as string[]) || [],
      active: Boolean(row.active),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  // ---------- G-9: Referrals ----------

  async listReferrals(companyId: string) {
    const { data, error } = await this.admin()
      .from('referrals')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapReferral(r as Record<string, unknown>));
  }

  async insertReferral(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('referrals').insert(row).select('*').single();
    if (error) throw error;
    return this.mapReferral(data as Record<string, unknown>);
  }

  async updateReferral(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('referrals')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapReferral(data as Record<string, unknown>);
  }

  async getReferralProgramSettings(companyId: string) {
    const { data } = await this.admin()
      .from('referral_program_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();
    return data as Record<string, unknown> | null;
  }

  mapReferral(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      referrerStudentId: String(row.referrer_student_id),
      referredLeadId: row.referred_lead_id ? String(row.referred_lead_id) : null,
      referredStudentId: row.referred_student_id ? String(row.referred_student_id) : null,
      status: String(row.status),
      benefitType: (row.benefit_type as string) || null,
      benefitValue: row.benefit_value != null ? Number(row.benefit_value) : null,
      rewardedAt: row.rewarded_at ? String(row.rewarded_at) : null,
      notes: (row.notes as string) || null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  // ---------- G-9: Loyalty earn rules / rewards / redemptions ----------

  async listEarnRules(companyId: string) {
    const { data, error } = await this.admin()
      .from('loyalty_earn_rules')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('event');
    if (error) throw error;
    return (data || []).map((r) => this.mapEarnRule(r as Record<string, unknown>));
  }

  mapEarnRule(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      event: String(row.event),
      points: Number(row.points),
      active: Boolean(row.active),
      createdAt: String(row.created_at),
    };
  }

  async listRewards(companyId: string) {
    const { data, error } = await this.admin()
      .from('loyalty_rewards')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
      .is('deleted_at', null)
      .order('points_cost');
    if (error) throw error;
    return (data || []).map((r) => this.mapReward(r as Record<string, unknown>));
  }

  async getReward(companyId: string, id: string) {
    const { data } = await this.admin()
      .from('loyalty_rewards')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    return data ? this.mapReward(data as Record<string, unknown>) : null;
  }

  mapReward(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      slug: String(row.slug),
      pointsCost: Number(row.points_cost),
      description: (row.description as string) || null,
      active: Boolean(row.active),
      stock: row.stock != null ? Number(row.stock) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  async insertRedemption(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('loyalty_redemptions').insert(row).select('*').single();
    if (error) throw error;
    return this.mapRedemption(data as Record<string, unknown>);
  }

  mapRedemption(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      studentId: String(row.student_id),
      rewardId: String(row.reward_id),
      pointsSpent: Number(row.points_spent),
      status: String(row.status),
      createdAt: String(row.created_at),
      fulfilledAt: row.fulfilled_at ? String(row.fulfilled_at) : null,
    };
  }

  // ---------- G-9: NPS ----------

  async listNpsSurveys(companyId: string) {
    const { data, error } = await this.admin()
      .from('nps_surveys')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapNpsSurvey(r as Record<string, unknown>));
  }

  async getActiveSurvey(companyId: string) {
    const { data } = await this.admin()
      .from('nps_surveys')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? this.mapNpsSurvey(data as Record<string, unknown>) : null;
  }

  async insertNpsSurvey(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('nps_surveys').insert(row).select('*').single();
    if (error) throw error;
    return this.mapNpsSurvey(data as Record<string, unknown>);
  }

  mapNpsSurvey(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      title: String(row.title),
      question: String(row.question),
      active: Boolean(row.active),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  async insertNpsResponse(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('nps_responses').insert(row).select('*').single();
    if (error) throw error;
    return this.mapNpsResponse(data as Record<string, unknown>);
  }

  mapNpsResponse(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      surveyId: String(row.survey_id),
      studentId: row.student_id ? String(row.student_id) : null,
      score: Number(row.score),
      comment: (row.comment as string) || null,
      channel: String(row.channel || 'app'),
      createdAt: String(row.created_at),
    };
  }

  async npsDashboard(companyId: string) {
    const { data, error } = await this.admin()
      .from('nps_responses')
      .select('score')
      .eq('company_id', companyId);
    if (error) throw error;
    const scores = (data || []).map((r) => Number(r.score));
    const promoters = scores.filter((s) => s >= 9).length;
    const passives = scores.filter((s) => s >= 7 && s <= 8).length;
    const detractors = scores.filter((s) => s <= 6).length;
    const total = scores.length;
    const npsScore = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
    const avgScore = total ? scores.reduce((a, b) => a + b, 0) / total : 0;
    return { totalResponses: total, promoters, passives, detractors, npsScore, avgScore: Math.round(avgScore * 10) / 10 };
  }

  // ---------- G-9: Segments ----------

  async listSegments(companyId: string) {
    const { data, error } = await this.admin()
      .from('audience_segments')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapSegment(r as Record<string, unknown>));
  }

  async getSegment(companyId: string, id: string) {
    const { data } = await this.admin()
      .from('audience_segments')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    return data ? this.mapSegment(data as Record<string, unknown>) : null;
  }

  async insertSegment(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('audience_segments').insert(row).select('*').single();
    if (error) throw error;
    return this.mapSegment(data as Record<string, unknown>);
  }

  async updateSegment(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('audience_segments')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapSegment(data as Record<string, unknown>);
  }

  async softDeleteSegment(companyId: string, id: string) {
    return this.updateSegment(companyId, id, { deleted_at: new Date().toISOString(), active: false });
  }

  async resolveSegmentStudents(companyId: string) {
    const { data: students, count } = await this.admin()
      .from('students')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .limit(500);
    return { count: count || 0, studentIds: (students || []).map((s) => String((s as Record<string, unknown>).id)) };
  }

  mapSegment(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      slug: String(row.slug),
      rules: (row.rules as Record<string, unknown>) || {},
      active: Boolean(row.active),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  // ---------- G-9: Automations ----------

  async listAutomationFlows(companyId: string) {
    const { data, error } = await this.admin()
      .from('automation_flows')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapAutomationFlow(r as Record<string, unknown>));
  }

  async getAutomationFlow(companyId: string, id: string) {
    const { data } = await this.admin()
      .from('automation_flows')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    return data ? this.mapAutomationFlow(data as Record<string, unknown>) : null;
  }

  async insertAutomationFlow(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('automation_flows').insert(row).select('*').single();
    if (error) throw error;
    return this.mapAutomationFlow(data as Record<string, unknown>);
  }

  async updateAutomationFlow(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('automation_flows')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapAutomationFlow(data as Record<string, unknown>);
  }

  async softDeleteAutomationFlow(companyId: string, id: string) {
    return this.updateAutomationFlow(companyId, id, { deleted_at: new Date().toISOString(), active: false });
  }

  async insertAutomationRun(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('automation_runs').insert(row).select('*').single();
    if (error) throw error;
    return this.mapAutomationRun(data as Record<string, unknown>);
  }

  async updateAutomationRun(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('automation_runs')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapAutomationRun(data as Record<string, unknown>);
  }

  mapAutomationFlow(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      triggerEvent: String(row.trigger_event),
      steps: (row.steps as unknown[]) || [],
      active: Boolean(row.active),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  mapAutomationRun(row: Record<string, unknown>) {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      flowId: String(row.flow_id),
      status: String(row.status),
      context: (row.context as Record<string, unknown>) || {},
      stepsLog: (row.steps_log as unknown[]) || [],
      startedAt: String(row.started_at),
      finishedAt: row.finished_at ? String(row.finished_at) : null,
    };
  }

  // ---------- G-9: Portal student lookup ----------

  async getStudentByEmail(companyId: string, email: string) {
    const { data } = await this.admin()
      .from('students')
      .select('id, full_name, email, company_id')
      .eq('company_id', companyId)
      .ilike('email', email)
      .is('deleted_at', null)
      .maybeSingle();
    return data as Record<string, unknown> | null;
  }
}
