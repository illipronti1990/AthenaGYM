import type { HTMLAttributes, ReactNode } from 'react';

export function Page({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`athena-page ${className}`} {...props}>
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
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="athena-page-header">
      <div className="min-w-0 flex-1">
        <h1 className="athena-h1 inline-flex items-center gap-3">
          {icon ? <span className="text-[var(--gold)]">{icon}</span> : null}
          {title}
        </h1>
        {description ? <p className="athena-page-desc">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="athena-page-actions">{actions}</div> : null}
    </header>
  );
}

export function PageActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`athena-page-actions ${className}`}>{children}</div>;
}

export function PageFilters({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`athena-page-filters ${className}`}>{children}</div>;
}

export function PageContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`athena-page-content ${className}`}>{children}</div>;
}
