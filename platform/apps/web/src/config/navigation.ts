import { athenaIcons, type AthenaIconName } from '@athena/ui';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  iconName?: AthenaIconName;
  keywords?: string[];
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Single top-level link (Dashboard) */
  href?: string;
};

export const navGroups: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: athenaIcons.dashboard,
    href: '/app',
    items: [],
  },
  {
    id: 'gestao',
    label: 'Gestão',
    icon: athenaIcons.students,
    items: [
      { href: '/app/alunos', label: 'Alunos', icon: athenaIcons.student, keywords: ['aluno', 'cliente'] },
      {
        href: '/app/alunos/matricula',
        label: 'Matrícula rápida',
        icon: athenaIcons.subscriptions,
        keywords: ['matricula', 'wizard', 'recepção'],
      },
      {
        href: '/app/sales/enrollments',
        label: 'Matrículas',
        icon: athenaIcons.subscriptions,
        keywords: ['matricula', 'plano'],
      },
      { href: '/app/sales', label: 'Comercial', icon: athenaIcons.sales, keywords: ['venda', 'lead', 'crm'] },
      { href: '/app/trainers', label: 'Professores', icon: athenaIcons.trainer, keywords: ['trainer', 'personal'] },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: athenaIcons.finance,
    items: [
      { href: '/app/finance/cashflow', label: 'Caixa', icon: athenaIcons.cash, keywords: ['caixa', 'fluxo'] },
      {
        href: '/app/finance/receivables',
        label: 'Receitas',
        icon: athenaIcons.receivables,
        keywords: ['receber', 'receita'],
      },
      {
        href: '/app/finance/payables',
        label: 'Despesas',
        icon: athenaIcons.payables,
        keywords: ['pagar', 'despesa'],
      },
      {
        href: '/app/finance/subscriptions',
        label: 'Mensalidades',
        icon: athenaIcons.subscriptions,
        keywords: ['mensalidade', 'assinatura'],
      },
      { href: '/app/finance', label: 'Visão geral', icon: athenaIcons.finance },
    ],
  },
  {
    id: 'academia',
    label: 'Academia',
    icon: athenaIcons.workouts,
    items: [
      { href: '/app/workouts', label: 'Treinos', icon: athenaIcons.workouts, keywords: ['treino', 'ficha'] },
      {
        href: '/app/workouts/assessments',
        label: 'Avaliações',
        icon: athenaIcons.assessments,
        keywords: ['avaliação', 'bio'],
      },
      { href: '/app/operations/agenda', label: 'Agenda', icon: athenaIcons.agenda, keywords: ['agenda', 'aula'] },
      {
        href: '/app/operations/checkin',
        label: 'Check-in',
        icon: athenaIcons.checkin,
        keywords: ['checkin', 'acesso'],
      },
      { href: '/app/operations', label: 'Operações', icon: athenaIcons.operations },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: athenaIcons.analytics,
    items: [
      { href: '/app/analytics', label: 'Dashboard', icon: athenaIcons.reports, keywords: ['bi', 'kpi'] },
      {
        href: '/app/analytics/executive',
        label: 'BI',
        icon: athenaIcons.bi,
        keywords: ['executivo', 'analytics'],
      },
      {
        href: '/app/analytics/reports',
        label: 'Exportações',
        icon: athenaIcons.exports,
        keywords: ['export', 'csv'],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administração',
    icon: athenaIcons.admin,
    items: [
      { href: '/app/users', label: 'Usuários', icon: athenaIcons.users },
      { href: '/app/roles', label: 'Cargos', icon: athenaIcons.roles },
      { href: '/app/settings', label: 'Configurações', icon: athenaIcons.settings, keywords: ['config', 'academia'] },
      { href: '/app/admin/logs', label: 'Auditoria', icon: athenaIcons.audit },
      { href: '/app/admin/logs', label: 'Logs', icon: athenaIcons.logs },
      { href: '/app/admin/health', label: 'Saúde', icon: athenaIcons.health },
      { href: '/app/engagement', label: 'Engajamento', icon: athenaIcons.engagement },
      { href: '/app/help', label: 'Ajuda', icon: athenaIcons.help },
    ],
  },
];

/** Flat list for command palette / search shortcuts */
export function flattenNavItems(): NavItem[] {
  const items: NavItem[] = [];
  for (const g of navGroups) {
    if (g.href) {
      items.push({ href: g.href, label: g.label, icon: g.icon });
    }
    items.push(...g.items);
  }
  // dedupe by href+label
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = `${i.href}:${i.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isNavActive(pathname: string, href: string) {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findActiveGroup(pathname: string): string | null {
  for (const g of navGroups) {
    if (g.href && isNavActive(pathname, g.href)) return g.id;
    if (g.items.some((i) => isNavActive(pathname, i.href))) return g.id;
  }
  return null;
}

/** Build breadcrumb trail from pathname */
const groupHub: Record<string, string> = {
  gestao: '/app/alunos',
  financeiro: '/app/finance',
  academia: '/app/workouts',
  relatorios: '/app/analytics',
  admin: '/app/settings',
};

export function breadcrumbForPath(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [{ label: 'Dashboard', href: '/app' }];
  if (pathname === '/app') return crumbs;

  for (const g of navGroups) {
    if (g.href && g.href !== '/app' && isNavActive(pathname, g.href)) {
      crumbs.push({ label: g.label });
      return crumbs;
    }
    // Prefer longest matching href to avoid /app/finance matching /app/finance/receivables incorrectly as leaf only
    const matches = g.items
      .filter((i) => isNavActive(pathname, i.href))
      .sort((a, b) => b.href.length - a.href.length);
    const leaf = matches[0];
    if (leaf) {
      const hub = groupHub[g.id];
      crumbs.push({ label: g.label, href: hub && hub !== leaf.href ? hub : undefined });
      if (leaf.label !== g.label) {
        crumbs.push({ label: leaf.label });
      }
      return crumbs;
    }
  }

  const segments = pathname.replace(/^\/app\/?/, '').split('/').filter(Boolean);
  for (let i = 0; i < segments.length; i++) {
    const href = `/app/${segments.slice(0, i + 1).join('/')}`;
    const label = segments[i].replace(/-/g, ' ');
    crumbs.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      href: i < segments.length - 1 ? href : undefined,
    });
  }
  return crumbs;
}

export const APP_VERSION = '1.0.0';
