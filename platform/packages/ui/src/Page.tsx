import type { HTMLAttributes, ReactNode } from 'react';

export function Page({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`movvo-page ${className}`} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  children,
}: {
  title: ReactNode;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="movvo-page-header">
      <div className="min-w-0 flex-1">
        <h1 className="movvo-h1 inline-flex items-center gap-3">
          {icon ? <span className="text-[var(--gold)]">{icon}</span> : null}
          {title}
        </h1>
        {description ? <p className="movvo-page-desc">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="movvo-page-actions">{actions}</div> : null}
    </header>
  );
}

export function PageActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`movvo-page-actions ${className}`}>{children}</div>;
}

export function PageFilters({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`movvo-page-filters ${className}`}>{children}</div>;
}

export function PageContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`movvo-page-content ${className}`}>{children}</div>;
}
