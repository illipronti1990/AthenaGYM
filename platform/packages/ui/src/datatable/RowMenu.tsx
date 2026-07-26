'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import type { DataGridRowAction } from './types';

export function RowMenu<T>({ row, actions }: { row: T; actions: Array<DataGridRowAction<T>> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = actions.filter((a) => !a.hidden?.(row));

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!visible.length) return null;

  return (
    <div className="athena-dg-row-menu" ref={ref}>
      <button
        type="button"
        className="athena-icon-btn"
        aria-label="Ações"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <ul className="athena-dg-menu">
          {visible.map((a) => (
            <li key={a.id}>
              <button
                type="button"
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
        </ul>
      ) : null}
    </div>
  );
}
