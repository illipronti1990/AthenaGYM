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

  async markNotificationRead(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('notifications')
      .update({ read_at: new Date().toISOString(), status: 'read' })
      .eq('company_id', companyId)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapNotification(data as Record<string, unknown>);
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
}
