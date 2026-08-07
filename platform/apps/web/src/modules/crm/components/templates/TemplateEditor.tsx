'use client';

import { useEffect, useState } from 'react';
import type { MessageTemplate } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

const CHANNELS = ['push', 'email', 'sms', 'whatsapp'] as const;
type Channel = (typeof CHANNELS)[number];

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export function TemplateEditor({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>('push');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setTemplates(await crmApi.templates(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar templates', 'error');
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
      await crmApi.createTemplate(accessToken, {
        name,
        slug: slugify(name) || `tpl-${Date.now()}`,
        channel,
        body,
      });
      push('Template criado');
      setName('');
      setBody('');
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao criar template', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="template-editor">
      <Card>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            placeholder="Nome do template"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="movvo-input"
            data-testid="template-name"
          />
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as Channel)}
            className="movvo-input"
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Corpo do template. Use {{nome}}, {{plano}}, etc."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="movvo-input sm:col-span-2 font-mono text-sm"
          />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="button" disabled={loading || !name || !body} onClick={() => void onCreate()}>
              {loading ? 'Salvando…' : 'Salvar template'}
            </Button>
          </div>
        </div>
      </Card>

      <ul className="movvo-list text-sm">
        {templates.map((t) => (
          <li key={t.id} className="movvo-list-item flex-col items-start gap-1">
            <div className="flex w-full items-center justify-between">
              <span className="font-medium text-[var(--text)]">{t.name}</span>
              <span className="text-xs text-[var(--muted)]">{t.channel.toUpperCase()}</span>
            </div>
            <p className="text-xs text-[var(--muted)] line-clamp-2">{t.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
