'use client';

import { FormEvent, useState } from 'react';
import type { Profile } from '@movvo/shared';
import { Button } from '@movvo/ui';
import { apiChangePassword, apiUpdateProfile } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/components/ThemeProvider';
import { useUiPreferences } from '@/hooks/useUiPreferences';

export function ProfileForm({
  profile,
  accessToken,
}: {
  profile: Profile;
  accessToken: string;
}) {
  const { push } = useToast();
  const { setTheme } = useTheme();
  const { prefs, setPrefs } = useUiPreferences();
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [locale, setLocale] = useState(profile.locale || 'pt-BR');
  const [timezone, setTimezone] = useState(profile.timezone || 'America/Sao_Paulo');
  const [theme, setThemeLocal] = useState(profile.theme || 'system');
  const [notifyEmail, setNotifyEmail] = useState(
    Boolean((profile.preferences as { notifyEmail?: boolean } | undefined)?.notifyEmail ?? true),
  );
  const [notifyPush, setNotifyPush] = useState(
    Boolean((profile.preferences as { notifyPush?: boolean } | undefined)?.notifyPush ?? true),
  );
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onUploadPhoto(file: File | null) {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${API_URL}/auth/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as Profile;
      setAvatarUrl(updated.avatarUrl || '');
      push('Foto atualizada');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha no upload', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiUpdateProfile(accessToken, {
        fullName,
        phone,
        avatarUrl,
        locale,
        timezone,
        theme: theme as 'light' | 'dark' | 'system',
        preferences: { notifyEmail, notifyPush },
      });
      setTheme(theme as 'light' | 'dark' | 'system');
      if (newPassword.length >= 8) {
        await apiChangePassword(accessToken, newPassword);
        setNewPassword('');
      }
      push('Perfil atualizado');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao salvar', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSave} className="mx-auto max-w-lg space-y-3">
      <Field label="Nome" value={fullName} onChange={setFullName} />
      <Field label="Telefone" value={phone} onChange={setPhone} />
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--muted)]">Foto</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => void onUploadPhoto(e.target.files?.[0] || null)}
          className="w-full text-sm text-[var(--text)]"
        />
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Avatar"
            className="mt-2 h-16 w-16 rounded-full border border-[var(--border)] object-cover"
          />
        ) : null}
      </label>
      <Field label="Foto (URL)" value={avatarUrl} onChange={setAvatarUrl} />
      <Field label="Idioma" value={locale} onChange={setLocale} />
      <Field label="Fuso horário" value={timezone} onChange={setTimezone} />
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--muted)]">Tema</span>
        <select
          className="movvo-input"
          value={theme}
          onChange={(e) => setThemeLocal(e.target.value)}
        >
          <option value="system">Sistema</option>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
        Notificações por e-mail
      </label>
      <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} />
        Notificações no app
      </label>
      <fieldset className="space-y-2 rounded-xl border border-[var(--border)] p-3" data-testid="ui-preferences">
        <legend className="px-1 text-sm text-[var(--gold)]">Preferências de interface</legend>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={prefs.denseLayout}
            onChange={(e) => setPrefs({ denseLayout: e.target.checked })}
            data-testid="pref-dense"
          />
          Densidade compacta
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={prefs.widgetsCompact}
            onChange={(e) => setPrefs({ widgetsCompact: e.target.checked })}
            data-testid="pref-widgets-compact"
          />
          Widgets compactos no dashboard
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Formato de data</span>
          <select
            className="movvo-input"
            value={prefs.dateFormat}
            onChange={(e) => setPrefs({ dateFormat: e.target.value as 'dd/MM/yyyy' | 'yyyy-MM-dd' })}
          >
            <option value="dd/MM/yyyy">dd/MM/yyyy</option>
            <option value="yyyy-MM-dd">yyyy-MM-dd</option>
          </select>
        </label>
        <p className="text-xs text-[var(--muted)]">
          Atalhos: Ctrl+K busca · Ctrl+B sidebar · Esc fecha painéis
        </p>
        <button
          type="button"
          className="movvo-btn movvo-btn-secondary text-sm"
          data-testid="restart-tour"
          onClick={() => window.dispatchEvent(new Event('movvo:restart-tour'))}
        >
          Ver tour guiado novamente
        </button>
      </fieldset>
      <Field
        label="Nova senha (opcional)"
        value={newPassword}
        onChange={setNewPassword}
        type="password"
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
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
      <span className="mb-1 block text-[var(--muted)]">{label}</span>
      <input
        type={type}
        className="movvo-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
