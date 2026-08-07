'use client';

import { useEffect, useState } from 'react';
import type { Campaign } from '@athena/shared';
import { Button, Card } from '@athena/ui';
import { engagementApi } from '@/modules/engagement/services/engagementApi';
import { useToast } from '@/components/ui/Toast';

export function CampaignForm({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<'push' | 'email' | 'sms'>('push');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  async function load() {
    try {
      setCampaigns(await engagementApi.campaigns(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar campanhas', 'error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate() {
    if (!name || !body) return;
    setLoading(true);
    try {
      await engagementApi.createCampaign(accessToken, {
        name,
        type: 'winback',
        channel,
        body,
        requiresMarketingConsent: false,
      });
      push('Campanha criada');
      setName('');
      setBody('');
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao criar campanha', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function onSend(id: string) {
    setSending(id);
    try {
      const r = (await engagementApi.sendCampaign(accessToken, id)) as {
        deliveries: number;
        skipped: number;
      };
      push(`Enviados ${r.deliveries}, pulados ${r.skipped}`);
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao enviar campanha', 'error');
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="space-y-6" data-testid="campaign-form">
      <Card>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            placeholder="Nome da campanha"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="athena-input"
            data-testid="campaign-name"
          />
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as 'push' | 'email' | 'sms')}
            className="athena-input"
          >
            <option value="push">Push</option>
            <option value="email">E-mail</option>
            <option value="sms">SMS</option>
          </select>
          <textarea
            placeholder="Mensagem da campanha"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="athena-input sm:col-span-2"
          />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="button" disabled={loading || !name || !body} onClick={() => void onCreate()}>
              {loading ? 'Criando…' : 'Criar campanha'}
            </Button>
          </div>
        </div>
      </Card>

      <ul className="athena-list text-sm">
        {campaigns.map((c) => (
          <li key={c.id} className="athena-list-item">
            <span className="text-[var(--text)]">
              {c.name} · <span className="text-[var(--muted)]">{c.status}</span> · {c.channel}
            </span>
            {c.status === 'draft' && (
              <button
                type="button"
                disabled={sending === c.id}
                onClick={() => void onSend(c.id)}
                className="athena-link text-[var(--gold)] disabled:opacity-50"
              >
                {sending === c.id ? 'Enviando…' : 'Enviar'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
