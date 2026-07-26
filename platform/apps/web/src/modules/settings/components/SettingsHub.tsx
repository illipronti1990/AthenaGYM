'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import type { AuditLogItem, GymSettings } from '@athena/shared';
import { settingsApi } from '../services/settingsApi';
import { useToast } from '@/components/ui/Toast';
import { TableSkeleton } from '@/components/ui/Skeleton';

const TABS = [
  { id: 'academia', label: 'Academia' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'personalizacao', label: 'Personalização' },
  { id: 'usuarios', label: 'Usuários' },
  { id: 'backup', label: 'Backup' },
  { id: 'logs', label: 'Logs' },
  { id: 'integracoes', label: 'Integrações' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'api', label: 'API' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SettingsHub({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [tab, setTab] = useState<TabId>('academia');
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [accounts, setAccounts] = useState<
    { id: string; name: string; bankName: string | null; pixKey: string | null; active: boolean }[]
  >([]);
  const [logs, setLogs] = useState<AuditLogItem[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [backupUrl, setBackupUrl] = useState<string | null>(null);

  async function load() {
    try {
      const res = await settingsApi.get(accessToken);
      setSettings(res.settings);
      setAccounts(res.accounts);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar', 'error');
    }
  }

  async function loadLogs() {
    try {
      const res = await settingsApi.audit(accessToken, 'pageSize=50');
      setLogs(res.items);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha nos logs', 'error');
      setLogs([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (tab === 'logs') void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, accessToken]);

  function updateField<K extends keyof GymSettings>(key: K, value: GymSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function onSaveAcademia(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await settingsApi.patch(accessToken, {
        name: settings.name,
        cnpj: settings.cnpj,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        instagram: settings.instagram,
        zipCode: settings.zipCode,
        street: settings.street,
        number: settings.number,
        district: settings.district,
        city: settings.city,
        state: settings.state,
        receiptFooter: settings.receiptFooter,
        businessHours: settings.businessHours,
      });
      setSettings(res.settings);
      push('Configurações salvas');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function onSaveFinance(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await settingsApi.patch(accessToken, {
        interestRate: settings.interestRate,
        fineRate: settings.fineRate,
        maxDiscountPct: settings.maxDiscountPct,
        graceDays: settings.graceDays,
      });
      setSettings(res.settings);
      push('Política financeira salva');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function onSaveBrand(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await settingsApi.patch(accessToken, {
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
      });
      setSettings(res.settings);
      push('Cores atualizadas');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function onLogo(file: File | null) {
    if (!file) return;
    try {
      const res = await settingsApi.uploadLogo(accessToken, file);
      setSettings(res.settings);
      push('Logo atualizada');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha no upload', 'error');
    }
  }

  async function onBackup() {
    setSaving(true);
    setBackupUrl(null);
    try {
      const res = await settingsApi.backup(accessToken);
      setBackupUrl(res.downloadUrl);
      push(`Backup gerado (${res.bytes} bytes)`);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha no backup', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === t.id
                ? 'bg-[#A3001B] text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'academia' && (
        <form onSubmit={onSaveAcademia} className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" value={settings.name} onChange={(v) => updateField('name', v)} />
          <Field label="CNPJ" value={settings.cnpj || ''} onChange={(v) => updateField('cnpj', v)} />
          <Field label="Telefone" value={settings.phone || ''} onChange={(v) => updateField('phone', v)} />
          <Field label="WhatsApp" value={settings.whatsapp || ''} onChange={(v) => updateField('whatsapp', v)} />
          <Field label="E-mail" value={settings.email || ''} onChange={(v) => updateField('email', v)} />
          <Field label="Instagram" value={settings.instagram || ''} onChange={(v) => updateField('instagram', v)} />
          <Field label="CEP" value={settings.zipCode || ''} onChange={(v) => updateField('zipCode', v)} />
          <Field label="Rua" value={settings.street || ''} onChange={(v) => updateField('street', v)} />
          <Field label="Número" value={settings.number || ''} onChange={(v) => updateField('number', v)} />
          <Field label="Bairro" value={settings.district || ''} onChange={(v) => updateField('district', v)} />
          <Field label="Cidade" value={settings.city || ''} onChange={(v) => updateField('city', v)} />
          <Field label="UF" value={settings.state || ''} onChange={(v) => updateField('state', v)} />
          <label className="sm:col-span-2 block text-sm">
            <span className="mb-1 block text-zinc-600">Rodapé dos recibos</span>
            <textarea
              className="w-full rounded border border-zinc-300 px-3 py-2"
              rows={3}
              value={settings.receiptFooter || ''}
              onChange={(e) => updateField('receiptFooter', e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-[#A3001B] px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Salvar academia
            </button>
          </div>
        </form>
      )}

      {tab === 'financeiro' && (
        <div className="space-y-6">
          <form onSubmit={onSaveFinance} className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Juros (% a.m.)"
              type="number"
              value={String(settings.interestRate)}
              onChange={(v) => updateField('interestRate', Number(v) || 0)}
            />
            <Field
              label="Multa (%)"
              type="number"
              value={String(settings.fineRate)}
              onChange={(v) => updateField('fineRate', Number(v) || 0)}
            />
            <Field
              label="Desconto máximo (%)"
              type="number"
              value={String(settings.maxDiscountPct)}
              onChange={(v) => updateField('maxDiscountPct', Number(v) || 0)}
            />
            <Field
              label="Dias de tolerância"
              type="number"
              value={String(settings.graceDays)}
              onChange={(v) => updateField('graceDays', Number(v) || 0)}
            />
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-[#A3001B] px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Salvar financeiro
              </button>
            </div>
          </form>
          <div>
            <h3 className="mb-2 font-semibold">Contas / PIX</h3>
            <p className="mb-2 text-sm text-zinc-600">
              Gerencie contas em{' '}
              <Link href="/app/finance/settings" className="text-[#A3001B] underline">
                Financeiro → Configurações
              </Link>
              .
            </p>
            <ul className="space-y-1 text-sm">
              {accounts.map((a) => (
                <li key={a.id} className="rounded border border-zinc-200 px-3 py-2">
                  {a.bankName || a.name} — PIX: {a.pixKey || '—'}{' '}
                  {!a.active && <span className="text-zinc-500">(inativa)</span>}
                </li>
              ))}
              {accounts.length === 0 && <li className="text-zinc-500">Nenhuma conta cadastrada</li>}
            </ul>
          </div>
        </div>
      )}

      {tab === 'personalizacao' && (
        <form onSubmit={onSaveBrand} className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">Cor principal</span>
              <input
                type="color"
                value={settings.primaryColor || '#A3001B'}
                onChange={(e) => updateField('primaryColor', e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">Cor secundária</span>
              <input
                type="color"
                value={settings.secondaryColor || '#1a1a1a'}
                onChange={(e) => updateField('secondaryColor', e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">Logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void onLogo(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          {settings.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-[#A3001B] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar cores
          </button>
        </form>
      )}

      {tab === 'usuarios' && (
        <div className="space-y-3 text-sm">
          <p>Cadastre funcionários e permissões:</p>
          <div className="flex gap-3">
            <Link href="/app/users" className="rounded bg-zinc-900 px-3 py-2 text-white">
              Usuários
            </Link>
            <Link href="/app/roles" className="rounded border border-zinc-300 px-3 py-2">
              Cargos / Permissões
            </Link>
          </div>
          <p className="text-zinc-600">
            Cargos: Administrador, Recepcionista, Professor, Financeiro, Gerente.
          </p>
        </div>
      )}

      {tab === 'backup' && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            Exporta os dados da academia (JSON) para download. Backup automático virá depois.
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onBackup()}
            className="rounded bg-[#A3001B] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Backup Manual — Exportar
          </button>
          {backupUrl && (
            <a
              href={backupUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-[#A3001B] underline"
            >
              Download do backup
            </a>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="overflow-auto">
          {!logs ? (
            <TableSkeleton rows={5} />
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-zinc-500">
                  <th className="py-2 pr-2">Quando</th>
                  <th className="py-2 pr-2">Módulo</th>
                  <th className="py-2 pr-2">Ação</th>
                  <th className="py-2">Entidade</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-zinc-100">
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 pr-2">{l.module}</td>
                    <td className="py-2 pr-2">{l.action}</td>
                    <td className="py-2">
                      {l.entity || '—'} {l.entityId ? `(${l.entityId.slice(0, 8)})` : ''}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-zinc-500">
                      Nenhum log
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'integracoes' && (
        <p className="text-sm text-zinc-600">
          Integrações (WhatsApp, gateways) serão configuradas aqui. Por enquanto use as contas PIX
          no financeiro.
        </p>
      )}

      {tab === 'seguranca' && (
        <div className="space-y-2 text-sm">
          <p>Altere sua senha e revise acessos em:</p>
          <Link href="/app/profile" className="text-[#A3001B] underline">
            Meu perfil
          </Link>
        </div>
      )}

      {tab === 'api' && (
        <div className="space-y-2 text-sm">
          <p>
            Documentação Swagger:{' '}
            <a
              href={(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').replace(
                /\/api\/v1$/,
                '/api/v1/docs',
              )}
              target="_blank"
              rel="noreferrer"
              className="text-[#A3001B] underline"
            >
              /api/v1/docs
            </a>
          </p>
          <p className="text-zinc-600">PaaS / Marketplace congelados nesta sprint.</p>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-zinc-600">{label}</span>
      <input
        type={type}
        className="w-full rounded border border-zinc-300 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={type === 'number' ? 'any' : undefined}
      />
    </label>
  );
}
