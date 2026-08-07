'use client';

import type { ChatMsg } from './chatTypes';

const STORAGE_PREFIX = 'movvo-ai-chat-v1';
const MAX_MESSAGES = 80;

export function chatStorageKey(userKey: string): string {
  return `${STORAGE_PREFIX}:${userKey || 'anon'}`;
}

export function loadChatHistory(userKey: string): ChatMsg[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(chatStorageKey(userKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const msgs = parsed.filter(
      (m): m is ChatMsg =>
        !!m &&
        typeof m === 'object' &&
        typeof (m as ChatMsg).id === 'string' &&
        ((m as ChatMsg).role === 'user' || (m as ChatMsg).role === 'assistant') &&
        typeof (m as ChatMsg).content === 'string',
    );
    return msgs.length ? msgs.slice(-MAX_MESSAGES) : null;
  } catch {
    return null;
  }
}

export function saveChatHistory(userKey: string, messages: ChatMsg[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      chatStorageKey(userKey),
      JSON.stringify(messages.slice(-MAX_MESSAGES)),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearChatHistory(userKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(chatStorageKey(userKey));
  } catch {
    /* ignore */
  }
}
