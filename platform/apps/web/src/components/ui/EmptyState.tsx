'use client';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="athena-empty">
      <p className="athena-title text-base">{title}</p>
      {description ? <p className="mt-2 text-sm text-[var(--muted)]">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
