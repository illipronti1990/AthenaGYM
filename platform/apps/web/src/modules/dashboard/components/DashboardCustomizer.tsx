'use client';

import type { DashboardLayoutItem, DashboardWidgetId } from '@athena/shared';
import { Button } from '@athena/ui';

const LABELS: Record<DashboardWidgetId, string> = {
  quickActions: 'Ações rápidas',
  kpis: 'KPIs',
  revenueChart: 'Receita',
  checkinChart: 'Check-ins',
  agenda: 'Agenda',
  activities: 'Atividades',
  dues: 'Mensalidades',
  birthdays: 'Aniversariantes',
  goals: 'Metas',
  ranking: 'Ranking',
};

export function DashboardCustomizer({
  layout,
  open,
  onClose,
  onChange,
  onSave,
  saving,
}: {
  layout: DashboardLayoutItem[];
  open: boolean;
  onClose: () => void;
  onChange: (next: DashboardLayoutItem[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (!open) return null;

  function toggle(id: DashboardWidgetId) {
    onChange(
      layout.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)),
    );
  }

  return (
    <div className="athena-modal-overlay" role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="athena-card athena-modal-panel" role="dialog" aria-label="Personalizar dashboard">
        <h2 className="athena-h3 mb-2 text-[var(--gold)]">Widgets do dashboard</h2>
        <p className="athena-caption mb-4">Escolha o que aparece. Arraste os cards para reordenar.</p>
        <ul className="mb-4 space-y-2">
          {layout
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-[10px] border border-[var(--border)] px-3 py-2">
                <span className="text-sm">{LABELS[item.id]}</span>
                <label className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                  <input type="checkbox" checked={item.visible} onChange={() => toggle(item.id)} />
                  Visível
                </label>
              </li>
            ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
