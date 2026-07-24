'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Role, UserListItem } from '@athenas/shared';
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
      push('Convite criado');
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
        <h2 className="mb-3 text-lg font-semibold">Usuários</h2>
        {!users ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
            <table className="min-w-full text-left text-sm" data-testid="users-table">
              <thead className="border-b bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Cargo</th>
                  <th className="px-3 py-2">Unidade</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Último acesso</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{u.fullName || '—'}</td>
                    <td className="px-3 py-2">{u.email || '—'}</td>
                    <td className="px-3 py-2">{u.roles.join(', ') || '—'}</td>
                    <td className="px-3 py-2">{u.unitIds.length || '—'}</td>
                    <td className="px-3 py-2">{u.status}</td>
                    <td className="px-3 py-2">
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
        <h2 className="mb-3 text-lg font-semibold">Convidar usuário</h2>
        <form onSubmit={onInvite} className="grid max-w-xl gap-3 sm:grid-cols-2">
          <input
            required
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2"
          />
          <input
            placeholder="Nome"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2"
          />
          <input
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2"
          />
          <select
            required
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !roleId}
            className="rounded bg-[#A3001B] px-4 py-2 font-semibold text-white disabled:opacity-60 sm:col-span-2"
          >
            {loading ? 'Enviando…' : 'Enviar convite'}
          </button>
        </form>
        {inviteToken ? (
          <p className="mt-3 break-all rounded bg-amber-50 p-3 text-sm text-amber-900">
            Link DEV: /accept-invite?token={inviteToken}
          </p>
        ) : null}
      </section>
    </div>
  );
}
