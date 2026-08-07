'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@athena/ui';
import { operationsApi } from '../services/operationsApi';
import { StudentSelect } from './StudentSelect';
import { ExportButtons } from '@/modules/polish/components/ExportButtons';
import { useToast } from '@/components/ui/Toast';
import { apiGetMe } from '@/services/api';
import { DenialReasonBanner } from '@/modules/acesso/components/DenialReasonBanner';
import { acessoApi } from '@/modules/acesso/services/acessoApi';

export function CheckinPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [studentId, setStudentId] = useState('');
  const [unitId, setUnitId] = useState<string | undefined>();
  const [cpf, setCpf] = useState('');
  const [code, setCode] = useState('');
  const [qr, setQr] = useState<string | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof operationsApi.checkins>>>([]);
  const [busy, setBusy] = useState<'manual' | 'qr' | 'validate' | 'cpf' | 'code' | null>(null);
  const [deny, setDeny] = useState<string | null>(null);

  async function refreshHistory() {
    setHistory(await operationsApi.checkins(accessToken));
  }

  useEffect(() => {
    refreshHistory().catch(() => undefined);
    void apiGetMe(accessToken)
      .then((me) => {
        const id =
          me.auth.defaultUnitId || me.profile.defaultUnitId || me.auth.unitIds[0] || me.units[0]?.id;
        if (id) setUnitId(id);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onManual(e: FormEvent) {
    e.preventDefault();
    if (!studentId) {
      push('Selecione um aluno', 'error');
      return;
    }
    setBusy('manual');
    setDeny(null);
    try {
      await operationsApi.createCheckin(accessToken, {
        studentId,
        method: 'manual',
        ...(unitId ? { unitId } : {}),
      });
      push('Check-in manual realizado');
      setQr(null);
      setQrInput('');
      await refreshHistory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha no check-in';
      setDeny(msg);
      push(msg, 'error');
    } finally {
      setBusy(null);
    }
  }

  async function onCpf() {
    if (!cpf.trim()) {
      push('Informe o CPF', 'error');
      return;
    }
    setBusy('cpf');
    setDeny(null);
    try {
      await acessoApi.checkinByCpf(accessToken, cpf, unitId);
      push('Check-in por CPF realizado');
      setCpf('');
      await refreshHistory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha no check-in CPF';
      setDeny(msg);
      push(msg, 'error');
    } finally {
      setBusy(null);
    }
  }

  async function onCode() {
    if (!code.trim()) {
      push('Informe o código', 'error');
      return;
    }
    setBusy('code');
    setDeny(null);
    try {
      await acessoApi.checkinByCode(accessToken, code, unitId);
      push('Check-in por código realizado');
      setCode('');
      await refreshHistory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha no check-in código';
      setDeny(msg);
      push(msg, 'error');
    } finally {
      setBusy(null);
    }
  }

  async function onQr() {
    if (!studentId) {
      push('Selecione um aluno para gerar o QR', 'error');
      return;
    }
    setBusy('qr');
    try {
      const r = await operationsApi.generateQr(accessToken, studentId, unitId);
      setQr(r.token);
      setQrInput(r.token);
      setExpiresAt(r.expiresAt);
      push('QR Code gerado (válido por 30s)');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao gerar QR', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function onCheckinQr() {
    const token = qrInput.trim() || qr;
    if (!token) {
      push('Gere ou cole um QR Code para validar', 'error');
      return;
    }
    setBusy('validate');
    setDeny(null);
    try {
      await operationsApi.createCheckin(accessToken, {
        ...(studentId ? { studentId } : {}),
        method: 'qr',
        qrToken: token,
        ...(unitId ? { unitId } : {}),
      });
      push('QR validado — check-in realizado');
      setQr(null);
      setQrInput('');
      setExpiresAt(null);
      await refreshHistory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao validar QR';
      setDeny(msg);
      push(msg, 'error');
    } finally {
      setBusy(null);
    }
  }

  const qrImageUrl = qr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qr)}`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons accessToken={accessToken} resource="checkins" />
      </div>

      <DenialReasonBanner message={deny} />

      <form onSubmit={onManual} className="space-y-4">
        <StudentSelect accessToken={accessToken} value={studentId} onChange={setStudentId} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy !== null || !studentId} data-testid="checkin-manual">
            {busy === 'manual' ? 'Salvando…' : 'Check-in manual'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null || !studentId}
            onClick={() => void onQr()}
            data-testid="generate-qr"
          >
            {busy === 'qr' ? 'Gerando…' : 'Gerar QR (30s)'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null || !(qrInput.trim() || qr)}
            onClick={() => void onCheckinQr()}
            data-testid="validate-qr"
          >
            {busy === 'validate' ? 'Validando…' : 'Validar QR'}
          </Button>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-[var(--muted)]">
          CPF
          <div className="mt-1 flex gap-2">
            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="Somente números"
              className="athena-input block w-full"
              data-testid="checkin-cpf"
            />
            <Button type="button" disabled={busy !== null} onClick={() => void onCpf()}>
              {busy === 'cpf' ? '…' : 'Entrar'}
            </Button>
          </div>
        </label>
        <label className="block text-sm text-[var(--muted)]">
          Código / cartão
          <div className="mt-1 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de acesso"
              className="athena-input block w-full"
              data-testid="checkin-code"
            />
            <Button type="button" disabled={busy !== null} onClick={() => void onCode()}>
              {busy === 'code' ? '…' : 'Entrar'}
            </Button>
          </div>
        </label>
      </div>

      {qrImageUrl ? (
        <div className="flex flex-wrap items-start gap-4 rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt="QR Code de check-in"
            width={220}
            height={220}
            className="rounded bg-white p-2"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium text-[var(--gold)]">QR Code ativo</p>
            {expiresAt ? (
              <p className="text-xs text-[var(--muted)]">
                Expira às {new Date(expiresAt).toLocaleTimeString('pt-BR')}
              </p>
            ) : null}
            <p className="break-all font-mono text-[10px] text-[var(--muted)]">{qr}</p>
          </div>
        </div>
      ) : null}

      <label className="block text-sm text-[var(--muted)]">
        Código QR (para validar)
        <input
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          placeholder="Cole o token do QR aqui"
          className="athena-input mt-1 block w-full max-w-xl font-mono text-xs"
          data-testid="qr-token-input"
        />
      </label>

      <div>
        <h2 className="athena-title mb-2 text-sm">Histórico</h2>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum check-in ainda.</p>
        ) : (
          <ul className="athena-list text-sm">
            {history.slice(0, 20).map((h) => (
              <li key={h.id} className="athena-list-item">
                <span>
                  {h.method === 'qr' ? 'QR' : h.method === 'manual' ? 'Manual' : h.method} ·{' '}
                  {h.direction === 'in' ? 'Entrada' : 'Saída'}
                  {h.partner ? ` · ${h.partner}` : ''}
                </span>
                <span className="text-[var(--muted)]">
                  {new Date(h.createdAt).toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
