import type { LucideIcon } from 'lucide-react';
import {
  Cloud,
  Building2,
  MapPinned,
  Palette,
  Sparkles,
  Code2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export type Differential = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const MARKETING_DIFFERENTIALS: Differential[] = [
  {
    id: 'cloud',
    title: 'Plataforma 100% Cloud',
    description: 'Acesse de qualquer lugar, com atualizações contínuas.',
    icon: Cloud,
  },
  {
    id: 'multi-empresa',
    title: 'Multiempresa',
    description: 'Gerencie grupos e holdings com isolamento seguro.',
    icon: Building2,
  },
  {
    id: 'multi-unidade',
    title: 'Multiunidade',
    description: 'Visão consolidada e operação por unidade.',
    icon: MapPinned,
  },
  {
    id: 'white-label',
    title: 'White Label',
    description: 'Marca da sua rede na experiência do produto.',
    icon: Palette,
  },
  {
    id: 'ai',
    title: 'IA integrada',
    description: 'Movvo AI para apoiar decisões e rotinas.',
    icon: Sparkles,
  },
  {
    id: 'api',
    title: 'API pública',
    description: 'Integre sistemas e automações com segurança.',
    icon: Code2,
  },
  {
    id: 'updates',
    title: 'Atualizações automáticas',
    description: 'Novos recursos sem dor de cabeça de instalação.',
    icon: RefreshCw,
  },
  {
    id: 'lgpd',
    title: 'Segurança LGPD',
    description: 'Controles, auditoria e privacidade no centro.',
    icon: ShieldCheck,
  },
];
