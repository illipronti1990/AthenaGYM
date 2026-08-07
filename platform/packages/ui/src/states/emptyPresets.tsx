import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';

export type EmptyPresetKey =
  | 'noStudents'
  | 'noFinance'
  | 'noStock'
  | 'noCrm'
  | 'noWorkouts'
  | 'noResults'
  | 'noNotifications';

export const emptyPresets: Record<
  EmptyPresetKey,
  { title: string; description: string }
> = {
  noStudents: {
    title: 'Nenhum aluno encontrado',
    description: 'Cadastre o primeiro aluno ou ajuste os filtros da busca.',
  },
  noFinance: {
    title: 'Sem lançamentos financeiros',
    description: 'Quando houver receitas ou despesas, elas aparecem aqui.',
  },
  noStock: {
    title: 'Estoque vazio',
    description: 'Cadastre produtos ou registre uma entrada para começar.',
  },
  noCrm: {
    title: 'Nenhum lead no funil',
    description: 'Capture oportunidades comerciais ou importe contatos.',
  },
  noWorkouts: {
    title: 'Sem treinos',
    description: 'Crie uma ficha ou atribua um treino ao aluno.',
  },
  noResults: {
    title: 'Nenhum resultado',
    description: 'Tente outros termos ou limpe os filtros.',
  },
  noNotifications: {
    title: 'Sem notificações',
    description: 'Quando houver alertas ou mensagens, você verá aqui.',
  },
};

export function EmptyStatePreset({
  preset,
  action,
  icon,
}: {
  preset: EmptyPresetKey;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  const cfg = emptyPresets[preset];
  return (
    <EmptyState
      title={cfg.title}
      description={cfg.description}
      action={action}
      icon={icon}
    />
  );
}
