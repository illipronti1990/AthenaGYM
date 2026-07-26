import type { ReactNode } from 'react';

export type SidebarItem = {
  href: string;
  label: string;
  icon?: ReactNode;
};

export function SidebarNav({
  items,
  activeHref,
  header,
  footer,
}: {
  items: SidebarItem[];
  activeHref: string;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <aside className="athena-sidebar">
      {header}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
        {items.map((item) => {
          const active =
            item.href === '/app'
              ? activeHref === '/app'
              : activeHref === item.href || activeHref.startsWith(`${item.href}/`);
          return (
            <a
              key={item.href}
              href={item.href}
              className={`athena-sidebar-link ${active ? 'athena-sidebar-link-active' : ''}`}
            >
              {item.icon ? <span aria-hidden style={{ display: 'inline-flex' }}>{item.icon}</span> : null}
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
      {footer ? (
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.85rem' }}>{footer}</div>
      ) : null}
    </aside>
  );
}
