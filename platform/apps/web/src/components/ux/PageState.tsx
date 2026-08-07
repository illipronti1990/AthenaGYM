'use client';

import type { ReactNode } from 'react';
import {
  EmptyState,
  ErrorState,
  SkeletonDashboard,
  SkeletonForm,
  SkeletonTable,
} from '@athena/ui';

export type PageStateKind =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'error'
  | 'forbidden'
  | 'offline';

export type PageStateProps = {
  state: PageStateKind;
  children?: ReactNode;
  skeleton?: 'table' | 'dashboard' | 'form' | 'none';
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  forbiddenTitle?: string;
  forbiddenDescription?: string;
  className?: string;
};

/** Unified page/section state — never leave a blank screen. */
export function PageState({
  state,
  children,
  skeleton = 'table',
  emptyTitle = 'Nada por aqui',
  emptyDescription = 'Não há itens para exibir no momento.',
  emptyAction,
  errorTitle = 'Não foi possível carregar',
  errorDescription = 'Tente novamente em instantes.',
  onRetry,
  forbiddenTitle = 'Sem permissão',
  forbiddenDescription = 'Você não tem acesso a este recurso.',
  className,
}: PageStateProps) {
  const retryAction = onRetry ? (
    <button type="button" className="athena-btn athena-btn-secondary" onClick={onRetry}>
      Tentar de novo
    </button>
  ) : undefined;

  if (state === 'offline') {
    return (
      <div className={className} data-testid="page-state-offline">
        <EmptyState
          title="Você está offline"
          description="Verifique a conexão e tente novamente."
          action={retryAction}
        />
      </div>
    );
  }

  if (state === 'loading') {
    if (skeleton === 'none') return <div className={className} data-testid="page-state-loading" />;
    if (skeleton === 'dashboard') {
      return (
        <div className={className} data-testid="page-state-loading">
          <SkeletonDashboard />
        </div>
      );
    }
    if (skeleton === 'form') {
      return (
        <div className={className} data-testid="page-state-loading">
          <SkeletonForm />
        </div>
      );
    }
    return (
      <div className={className} data-testid="page-state-loading">
        <SkeletonTable rows={6} />
      </div>
    );
  }

  if (state === 'forbidden') {
    return (
      <div className={className} data-testid="page-state-forbidden">
        <EmptyState title={forbiddenTitle} description={forbiddenDescription} />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={className} data-testid="page-state-error">
        <ErrorState title={errorTitle} description={errorDescription} action={retryAction} />
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div className={className} data-testid="page-state-empty">
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className={className} data-testid="page-state-ready">
      {children}
    </div>
  );
}
