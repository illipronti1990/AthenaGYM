'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import type { DataGridRowAction } from './types';

type MenuPos = { top: number; left: number };

export function RowMenu<T>({ row, actions }: { row: T; actions: Array<DataGridRowAction<T>> }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const visible = actions.filter((a) => !a.hidden?.(row));

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuW = 180;
    const menuH = Math.min(visible.length * 40 + 16, 280);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < menuH && rect.top > menuH
        ? rect.top - menuH - 4
        : rect.bottom + 4;
    const left = Math.min(
      Math.max(8, rect.right - menuW),
      window.innerWidth - menuW - 8,
    );
    setPos({ top, left });
  }, [open, visible.length]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  if (!visible.length) return null;

  return (
    <div className="movvo-dg-row-menu">
      <button
        ref={btnRef}
        type="button"
        className="movvo-icon-btn"
        aria-label="Ações"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical size={16} />
      </button>
      {open && pos
        ? createPortal(
            <ul
              ref={menuRef}
              className="movvo-dg-menu is-portal"
              style={{ top: pos.top, left: pos.left }}
              role="menu"
            >
              {visible.map((a) => (
                <li key={a.id} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={a.danger ? 'is-danger' : ''}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      a.onClick(row);
                    }}
                  >
                    {a.label}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
