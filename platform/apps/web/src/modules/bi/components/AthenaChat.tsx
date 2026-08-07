'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Button } from '@athena/ui';
import { useAuthNav } from '@/components/auth/AuthNavProvider';
import { biApi } from '../services/biApi';
import { clearChatHistory, loadChatHistory, saveChatHistory } from './chatHistory';
import type { ChatMsg } from './chatTypes';

function resolvePersona(roles: string[]): 'admin' | 'professor' | 'aluno' {
  if (
    roles.includes('student') &&
    !roles.some((r) =>
      ['super_admin', 'admin', 'manager', 'finance', 'reception', 'trainer', 'personal'].includes(r),
    )
  ) {
    return 'aluno';
  }
  if (
    (roles.includes('trainer') || roles.includes('personal')) &&
    !roles.some((r) => ['super_admin', 'admin', 'manager', 'finance'].includes(r))
  ) {
    return 'professor';
  }
  return 'admin';
}

const SUGGESTIONS: Record<'admin' | 'professor' | 'aluno', string[]> = {
  admin: [
    'Quanto faturei no mês?',
    'Quem são meus inadimplentes?',
    'Qual plano vende mais?',
    'Quais alunos estão há mais de 15 dias sem treinar?',
  ],
  professor: [
    'Agende uma aula de Yoga amanhã às 10h',
    'Quais turmas estão lotadas hoje?',
    'Como está a ocupação das aulas?',
    'Quais alunos sumiram da frequência?',
  ],
  aluno: [
    'Quais aulas estão disponíveis?',
    'Reservar a aula 1',
    'Como melhorar minha frequência?',
    'Qual o melhor horário para treinar?',
  ],
};

const WELCOME: Record<'admin' | 'professor' | 'aluno', string> = {
  admin:
    'Olá! Sou o Movvo AI. Posso ajudar com receita, inadimplência, churn, previsões e decisões da academia.',
  professor:
    'Olá, professor! Posso ajudar com agenda (criar aulas), ocupação de turmas e acompanhamento de alunos.',
  aluno:
    'Olá! Sou o Movvo AI. Posso te ajudar com treinos, agenda (listar e reservar aulas) e dicas de frequência — sem dados financeiros da academia.',
};

function welcomeMessage(persona: 'admin' | 'professor' | 'aluno', firstName?: string): ChatMsg {
  return {
    id: 'welcome',
    role: 'assistant',
    content: firstName
      ? WELCOME[persona].replace('Olá!', `Olá, ${firstName}!`)
      : WELCOME[persona],
  };
}

export function AthenaChat({
  accessToken,
  compact = false,
}: {
  accessToken: string;
  compact?: boolean;
}) {
  const { auth, me, loading } = useAuthNav();
  const persona = resolvePersona(auth.roles);
  const userKey = useMemo(() => {
    const id = me?.profile?.id || me?.auth?.userId || me?.profile?.email || '';
    return String(id || 'anon');
  }, [me]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (loading || bootstrapped.current) return;
    bootstrapped.current = true;
    const stored = loadChatHistory(userKey);
    if (stored?.length) {
      setMessages(stored);
      return;
    }
    const name = me?.profile?.fullName?.split(' ')[0];
    setMessages([welcomeMessage(persona, name)]);
  }, [loading, persona, me, userKey]);

  useEffect(() => {
    if (!bootstrapped.current || !messages.length) return;
    saveChatHistory(userKey, messages);
  }, [messages, userKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending]);

  const resetConversation = () => {
    clearChatHistory(userKey);
    setError(null);
    const name = me?.profile?.fullName?.split(' ')[0];
    setMessages([welcomeMessage(persona, name)]);
  };

  const send = (text: string) => {
    const question = text.trim();
    if (!question || pending) return;
    setError(null);
    setInput('');
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', content: question };
    const history = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);

    start(async () => {
      try {
        const r = await biApi.chat(accessToken, question, history.slice(0, -1));
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: r.answer,
          },
        ]);
        const action = (r as { data?: { actionResult?: string } }).data?.actionResult;
        if (
          action === 'cancelled' ||
          action === 'reserved' ||
          action === 'waitlisted' ||
          action === 'schedule_created' ||
          action === 'schedules_cancelled'
        ) {
          window.dispatchEvent(
            new CustomEvent('athena-agenda-changed', { detail: { action } }),
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] ${
        compact ? 'h-full min-h-0' : 'h-[min(70vh,720px)]'
      }`}
      data-testid="athena-chat"
    >
      {!compact && (
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/movvo-ai.svg"
              alt=""
              width={36}
              height={36}
              className="rounded-xl"
              aria-hidden
            />
            <div>
              <p className="athena-title text-base">Movvo AI</p>
              <p className="text-xs text-[var(--muted)]">
                Chat {loading ? '…' : `para ${persona === 'admin' ? 'gestor' : persona}`}
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={resetConversation}>
            Nova conversa
          </Button>
        </div>
      )}

      {compact && (
        <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/movvo-ai.svg"
              alt=""
              width={28}
              height={28}
              className="rounded-lg"
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Movvo AI</p>
              <p className="text-[10px] text-[var(--muted)]">
                {persona === 'admin' ? 'Gestor' : persona === 'professor' ? 'Professor' : 'Aluno'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
            onClick={resetConversation}
          >
            Limpar
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-3 py-2">
        {SUGGESTIONS[persona].slice(0, compact ? 3 : 4).map((s) => (
          <button
            key={s}
            type="button"
            className="athena-chip-nav text-left text-xs"
            disabled={pending}
            onClick={() => send(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--bg)] text-[var(--text)] ring-1 ring-[var(--border)]'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {pending && (
          <div className="text-xs text-[var(--muted)]">Athena está digitando…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-3 text-sm text-[var(--primary-hover)]">{error}</p>
      )}

      <form
        className="flex gap-2 border-t border-[var(--border)] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-transparent px-4 py-2 text-sm outline-none focus:border-[var(--primary)]"
          placeholder="Escreva sua mensagem…"
          value={input}
          disabled={pending}
          onChange={(e) => setInput(e.target.value)}
          data-testid="athena-chat-input"
        />
        <Button type="submit" disabled={pending || !input.trim()} data-testid="athena-chat-send">
          Enviar
        </Button>
      </form>
    </div>
  );
}
