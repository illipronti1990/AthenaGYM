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
} from '@athena/shared';
import { Button, Card, chartColors } from '@athena/ui';
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

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando…</p>;

  const cards = [
    ['Mensagens hoje', data.messagesToday, chartColors.revenue],
    ['Push enviados', data.pushSent, chartColors.workouts],
    ['Desafios ativos', data.activeChallenges, chartColors.checkins],
    ['Alunos engajados', `${data.engagedStudentsPct}%`, chartColors.finance],
    ['Fidelidade', data.loyaltyMembers, chartColors.revenue],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(([label, value, color]) => (
        <Card key={label} hover>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color }}>
            {value}
          </p>
        </Card>
      ))}
    </div>
  );
}

export function NotificationsPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('Volte a treinar');
  const [body] = useState('Sentimos sua falta na academia!');
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
        <label className="text-sm text-[var(--muted)]">
          User ID (profile)
          <input
            className="athena-input mt-1 block w-72 font-mono text-xs"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </label>
        <label className="text-sm text-[var(--muted)]">
          Título
          <input
            className="athena-input mt-1 block"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <Button type="submit">Enviar push</Button>
      </form>
      {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
      <ul className="athena-list text-sm">
        {items.map((n) => (
          <li key={n.id} className="athena-list-item">
            <span className="text-[var(--text)]">
              {n.title} · {n.channel} · {n.status}
            </span>
            {!n.readAt ? (
              <button
                type="button"
                className="athena-link text-[var(--gold)]"
                onClick={() => engagementApi.markRead(accessToken, n.id).then(reload)}
              >
                Marcar lida
              </button>
            ) : (
              <span className="text-[var(--muted)]">lida</span>
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
      <Card className="space-y-3">
        <div className="flex gap-2">
          <input
            className="athena-input w-full font-mono text-xs"
            placeholder="Member profile UUID"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={() => void createConv()}>
            Nova
          </Button>
        </div>
        <ul className="divide-y divide-[var(--border)] text-sm">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full py-2 text-left text-[var(--text)] hover:text-[var(--gold)]"
                onClick={() => void loadMessages(c.id)}
              >
                {c.title || c.id.slice(0, 8)} · {c.type}
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="space-y-3">
        {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
        <ul className="max-h-64 space-y-2 overflow-auto text-sm">
          {messages.map((m) => (
            <li key={m.id} className="rounded-[10px] bg-[var(--surface)] px-2 py-1">
              <span className="text-xs text-[var(--muted)]">{m.senderId.slice(0, 8)}…</span>
              <p className="text-[var(--text)]">{m.content}</p>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className="athena-input w-full"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Mensagem"
          />
          <Button type="button" onClick={() => void send()}>
            Enviar
          </Button>
        </div>
      </Card>
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
          className="athena-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="button" onClick={() => void create()}>
          Criar campanha
        </Button>
      </div>
      <textarea
        className="athena-input text-sm"
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {msg ? <p className="text-sm text-[var(--gold)]">{msg}</p> : null}
      {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
      <ul className="athena-list text-sm">
        {items.map((c) => (
          <li key={c.id} className="athena-list-item">
            <span className="text-[var(--text)]">
              {c.name} · {c.status} · {c.channel}
            </span>
            {c.status === 'draft' ? (
              <button
                type="button"
                onClick={() => void send(c.id)}
                className="athena-link text-[var(--gold)]"
              >
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
          className="athena-input w-72 font-mono text-xs"
          placeholder="ID do aluno"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <Button type="button" variant="secondary" onClick={() => void award()}>
          +10 check-in
        </Button>
        <Button type="button" variant="secondary" onClick={() => void askAi()}>
          Perguntar IA
        </Button>
      </div>
      {aiAnswer ? <p className="text-sm text-[var(--text)]">{aiAnswer}</p> : null}
      {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
      <div>
        <h2 className="athena-title mb-2 text-sm">TOP 10</h2>
        <Card>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--text)]">
            {ranking.map((r) => (
              <li key={r.studentId}>
                {r.studentId.slice(0, 8)}… —{' '}
                <span className="text-[var(--gold)]">{r.points} pts</span> ({r.tier})
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <div>
        <h2 className="athena-title mb-2 text-sm">Desafios</h2>
        <ul className="athena-list text-sm">
          {challenges.map((c) => (
            <li key={c.id} className="athena-list-item">
              <span className="text-[var(--text)]">
                {c.title} · {c.pointsReward} pts
              </span>
              <button
                type="button"
                disabled={!studentId}
                onClick={() => void join(c.id)}
                className="athena-link text-[var(--gold)] disabled:opacity-50"
              >
                Participar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
