'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientError } from './monitoring/reportError';
import { Button } from './Button';

type Props = {
  children: ReactNode;
  onReset?: () => void;
  fallbackTitle?: string;
};

type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, 'error-boundary', info.componentStack?.slice(0, 200));
  }

  reset = () => {
    this.setState({ hasError: false, message: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="athena-error-boundary" role="alert" data-testid="error-boundary">
          <p className="athena-h2" style={{ color: 'var(--gold)' }}>
            Ops!
          </p>
          <h2 className="athena-h3 mt-2">
            {this.props.fallbackTitle || 'Algo deu errado'}
          </h2>
          <p className="athena-muted mt-2 text-sm">
            {this.state.message || 'Erro inesperado. Nossa equipe já pode analisar o registro.'}
          </p>
          <div className="athena-error-boundary-actions">
            <Button type="button" onClick={this.reset}>
              Tentar novamente
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = '/app';
              }}
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
