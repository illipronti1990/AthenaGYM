import {
  Skeleton as MovvoSkeleton,
  SkeletonTable,
  SkeletonDashboard,
  SkeletonForm,
  SkeletonCard,
  SkeletonChart,
} from '@movvo/ui';

export function Skeleton({ className = '' }: { className?: string }) {
  return <MovvoSkeleton className={className} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return <SkeletonTable rows={rows} />;
}

export {
  SkeletonDashboard,
  SkeletonForm,
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
};
