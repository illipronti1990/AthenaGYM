'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { marketingApi } from '../services/marketingApi';
import { trackEvent } from '../lib/analytics';

const INTERESTS = [
  'Gestão completa',
  'Financeiro',
  'CRM / vendas',
  'Treinos',
  'Integrações',
  'Multiunidade',
  'White-label',
] as const;

type FormState = {
  fullName: string;
  academyName: string;
  city: string;
  state: string;
  email: string;
  whatsapp: string;
  studentCount: string;
  primaryInterest: string;
  planInterest: string;
  message: string;
  consentLgpd: boolean;
  website: string;
};

const INITIAL: FormState = {
  fullName: '',
  academyName: '',
  city: '',
  state: '',
  email: '',
  whatsapp: '',
  studentCount: '',
  primaryInterest: '',
  planInterest: '',
  message: '',
  consentLgpd: false,
  website: '',
};

export function DemoRequestForm({
  compact = false,
  redirectOnSuccess = true,
}: {
  compact?: boolean;
  redirectOnSuccess?: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const plan = search.get('plan');
    if (plan) setForm((p) => ({ ...p, planInterest: plan }));
  }, [search]);

  const utm = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const q = new URLSearchParams(window.location.search);
    return {
      utmSource: q.get('utm_source') || undefined,
      utmMedium: q.get('utm_medium') || undefined,
      utmCampaign: q.get('utm_campaign') || undefined,
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (!form.consentLgpd) {
      setError('É necessário aceitar o consentimento LGPD.');
      return;
    }
    const students = Number(form.studentCount);
    if (!Number.isFinite(students) || students < 1) {
      setError('Informe um número de alunos válido.');
      return;
    }
    setLoading(true);
    try {
      const res = await marketingApi.submitDemoRequest({
        fullName: form.fullName.trim(),
        academyName: form.academyName.trim(),
        city: form.city.trim(),
        state: form.state.trim() || undefined,
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim(),
        studentCount: students,
        primaryInterest: form.primaryInterest || undefined,
        planInterest: form.planInterest || undefined,
        message: form.message.trim(),
        consentLgpd: form.consentLgpd,
        website: form.website,
        ...utm,
      });
      trackEvent('demo_form_submit', { ok: true, plan: form.planInterest || '' });
      setOk(true);
      setForm(INITIAL);
      if (redirectOnSuccess && res.id) {
        router.push(
          `/demonstracao/obrigado?id=${encodeURIComponent(res.id)}&academy=${encodeURIComponent(form.academyName)}`,
        );
      }
    } catch (err) {
      trackEvent('demo_form_submit', { ok: false });
      setError(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className={`movvo-mkt-form${compact ? ' is-compact' : ''}`}
      onSubmit={onSubmit}
      data-testid="demo-form"
      noValidate
    >
      <div className="movvo-mkt-form-grid">
        <label>
          Nome
          <input required data-testid="demo-full-name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </label>
        <label>
          Academia
          <input required data-testid="demo-academy" value={form.academyName} onChange={(e) => set('academyName', e.target.value)} />
        </label>
        <label>
          Cidade
          <input required data-testid="demo-city" value={form.city} onChange={(e) => set('city', e.target.value)} />
        </label>
        <label>
          Estado (UF)
          <input data-testid="demo-state" maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="SP" />
        </label>
        <label>
          E-mail
          <input required type="email" data-testid="demo-email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </label>
        <label>
          WhatsApp
          <input required data-testid="demo-whatsapp" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
        </label>
        <label>
          Número de alunos
          <input required type="number" min={1} data-testid="demo-students" value={form.studentCount} onChange={(e) => set('studentCount', e.target.value)} />
        </label>
        <label>
          Interesse principal
          <select data-testid="demo-interest" value={form.primaryInterest} onChange={(e) => set('primaryInterest', e.target.value)}>
            <option value="">Selecione</option>
            {INTERESTS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </label>
        <label>
          Plano de interesse
          <select data-testid="demo-plan" value={form.planInterest} onChange={(e) => set('planInterest', e.target.value)}>
            <option value="">Sob consulta</option>
            <option value="start">Start</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </label>
        <label className="movvo-mkt-form-full">
          Mensagem
          <textarea rows={4} data-testid="demo-message" value={form.message} onChange={(e) => set('message', e.target.value)} />
        </label>
      </div>

      <label className="movvo-mkt-hp" aria-hidden>
        Website
        <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
      </label>

      <label className="movvo-mkt-consent">
        <input type="checkbox" data-testid="demo-consent" checked={form.consentLgpd} onChange={(e) => set('consentLgpd', e.target.checked)} />
        Autorizo o contato da Movvo e o tratamento dos meus dados conforme a Política de Privacidade (LGPD).
      </label>

      {error ? <p className="movvo-mkt-form-error" role="alert" data-testid="demo-error">{error}</p> : null}
      {ok && !redirectOnSuccess ? (
        <p className="movvo-mkt-form-ok" role="status" data-testid="demo-success">
          Recebemos seu pedido. Em breve nossa equipe entra em contato.
        </p>
      ) : null}

      <button type="submit" className="movvo-mkt-btn movvo-mkt-btn-primary movvo-mkt-btn-lg" disabled={loading} data-testid="demo-submit">
        {loading ? 'Enviando…' : 'Solicitar demonstração'}
      </button>
    </form>
  );
}
