import type {
  AppNotification,
  Campaign,
  Challenge,
  ChatMessage,
  Conversation,
  EngagementDashboard,
  LoyaltyAccount,
  RankingEntry,
  AiChatResponse,
} from '@athena/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const engagementApi = {
  dashboard: (t: string) => apiFetch<EngagementDashboard>('/engagement/dashboard', t),
  notifications: (t: string) => apiFetch<AppNotification[]>('/notifications', t),
  sendNotification: (t: string, body: Record<string, unknown>) =>
    apiFetch<AppNotification>('/notifications', t, { method: 'POST', body: JSON.stringify(body) }),
  markRead: (t: string, id: string) =>
    apiFetch<AppNotification>(`/notifications/${id}/read`, t, { method: 'PATCH', body: '{}' }),
  markAllRead: (t: string) =>
    apiFetch<{ updated: number }>('/notifications/read-all', t, { method: 'PATCH', body: '{}' }),
  conversations: (t: string) => apiFetch<Conversation[]>('/conversations', t),
  createConversation: (t: string, body: Record<string, unknown>) =>
    apiFetch<Conversation>('/conversations', t, { method: 'POST', body: JSON.stringify(body) }),
  messages: (t: string, conversationId: string) =>
    apiFetch<ChatMessage[]>(`/messages?conversationId=${conversationId}`, t),
  sendMessage: (t: string, body: Record<string, unknown>) =>
    apiFetch<ChatMessage>('/messages', t, { method: 'POST', body: JSON.stringify(body) }),
  campaigns: (t: string) => apiFetch<Campaign[]>('/campaigns', t),
  createCampaign: (t: string, body: Record<string, unknown>) =>
    apiFetch<Campaign>('/campaigns', t, { method: 'POST', body: JSON.stringify(body) }),
  sendCampaign: (t: string, id: string) =>
    apiFetch(`/campaigns/${id}/send`, t, { method: 'POST', body: '{}' }),
  loyalty: (t: string, studentId: string) =>
    apiFetch<LoyaltyAccount>(`/loyalty?studentId=${studentId}`, t),
  awardPoints: (t: string, body: Record<string, unknown>) =>
    apiFetch<LoyaltyAccount>('/loyalty/points', t, { method: 'POST', body: JSON.stringify(body) }),
  ranking: (t: string) => apiFetch<RankingEntry[]>('/ranking', t),
  challenges: (t: string) => apiFetch<Challenge[]>('/challenges', t),
  createChallenge: (t: string, body: Record<string, unknown>) =>
    apiFetch<Challenge>('/challenges', t, { method: 'POST', body: JSON.stringify(body) }),
  joinChallenge: (t: string, id: string, studentId: string) =>
    apiFetch(`/challenges/${id}/join`, t, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),
  aiChat: (t: string, question: string) =>
    apiFetch<AiChatResponse>('/ai/chat', t, {
      method: 'POST',
      body: JSON.stringify({ question, role: 'manager' }),
    }),
};
