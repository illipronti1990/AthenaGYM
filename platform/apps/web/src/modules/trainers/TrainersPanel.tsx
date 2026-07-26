'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Role, UserListItem } from '@athena/shared';
import { Button } from '@athena/ui';
import { apiInviteUser, apiListRoles, apiListUsers } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

const TRAINER_SLUGS = new Set(['trainer', 'personal', 'professor', 'treinador']);

function isTrainerUser(u: UserListItem) {
  return u.roles.some((r) => {
    const n = r.toLowerCase();
    return (
      n.includes('professor') ||
      n.includes('trainer') ||
      n.includes('treinador') ||
      n.includes('personal')
    );
  });
}

function roleLabel(roles: Role[], slug: string) {
  return roles.find((r) => r.slug === slug)?.name || slug;
}

export function TrainersPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [trainers, setTrainers] = useState<UserListItem[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const trainerRoles = useMemo(
    () => roles.filter((r) => TRAINER_SLUGS.has(r.slug.toLowerCase())),
    [roles],
  );

  async function load() {
    setTrainers(null);
    try {
      const [users, allRoles] = await Promise.all([
        apiListUsers(accessToken),
        apiListRoles(accessToken),
      ]);
      setTrainers(users.filter(isTrainerUser));
      setRoles(allRoles);
      const preferred =
        allRoles.find((r) => r.slug === 'trainer') ||
        allRoles.find((r) => TRAINER_SLUGS.has(r.slug.toLowerCase()));
      if (preferred && !roleId) setRoleId(preferred.id);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao listar professores', 'error');
      setTrainers([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!roleId) {
      push('Selecione o tipo de professor', 'error');
      return;
    }
    setLoading(true);
    setTempPassword(null);
    try {
      const res = await apiInviteUser(accessToken, {
        email,
        fullName,
        phone,
        roleId,
      });
      setTempPassword(res.temporaryPassword || null);
      push(
        res.temporaryPassword
          ? `Professor criado. Senha DEV: ${res.temporaryPassword}`
          : 'Professor criado e liberado no sistema',
      );
      setEmail('');
      setFullName('');
      setPhone('');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao criar professor', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="athena-title mb-3 text-lg">Professores cadastrados</h2>
        {!trainers ? (
          <TableSkeleton />
        ) : trainers.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum professor cadastrado ainda.</p>
        ) : (
          <div className="athena-list overflow-x-auto">
            <table className="athena-table" data-testid="trainers-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th>Tipo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map((t) => (
                  <tr key={t.id}>
                    <td>{t.fullName || '—'}</td>
                    <td>{t.email || '—'}</td>
                    <td>{t.phone || '—'}</td>
                    <td>
                      {t.roles
                        .map((slug) => roleLabel(roles, slug))
                        .join(', ') || '—'}
                    </td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="athena-title mb-3 text-lg">Novo professor</h2>
        <form
          onSubmit={onCreate}
          className="grid max-w-xl gap-3 sm:grid-cols-2"
          data-testid="trainer-form"
        >
          <input
            required
            type="text"
            placeholder="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="athena-input sm:col-span-2"
            data-testid="trainer-name"
          />
          <input
            required
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="athena-input"
            data-testid="trainer-email"
          />
          <input
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="athena-input"
            data-testid="trainer-phone"
          />
          <select
            required
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="athena-input sm:col-span-2"
            data-testid="trainer-role"
          >
            {trainerRoles.length === 0 ? (
              <option value="">Carregando cargos…</option>
            ) : (
              trainerRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))
            )}
          </select>
          <Button
            type="submit"
            disabled={loading || !roleId}
            className="sm:col-span-2"
            data-testid="trainer-submit"
          >
            {loading ? 'Salvando…' : 'Cadastrar'}
          </Button>
        </form>
        {tempPassword ? (
          <p className="mt-3 rounded-[10px] border border-[var(--gold)] bg-[rgba(212,175,55,0.1)] p-3 text-sm text-[var(--gold)]">
            Senha DEV: {tempPassword}
          </p>
        ) : null}
      </section>
    </div>
  );
}
