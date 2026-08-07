'use client';

import type { ReactNode } from 'react';
import { Button } from '../Button';

export type WizardStep = {
  id: string;
  title: string;
  description?: string;
};

export function StepIndicator({
  steps,
  current,
}: {
  steps: WizardStep[];
  current: number;
}) {
  return (
    <ol className="movvo-steps" data-testid="step-indicator">
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={step.id} className={`movvo-step is-${state}`}>
            <span className="movvo-step-index">{i + 1}</span>
            <span className="movvo-step-title">{step.title}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Wizard({
  steps,
  current,
  onChange,
  children,
  onFinish,
  finishLabel = 'Concluir',
  busy = false,
  canNext = true,
}: {
  steps: WizardStep[];
  current: number;
  onChange: (index: number) => void;
  children: ReactNode;
  onFinish: () => void;
  finishLabel?: string;
  busy?: boolean;
  canNext?: boolean;
}) {
  const last = current >= steps.length - 1;
  return (
    <div className="movvo-wizard" data-testid="wizard">
      <StepIndicator steps={steps} current={current} />
      <p className="movvo-muted mb-4 text-sm">
        {steps[current]?.description || `Etapa ${current + 1} de ${steps.length}`}
      </p>
      <div className="movvo-wizard-body">{children}</div>
      <div className="movvo-form-actions">
        <Button
          type="button"
          variant="secondary"
          disabled={current === 0 || busy}
          onClick={() => onChange(Math.max(0, current - 1))}
        >
          Voltar
        </Button>
        {!last ? (
          <Button type="button" disabled={!canNext || busy} onClick={() => onChange(current + 1)}>
            Continuar
          </Button>
        ) : (
          <Button type="button" loading={busy} loadingLabel="Salvando…" onClick={onFinish}>
            {finishLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
