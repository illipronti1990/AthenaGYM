export const NOTIFICATION_SENT = 'engagement.notification_sent';
export const MESSAGE_SENT = 'engagement.message_sent';
export const MESSAGE_READ = 'engagement.message_read';
export const CAMPAIGN_SENT = 'engagement.campaign_sent';
export const CHALLENGE_JOINED = 'engagement.challenge_joined';
export const LOYALTY_POINTS_EARNED = 'engagement.loyalty_points_earned';
export const ACHIEVEMENT_EARNED = 'engagement.achievement_earned';

export type NotificationSentEvent = {
  companyId: string;
  notificationId: string;
  userId: string;
  channel: string;
};

export type MessageSentEvent = {
  companyId: string;
  conversationId: string;
  messageId: string;
  senderId: string;
};

export type CampaignSentEvent = {
  companyId: string;
  campaignId: string;
  deliveries: number;
};
