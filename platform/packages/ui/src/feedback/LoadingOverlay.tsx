'use client';

import { Loading } from '../Skeleton';

export function LoadingOverlay({
  show,
  label = 'Carregando…',
}: {
  show: boolean;
  label?: string;
}) {
  if (!show) return null;
  return (
    <div className="movvo-loading-overlay" data-testid="loading-overlay">
      <div className="movvo-card movvo-loading-panel">
        <Loading label={label} />
      </div>
    </div>
  );
}
