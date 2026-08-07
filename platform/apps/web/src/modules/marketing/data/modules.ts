import type { LucideIcon } from 'lucide-react';
import {
  Users,
  Wallet,
  CalendarDays,
  Dumbbell,
  Handshake,
  ScanLine,
  Activity,
  Ticket,
  BarChart3,
  Sparkles,
  Package,
  ShoppingCart,
} from 'lucide-react';

export type MarketingModule = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const MARKETING_MODULES: MarketingModule[] = [
  {
    id: 'alunos',
    title: 'Gestão de Alunos',
    description: 'Cadastro, matrículas, status e histórico completo em um só lugar.',
    icon: Users,
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    description: 'Mensalidades, inadimplência, caixa e conciliação com clareza.',
    icon: Wallet,
  },
  {
    id: 'agenda',
    title: 'Agenda',
    description: 'Aulas, horários e ocupação da academia em tempo real.',
    icon: CalendarDays,
  },
  {
    id: 'treinos',
    title: 'Treinos',
    description: 'Prescrições, templates e acompanhamento da evolução.',
    icon: Dumbbell,
  },
  {
    id: 'crm',
    title: 'CRM',
    description: 'Pipeline comercial, leads e recuperação de alunos.',
    icon: Handshake,
  },
  {
    id: 'checkin',
    title: 'Check-in',
    description: 'Acesso rápido por QR Code e controle de presença.',
    icon: ScanLine,
  },
  {
    id: 'wellhub',
    title: 'Wellhub',
    description: 'Integração nativa para check-ins e elegibilidade.',
    icon: Activity,
  },
  {
    id: 'totalpass',
    title: 'TotalPass',
    description: 'Validação e operação alinhadas ao seu fluxo diário.',
    icon: Ticket,
  },
  {
    id: 'bi',
    title: 'BI',
    description: 'KPIs, gráficos e visão executiva para decisões rápidas.',
    icon: BarChart3,
  },
  {
    id: 'ai',
    title: 'Movvo AI',
    description: 'Assistente inteligente para gestão e operação da academia.',
    icon: Sparkles,
  },
  {
    id: 'estoque',
    title: 'Estoque',
    description: 'Produtos, movimentações e alertas de reposição.',
    icon: Package,
  },
  {
    id: 'pdv',
    title: 'PDV',
    description: 'Vendas no balcão com integração ao financeiro.',
    icon: ShoppingCart,
  },
];
