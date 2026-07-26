'use client';

import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="athena-card border-[var(--danger)]">
          <h2 className="athena-h3 text-[var(--danger)]">Algo deu errado</h2>
          <p className="athena-muted mt-2 text-sm">{this.state.message || 'Erro inesperado'}</p>
          <button
            type="button"
            className="athena-btn athena-btn-danger mt-4"
            onClick={() => this.setState({ hasError: false, message: undefined })}
          >
            Tentar de novo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
