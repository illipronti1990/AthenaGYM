import type { CSSProperties } from 'react';
import { Skeleton } from '../Skeleton';

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`athena-card ${className}`} data-testid="skeleton-card">
      <Skeleton style={{ width: '40%', height: 14, marginBottom: 16 }} />
      <Skeleton style={{ width: '70%', height: 28, marginBottom: 12 }} />
      <Skeleton style={{ width: '55%', height: 12 }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" data-testid="skeleton-table">
      <Skeleton style={{ height: 36, width: '100%' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} style={{ height: 44, width: '100%' }} />
      ))}
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`athena-card ${className}`} data-testid="skeleton-chart">
      <Skeleton style={{ width: '35%', height: 16, marginBottom: 20 }} />
      <div className="flex h-40 items-end gap-2">
        {[40, 70, 55, 85, 45, 90, 60].map((h, i) => (
          <Skeleton key={i} style={{ height: `${h}%`, flex: 1, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" data-testid="skeleton-form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton style={{ width: 80, height: 12 }} />
          <Skeleton style={{ width: '100%', height: 40 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4" data-testid="skeleton-dashboard">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton style={{ width: 220, height: 28 }} />
          <Skeleton style={{ width: 280, height: 14 }} />
        </div>
        <Skeleton style={{ width: 120, height: 36 }} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );
}

export function SkeletonBlock({ style, className = '' }: { style?: CSSProperties; className?: string }) {
  return <Skeleton className={className} style={style} />;
}
