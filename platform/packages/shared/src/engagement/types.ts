export type NotificationChannel = 'push' | 'email' | 'whatsapp' | 'sms' | 'internal';

export interface MessageTemplate {
  id: string;
  companyId: string;
  channel: string;
  slug: string;
  name: string;
  subject: string | null;
  body: string;
  variables: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  companyId: string;
  referrerStudentId: string;
  referredLeadId: string | null;
  referredStudentId: string | null;
  status: string;
  benefitType: string | null;
  benefitValue: number | null;
  rewardedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyEarnRule {
  id: string;
  companyId: string;
  event: string;
  points: number;
  active: boolean;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  pointsCost: number;
  description: string | null;
  active: boolean;
  stock: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyRedemption {
  id: string;
  companyId: string;
  studentId: string;
  rewardId: string;
  pointsSpent: number;
  status: string;
  createdAt: string;
  fulfilledAt: string | null;
}

export interface NpsSurvey {
  id: string;
  companyId: string;
  title: string;
  question: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NpsResponse {
  id: string;
  companyId: string;
  surveyId: string;
  studentId: string | null;
  score: number;
  comment: string | null;
  channel: string;
  createdAt: string;
}

export interface NpsDashboard {
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
  avgScore: number;
}

export interface AudienceSegment {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  rules: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationFlow {
  id: string;
  companyId: string;
  name: string;
  triggerEvent: string;
  steps: unknown[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRun {
  id: string;
  companyId: string;
  flowId: string;
  status: string;
  context: Record<string, unknown>;
  stepsLog: unknown[];
  startedAt: string;
  finishedAt: string | null;
}

export interface CrmDashboard {
  openLeads: number;
  newLeadsToday: number;
  totalReferrals: number;
  pendingReferrals: number;
  npsScore: number;
  totalNpsResponses: number;
  activeSegments: number;
  activeAutomations: number;
}

export interface CrmKpis {
  conversionRate: number;
  avgLeadResponseHours: number;
  totalWon: number;
  totalLost: number;
  totalOpen: number;
}

export interface ChurnRiskItem {
  studentId: string;
  studentName: string;
  score: number;
  label: string;
  reasons: string[];
  nextBestActions: NextBestAction[];
}

export interface NextBestAction {
  type: string;
  label: string;
  priority: number;
}

export interface AppNotification {
  id: string;
  companyId: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  channel: string;
  status: string;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  companyId: string;
  type: string;
  title: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments: unknown[];
  readAt: string | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  companyId: string;
  name: string;
  type: string;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  scheduleAt: string | null;
  sentAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  goalValue: number | null;
  ownerId: string | null;
  discountPct: number | null;
  segmentId: string | null;
  budget: number | null;
}

export interface LoyaltyAccount {
  id: string;
  companyId: string;
  studentId: string;
  points: number;
  tier: string;
}

export interface Challenge {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  reward: string | null;
  pointsReward: number;
  status: string;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  studentId: string;
  score: number;
  position: number | null;
}

export interface Achievement {
  id: string;
  companyId: string;
  studentId: string;
  badge: string;
  title: string;
  description: string | null;
  earnedAt: string;
}

export interface RankingEntry {
  studentId: string;
  points: number;
  tier: string;
  position: number;
}

export interface EngagementDashboard {
  messagesToday: number;
  pushSent: number;
  activeChallenges: number;
  engagedStudentsPct: number;
  loyaltyMembers: number;
}

export interface AiChatResponse {
  answer: string;
  provider: string;
  sources: string[];
}
