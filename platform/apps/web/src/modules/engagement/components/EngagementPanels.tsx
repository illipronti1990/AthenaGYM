'use client';

import { FormEvent, useEffect, useState } from 'react';
import type {
  AppNotification,
  Campaign,
  Challenge,
  ChatMessage,
  Conversation,
  EngagementDashboard,
  RankingEntry,
} from '@athenas/shared';
import { engagementApi } from '../services/engagementApi';

export function EngagementDashboardPanel({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<EngagementDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    engagementApi
      .dashboard(accessToken)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-zinc-500">Carregando…</p>;

  const cards = [
    ['Mensagens hoje', data.messagesToday],
    ['Push enviados', data.pushSent],
    ['Desafios ativos', data.activeChallenges],
    ['Alunos engajados', `${data.engagedStudentsPct}%`],
    ['Fidelidade', data.loyaltyMembers],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(([label, value]) => (
        <div key={label} className="border-b border-zinc-200 pb-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function NotificationsPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('Volte a treinar');
  const [body, setBody] = useState('Sentimos sua falta na academia!');
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setItems(await engagementApi.notifications(accessToken));
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    try {
      await engagementApi.sendNotification(accessToken, {
        userId,
        title,
        body,
        channel: 'push',
        type: 'winback',
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSend} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          User ID (profile)
          <input
            className="mt-1 block w-72 rounded border border-zinc-300 px-2 py-1.5 font-mono text-xs"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Título
          <input
            className="mt-1 block rounded border border-zinc-300 px-2 py-1.5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <button type="submit" className="rounded bg-[#A3001B] px-3 py-1.5 text-sm font-semibold text-white">
          Enviar push
        </button>
      </form>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ul className="divide-y divide-zinc-200 text-sm">
        {items.map((n) => (
          <li key={n.id} className="flex justify-between gap-2 py-2">
            <span>
              {n.title} · {n.channel} · {n.status}
            </span>
            {!n.readAt ? (
              <button
                type="button"
                className="text-[#A3001B]"
                onClick={() => engagementApi.markRead(accessToken, n.id).then(reload)}
              >
                Marcar lida
              </button>
            ) : (
              <span className="text-zinc-400">lida</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChatPanel({ accessToken }: { accessToken: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memberId, setMemberId] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setConversations(await engagementApi.conversations(accessToken));
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  async function loadMessages(id: string) {
    setActive(id);
    setMessages(await engagementApi.messages(accessToken, id));
  }

  async function createConv() {
    try {
      const c = await engagementApi.createConversation(accessToken, {
        type: 'direct',
        memberIds: [memberId],
        title: 'Chat',
      });
      await reload();
      await loadMessages(c.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  async function send() {
    if (!active) return;
    try {
      await engagementApi.sendMessage(accessToken, { conversationId: active, content });
      setContent('');
      await loadMessages(active);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            className="w-full rounded border border-zinc-300 px-2 py-1.5 font-mono text-xs"
            placeholder="Member profile UUID"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
          />
          <button type="button" onClick={createConv} className="rounded border px-2 py-1 text-sm">
            Nova
          </button>
        </div>
        <ul className="divide-y divide-zinc-200 text-sm">
          {conversations.map((c) => (
            <li key={c.id}>
              <button type="button" className="w-full py-2 text-left hover:text-[#A3001B]" onClick={() => loadMessages(c.id)}>
                {c.title || c.id.slice(0, 8)} · {c.type}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-3">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <ul className="max-h-64 space-y-2 overflow-auto text-sm">
          {messages.map((m) => (
            <li key={m.id} className="rounded bg-zinc-50 px-2 py-1">
              <span className="text-xs text-zinc-500">{m.senderId.slice(0, 8)}…</span>
              <p>{m.content}</p>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className="w-full rounded border border-zinc-300 px-2 py-1.5"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Mensagem"
          />
          <button type="button" onClick={send} className="rounded bg-[#A3001B] px-3 py-1.5 text-sm text-white">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

export function CampaignsPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Campaign[]>([]);
  const [name, setName] = useState('Volte para Treinar');
  const [body, setBody] = useState('Faça check-in esta semana e ganhe pontos!');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setItems(await engagementApi.campaigns(accessToken));
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  async function create() {
    try {
      await engagementApi.createCampaign(accessToken, {
        name,
        type: 'winback',
        channel: 'push',
        body,
        requiresMarketingConsent: false,
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  async function send(id: string) {
    try {
      const r = (await engagementApi.sendCampaign(accessToken, id)) as {
        deliveries: number;
        skipped: number;
      };
      setMsg(`Enviados ${r.deliveries}, pulados ${r.skipped}`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded border border-zinc-300 px-2 py-1.5"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="button" onClick={create} className="rounded bg-[#A3001B] px-3 py-1.5 text-sm text-white">
          Criar campanha
        </button>
      </div>
      <textarea
        className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ul className="divide-y divide-zinc-200 text-sm">
        {items.map((c) => (
          <li key={c.id} className="flex justify-between py-2">
            <span>
              {c.name} · {c.status} · {c.channel}
            </span>
            {c.status === 'draft' ? (
              <button type="button" onClick={() => send(c.id)} className="text-[#A3001B]">
                Enviar
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LoyaltyPanel({ accessToken }: { accessToken: string }) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [studentId, setStudentId] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setRanking(await engagementApi.ranking(accessToken));
    setChallenges(await engagementApi.challenges(accessToken));
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  async function award() {
    try {
      await engagementApi.awardPoints(accessToken, { studentId, reason: 'checkin' });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  async function join(id: string) {
    try {
      await engagementApi.joinChallenge(accessToken, id, studentId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  async function askAi() {
    try {
      const r = await engagementApi.aiChat(accessToken, 'Qual o ranking de fidelidade?');
      setAiAnswer(r.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <input
          className="w-72 rounded border border-zinc-300 px-2 py-1.5 font-mono text-xs"
          placeholder="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <button type="button" onClick={award} className="rounded border px-2 py-1 text-sm">
          +10 check-in
        </button>
        <button type="button" onClick={askAi} className="rounded border px-2 py-1 text-sm">
          Perguntar IA
        </button>
      </div>
      {aiAnswer ? <p className="text-sm text-zinc-700">{aiAnswer}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div>
        <h2 className="mb-2 font-semibold">TOP 10</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {ranking.map((r) => (
            <li key={r.studentId}>
              {r.studentId.slice(0, 8)}… — {r.points} pts ({r.tier})
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h2 className="mb-2 font-semibold">Desafios</h2>
        <ul className="divide-y divide-zinc-200 text-sm">
          {challenges.map((c) => (
            <li key={c.id} className="flex justify-between py-2">
              <span>
                {c.title} · {c.pointsReward} pts
              </span>
              <button type="button" disabled={!studentId} onClick={() => join(c.id)} className="text-[#A3001B]">
                Participar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
