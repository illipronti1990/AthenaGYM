'use client';

import { FormEvent, useState } from 'react';
import type { Profile } from '@athenas/shared';
import { apiChangePassword, apiUpdateProfile } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

export function ProfileForm({
  profile,
  accessToken,
}: {
  profile: Profile;
  accessToken: string;
}) {
  const { push } = useToast();
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [locale, setLocale] = useState(profile.locale || 'pt-BR');
  const [timezone, setTimezone] = useState(profile.timezone || 'America/Sao_Paulo');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      });
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
      <Field label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} />
      <Field label="Idioma" value={locale} onChange={setLocale} />
      <Field label="Fuso horário" value={timezone} onChange={setTimezone} />
      <Field
        label="Nova senha (opcional)"
        value={newPassword}
        onChange={setNewPassword}
        type="password"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-[#A3001B] px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Salvando…' : 'Salvar'}
      </button>
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
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
      />
    </label>
  );
}
