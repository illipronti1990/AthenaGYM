'use client';

import type { ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { DashboardLayoutItem, DashboardWidgetId } from '@athena/shared';

export type DashboardTile = {
  id: DashboardWidgetId;
  node: ReactNode;
  span?: 'full' | 'half';
};

function SortableTile({
  id,
  span,
  children,
}: {
  id: string;
  span?: 'full' | 'half';
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${span === 'full' ? 'md:col-span-2 xl:col-span-4' : 'md:col-span-1 xl:col-span-2'}`}
    >
      <button
        type="button"
        className="absolute right-3 top-3 z-10 rounded-md border border-[var(--border)] bg-[var(--card)] p-1 text-[var(--muted)] hover:text-[var(--gold)]"
        title="Arrastar para reordenar"
        aria-label="Arrastar widget"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      {children}
    </div>
  );
}

export function DashboardGrid({
  layout,
  tiles,
  onReorder,
}: {
  layout: DashboardLayoutItem[];
  tiles: DashboardTile[];
  onReorder: (next: DashboardLayoutItem[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visibleIds = layout
    .filter((i) => i.visible)
    .sort((a, b) => a.order - b.order)
    .map((i) => i.id);

  const tileMap = new Map(tiles.map((t) => [t.id, t]));

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleIds.indexOf(active.id as DashboardWidgetId);
    const newIndex = visibleIds.indexOf(over.id as DashboardWidgetId);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(visibleIds, oldIndex, newIndex);
    const hidden = layout.filter((i) => !i.visible);
    const nextVisible = reordered.map((id, order) => {
      const prev = layout.find((i) => i.id === id)!;
      return { ...prev, order, visible: true };
    });
    const nextHidden = hidden.map((item, idx) => ({
      ...item,
      order: nextVisible.length + idx,
    }));
    onReorder([...nextVisible, ...nextHidden]);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={visibleIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-grid">
          {visibleIds.map((id) => {
            const tile = tileMap.get(id);
            if (!tile) return null;
            return (
              <SortableTile key={id} id={id} span={tile.span || (id === 'kpis' || id === 'quickActions' ? 'full' : 'half')}>
                {tile.node}
              </SortableTile>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
