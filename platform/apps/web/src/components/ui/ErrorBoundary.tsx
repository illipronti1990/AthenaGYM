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
        <div className="rounded border border-red-200 bg-red-50 p-6 text-red-900">
          <h2 className="text-lg font-semibold">Algo deu errado</h2>
          <p className="mt-2 text-sm">{this.state.message || 'Erro inesperado'}</p>
          <button
            type="button"
            className="mt-4 rounded bg-[#A3001B] px-3 py-1.5 text-sm text-white"
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
