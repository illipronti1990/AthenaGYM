import {
  Skeleton as AthenaSkeleton,
  SkeletonTable,
  SkeletonDashboard,
  SkeletonForm,
  SkeletonCard,
  SkeletonChart,
} from '@movvo/ui';

export function Skeleton({ className = '' }: { className?: string }) {
  return <AthenaSkeleton className={className} />;
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
