export type NotificationChannel = 'push' | 'email' | 'whatsapp' | 'sms' | 'internal';

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
