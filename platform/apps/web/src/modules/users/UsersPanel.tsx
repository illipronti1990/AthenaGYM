'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Role, UserListItem } from '@athena/shared';
import { Button } from '@athena/ui';
import { apiInviteUser, apiListRoles, apiListUsers } from '@/services/api';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function UsersPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [users, setUsers] = useState<UserListItem[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setUsers(null);
    try {
      const [u, r] = await Promise.all([
        apiListUsers(accessToken),
        apiListRoles(accessToken),
      ]);
      setUsers(u);
      setRoles(r);
      if (!roleId && r[0]) setRoleId(r.find((x) => x.slug === 'admin')?.id || r[0].id);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao listar', 'error');
      setUsers([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInviteToken(null);
    try {
      const res = await apiInviteUser(accessToken, {
        email,
        fullName,
        phone,
        roleId,
      });
      setInviteToken(res.token);
      push(
        res.temporaryPassword
          ? `Usuário criado. Senha DEV: ${res.temporaryPassword}`
          : 'Usuário criado e liberado no sistema',
      );
      setEmail('');
      setFullName('');
      setPhone('');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha no convite', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="athena-title mb-3 text-lg">Usuários</h2>
        {!users ? (
          <TableSkeleton />
        ) : (
          <div className="athena-list overflow-x-auto">
            <table className="athena-table" data-testid="users-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Cargo</th>
                  <th>Unidade</th>
                  <th>Status</th>
                  <th>Último acesso</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName || '—'}</td>
                    <td>{u.email || '—'}</td>
                    <td>{u.roles.join(', ') || '—'}</td>
                    <td>{u.unitIds.length || '—'}</td>
                    <td>{u.status}</td>
                    <td>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="athena-title mb-3 text-lg">Novo usuário</h2>
        <form onSubmit={onInvite} className="grid max-w-xl gap-3 sm:grid-cols-2">
          <input
            required
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="athena-input"
          />
          <input
            placeholder="Nome"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="athena-input"
          />
          <input
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="athena-input"
          />
          <select
            required
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="athena-input"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={loading || !roleId} className="sm:col-span-2">
            {loading ? 'Salvando…' : 'Criar usuário'}
          </Button>
        </form>
        {inviteToken ? (
          <p className="mt-3 break-all rounded-[10px] border border-[var(--gold)] bg-[rgba(212,175,55,0.1)] p-3 text-sm text-[var(--gold)]">
            Usuário liberado no sistema (DEV: senha teste123). Link legado: /accept-invite?token=
            {inviteToken}
          </p>
        ) : null}
      </section>
    </div>
  );
}
