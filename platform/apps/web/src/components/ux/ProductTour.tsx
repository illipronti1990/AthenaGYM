'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUiPreferences } from '@/hooks/useUiPreferences';

const STEPS = [
  {
    title: 'Bem-vindo ao Movvo ERP!',
    body: 'Vamos configurar o essencial para operar sua academia com confiança.',
    href: '/app',
  },
  {
    title: '1. Cadastre sua academia',
    body: 'Confirme dados da empresa e unidades em Configurações.',
    href: '/app/settings',
  },
  {
    title: '2. Adicione seus professores',
    body: 'Convide a equipe para treinos e acompanhamento.',
    href: '/app/trainers',
  },
  {
    title: '3. Cadastre seus alunos',
    body: 'Crie fichas e matrículas para começar a operação.',
    href: '/app/alunos',
  },
  {
    title: '4. Configure o financeiro',
    body: 'Ative caixa, planos e recebíveis para cobrança em dia.',
    href: '/app/financeiro/receber',
  },
  {
    title: '5. Realize o primeiro check-in',
    body: 'Valide o acesso na recepção e acompanhe a ocupação.',
    href: '/app/acesso',
  },
] as const;

export function ProductTour() {
  const { prefs, setPrefs } = useUiPreferences();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!prefs.tourCompletedV1) setOpen(true);
  }, [prefs.tourCompletedV1]);

  useEffect(() => {
    const onRestart = () => {
      setPrefs({ tourCompletedV1: false });
      setStep(0);
      setOpen(true);
    };
    window.addEventListener('movvo:restart-tour', onRestart);
    return () => window.removeEventListener('movvo:restart-tour', onRestart);
  }, [setPrefs]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step >= STEPS.length - 1;

  function finish() {
    setPrefs({ tourCompletedV1: true });
    setOpen(false);
  }

  return (
    <div
      className="movvo-tour-overlay"
      data-testid="product-tour"
      role="dialog"
      aria-modal="true"
      aria-label="Tour guiado Movvo"
    >
      <div className="movvo-tour-card">
        <p className="text-xs uppercase tracking-wide text-[var(--gold)] mb-2">
          Tour · passo {step + 1} de {STEPS.length}
        </p>
        <h2 className="athena-title text-xl">{current.title}</h2>
        <p className="text-sm text-[var(--muted)] mt-2">{current.body}</p>
        <div className="mt-4 flex flex-wrap gap-2 justify-between">
          <button type="button" className="athena-btn athena-btn-secondary text-sm" onClick={finish} data-testid="tour-skip">
            Pular tour
          </button>
          <div className="flex gap-2">
            <Link
              href={current.href}
              className="athena-btn athena-btn-secondary text-sm"
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            >
              Abrir tela
            </Link>
            {isLast ? (
              <button type="button" className="athena-btn athena-btn-primary text-sm" onClick={finish} data-testid="tour-finish">
                Concluir
              </button>
            ) : (
              <button
                type="button"
                className="athena-btn athena-btn-primary text-sm"
                onClick={() => setStep((s) => s + 1)}
                data-testid="tour-next"
              >
                Próximo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
