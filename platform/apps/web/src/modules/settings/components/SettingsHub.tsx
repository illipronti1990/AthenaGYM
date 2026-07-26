'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { AuditLogItem, GymSettings } from '@athena/shared';
import { Button, ProgressIndicator, SkeletonForm } from '@athena/ui';
import { settingsApi } from '../services/settingsApi';
import { useToast } from '@/components/ui/Toast';
import { CepFields } from '@/components/CepFields';
import { formatCep } from '@/utils/cep';
import { useAutosave } from '@/hooks/useAutosave';
import { AutosaveIndicator } from '@/components/ux/AutosaveIndicator';
import { useUiPreferences } from '@/hooks/useUiPreferences';

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
  const [backupProgress, setBackupProgress] = useState(0);
  const { prefs, setPrefs } = useUiPreferences();

  const brandKey = settings
    ? `${settings.primaryColor}|${settings.secondaryColor}`
    : '';

  const saveBrand = useCallback(async () => {
    if (!settings) return;
    const res = await settingsApi.patch(accessToken, {
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
    });
    setSettings(res.settings);
  }, [accessToken, settings]);

  const autosaveStatus = useAutosave({
    value: brandKey,
    enabled: tab === 'personalizacao' && Boolean(settings),
    onSave: async () => {
      await saveBrand();
    },
  });

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
    setBackupProgress(12);
    const tick = window.setInterval(() => {
      setBackupProgress((p) => (p >= 90 ? p : p + 8));
    }, 200);
    try {
      const res = await settingsApi.backup(accessToken);
      setBackupProgress(100);
      setBackupUrl(res.downloadUrl);
      push('Backup realizado.', 'info');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha no backup', 'error');
    } finally {
      window.clearInterval(tick);
      setSaving(false);
      window.setTimeout(() => setBackupProgress(0), 1200);
    }
  }

  if (!settings) {
    return <SkeletonForm fields={8} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={tab === t.id ? 'athena-tab athena-tab-active' : 'athena-tab'}
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
          <div className="sm:col-span-2">
            <CepFields
              testIdPrefix="settings-cep"
              value={{
                zipCode: settings.zipCode ? formatCep(settings.zipCode) : '',
                street: settings.street || '',
                district: settings.district || '',
                city: settings.city || '',
                state: settings.state || '',
                number: settings.number || '',
              }}
              onChange={(addr) => {
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        zipCode: addr.zipCode,
                        street: addr.street,
                        district: addr.district,
                        city: addr.city,
                        state: addr.state,
                        number: addr.number || '',
                      }
                    : prev,
                );
              }}
            />
          </div>
          <label className="sm:col-span-2 block text-sm">
            <span className="athena-label">Rodapé dos recibos</span>
            <textarea
              className="athena-input"
              rows={3}
              value={settings.receiptFooter || ''}
              onChange={(e) => updateField('receiptFooter', e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving} loadingLabel="Salvando…">
              Salvar academia
            </Button>
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
                className="athena-btn athena-btn-primary"
              >
                Salvar financeiro
              </button>
            </div>
          </form>
          <div>
            <h3 className="mb-2 font-semibold">Contas / PIX</h3>
            <p className="mb-2 text-sm text-[var(--muted)]">
              Gerencie contas em{' '}
              <Link href="/app/finance/settings" className="text-[var(--primary)] underline">
                Financeiro → Configurações
              </Link>
              .
            </p>
            <ul className="space-y-1 text-sm">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                >
                  {a.bankName || a.name} — PIX: {a.pixKey || '—'}{' '}
                  {!a.active && <span className="text-[var(--muted)]">(inativa)</span>}
                </li>
              ))}
              {accounts.length === 0 && <li className="text-[var(--muted)]">Nenhuma conta cadastrada</li>}
            </ul>
          </div>
        </div>
      )}

      {tab === 'personalizacao' && (
        <form onSubmit={onSaveBrand} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--muted)]">
              Cores salvam automaticamente enquanto você ajusta.
            </p>
            <AutosaveIndicator status={autosaveStatus} />
          </div>
          <div className="grid gap-3 rounded-[12px] border border-[var(--border)] p-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="athena-label">Layout compacto</span>
              <input
                type="checkbox"
                className="mt-2"
                checked={prefs.denseLayout}
                onChange={(e) => setPrefs({ denseLayout: e.target.checked })}
              />
            </label>
            <label className="text-sm">
              <span className="athena-label">Widgets compactos</span>
              <input
                type="checkbox"
                className="mt-2"
                checked={prefs.widgetsCompact}
                onChange={(e) => setPrefs({ widgetsCompact: e.target.checked })}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-sm">
              <span className="athena-label">Cor principal</span>
              <input
                type="color"
                value={settings.primaryColor || '#A00018'}
                onChange={(e) => updateField('primaryColor', e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="athena-label">Cor secundária</span>
              <input
                type="color"
                value={settings.secondaryColor || '#1a1a1a'}
                onChange={(e) => updateField('secondaryColor', e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="athena-label">Logo</span>
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
            className="athena-btn athena-btn-primary"
          >
            Salvar cores
          </button>
        </form>
      )}

      {tab === 'usuarios' && (
        <div className="space-y-3 text-sm">
          <p>Cadastre funcionários e permissões:</p>
          <div className="flex gap-3">
            <Link href="/app/users" className="athena-btn athena-btn-primary">
              Usuários
            </Link>
            <Link href="/app/roles" className="athena-btn athena-btn-secondary">
              Cargos / Permissões
            </Link>
          </div>
          <p className="text-[var(--muted)]">
            Cargos: Administrador, Recepcionista, Professor, Financeiro, Gerente.
          </p>
        </div>
      )}

      {tab === 'backup' && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Exporta os dados da academia (JSON) para download. Backup automático virá depois.
          </p>
          <Button
            type="button"
            loading={saving}
            loadingLabel="Exportando…"
            onClick={() => void onBackup()}
          >
            Backup Manual — Exportar
          </Button>
          {backupProgress > 0 ? (
            <ProgressIndicator value={backupProgress} label="Progresso do backup" />
          ) : null}
          {backupUrl && (
            <a
              href={backupUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-[var(--primary)] underline"
            >
              Download do backup
            </a>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="overflow-auto">
          {!logs ? (
            <SkeletonForm fields={5} />
          ) : (
            <table className="athena-table">
              <thead>
                <tr>
                  <th className="py-2 pr-2">Quando</th>
                  <th className="py-2 pr-2">Módulo</th>
                  <th className="py-2 pr-2">Ação</th>
                  <th className="py-2">Entidade</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--border)]">
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
                    <td colSpan={4} className="py-4 text-[var(--muted)]">
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
        <p className="text-sm text-[var(--muted)]">
          Integrações (WhatsApp, gateways) serão configuradas aqui. Por enquanto use as contas PIX
          no financeiro.
        </p>
      )}

      {tab === 'seguranca' && (
        <div className="space-y-2 text-sm">
          <p>Altere sua senha e revise acessos em:</p>
          <Link href="/app/profile" className="text-[var(--primary)] underline">
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
              className="text-[var(--primary)] underline"
            >
              /api/v1/docs
            </a>
          </p>
          <p className="text-[var(--muted)]">PaaS / Marketplace congelados nesta sprint.</p>
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
      <span className="athena-label">{label}</span>
      <input
        type={type}
        className="athena-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={type === 'number' ? 'any' : undefined}
      />
    </label>
  );
}
