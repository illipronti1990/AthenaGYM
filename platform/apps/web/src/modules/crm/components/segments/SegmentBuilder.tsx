'use client';

import { useEffect, useState } from 'react';
import type { AudienceSegment } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export function SegmentBuilder({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [filterJson, setFilterJson] = useState('{\n  "plan": "mensal"\n}');
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  async function load() {
    try {
      setSegments(await crmApi.segments(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar segmentos', 'error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate() {
    if (!name) return;
    let rules: Record<string, unknown>;
    try {
      rules = JSON.parse(filterJson) as Record<string, unknown>;
      setJsonError(null);
    } catch {
      setJsonError('JSON inválido');
      return;
    }
    setLoading(true);
    try {
      await crmApi.createSegment(accessToken, {
        name,
        slug: slugify(name) || `seg-${Date.now()}`,
        rules,
      });
      push('Segmento criado');
      setName('');
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao criar segmento', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function onResolve(id: string) {
    setResolvingId(id);
    try {
      const result = await crmApi.resolveSegment(accessToken, id);
      setCounts((prev) => ({ ...prev, [id]: result.count }));
      push(`${result.count} alunos no segmento`);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro ao resolver segmento', 'error');
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="space-y-6" data-testid="segment-builder">
      <Card>
        <div className="grid gap-2">
          <input
            placeholder="Nome do segmento"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="movvo-input"
            data-testid="segment-name"
          />
          <label className="text-xs text-[var(--muted)]">
            Regras (JSON)
            <textarea
              value={filterJson}
              onChange={(e) => setFilterJson(e.target.value)}
              rows={4}
              className="movvo-input mt-1 block w-full font-mono text-xs"
            />
          </label>
          {jsonError && <p className="text-xs text-[var(--primary-hover)]">{jsonError}</p>}
          <div className="flex justify-end">
            <Button type="button" disabled={loading || !name} onClick={() => void onCreate()}>
              {loading ? 'Criando…' : 'Criar segmento'}
            </Button>
          </div>
        </div>
      </Card>

      <ul className="movvo-list text-sm">
        {segments.map((s) => (
          <li key={s.id} className="movvo-list-item">
            <div>
              <p className="text-[var(--text)]">{s.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {s.slug} · {s.active ? 'ativo' : 'inativo'}
                {counts[s.id] != null ? ` · ${counts[s.id]} alunos` : ''}
              </p>
            </div>
            <button
              type="button"
              disabled={resolvingId === s.id}
              onClick={() => void onResolve(s.id)}
              className="movvo-link text-[var(--gold)] disabled:opacity-50"
            >
              {resolvingId === s.id ? 'Resolvendo…' : 'Resolver'}
            </button>
          </li>
        ))}
        {segments.length === 0 && (
          <li className="py-4 text-center text-[var(--muted)]">Nenhum segmento criado.</li>
        )}
      </ul>
    </div>
  );
}
