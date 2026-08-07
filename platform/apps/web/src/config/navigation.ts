import { athenaIcons, type AthenaIconName } from '@athena/ui';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  iconName?: AthenaIconName;
  keywords?: string[];
  /** User needs at least one of these permissions (staff nav). */
  anyOfPermissions?: string[];
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Single top-level link (Dashboard) */
  href?: string;
  anyOfPermissions?: string[];
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
        href: '/app/matriculas/nova',
        label: 'Matrícula rápida',
        icon: athenaIcons.subscriptions,
        keywords: ['matricula', 'wizard', 'recepção'],
      },
      {
        href: '/app/matriculas',
        label: 'Matrículas',
        icon: athenaIcons.subscriptions,
        keywords: ['matricula', 'plano', 'contrato', 'renovação'],
      },
      {
        href: '/app/matriculas/planos',
        label: 'Planos',
        icon: athenaIcons.subscriptions,
        keywords: ['plano', 'mensalidade'],
      },
      { href: '/app/crm', label: 'Comercial', icon: athenaIcons.sales, keywords: ['venda', 'lead', 'crm', 'campanha', 'fidelidade', 'nps'] },
      { href: '/app/trainers', label: 'Professores', icon: athenaIcons.trainer, keywords: ['trainer', 'personal'] },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: athenaIcons.finance,
    items: [
      { href: '/app/financeiro/caixa', label: 'Caixa', icon: athenaIcons.cash, keywords: ['caixa', 'sessão'] },
      {
        href: '/app/financeiro/receber',
        label: 'Receitas',
        icon: athenaIcons.receivables,
        keywords: ['receber', 'receita'],
      },
      {
        href: '/app/financeiro/pagar',
        label: 'Despesas',
        icon: athenaIcons.payables,
        keywords: ['pagar', 'despesa'],
      },
      {
        href: '/app/financeiro/mensalidades',
        label: 'Mensalidades',
        icon: athenaIcons.subscriptions,
        keywords: ['mensalidade', 'assinatura'],
      },
      {
        href: '/app/financeiro/fluxo-caixa',
        label: 'Fluxo de caixa',
        icon: athenaIcons.cash,
        keywords: ['fluxo', 'cashflow'],
      },
      {
        href: '/app/financeiro/inadimplencia',
        label: 'Inadimplência',
        icon: athenaIcons.receivables,
        keywords: ['inadimplencia', 'atraso'],
      },
      { href: '/app/financeiro', label: 'Visão geral', icon: athenaIcons.finance },
    ],
  },
  {
    id: 'academia',
    label: 'Academia',
    icon: athenaIcons.workouts,
    items: [
      { href: '/app/treinos', label: 'Treinos', icon: athenaIcons.workouts, keywords: ['treino', 'ficha', 'pt'] },
      {
        href: '/app/treinos/avaliacoes',
        label: 'Avaliações',
        icon: athenaIcons.assessments,
        keywords: ['avaliação', 'bio'],
      },
      {
        href: '/app/treinos/professor',
        label: 'Professor',
        icon: athenaIcons.trainer,
        keywords: ['coach', 'agenda', 'pt'],
      },
      {
        href: '/app/acesso/checkin',
        label: 'Check-in',
        icon: athenaIcons.checkin,
        keywords: ['checkin', 'acesso', 'cpf'],
      },
      {
        href: '/app/acesso/presenca',
        label: 'Presença',
        icon: athenaIcons.operations,
        keywords: ['presença', 'ocupação'],
      },
      {
        href: '/app/acesso',
        label: 'Acesso',
        icon: athenaIcons.operations,
        keywords: ['catraca', 'monitor', 'regras'],
      },
      {
        href: '/app/integracoes',
        label: 'Integrações',
        icon: athenaIcons.settings,
        keywords: ['wellhub', 'totalpass', 'parceiro'],
      },
      { href: '/app/acesso/agenda', label: 'Timeline', icon: athenaIcons.agenda, keywords: ['timeline', 'checkin'] },
      { href: '/app/agenda', label: 'Agenda aulas', icon: athenaIcons.agenda, keywords: ['agenda', 'aula'] },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque / Loja',
    icon: athenaIcons.inventory,
    items: [
      { href: '/app/estoque', label: 'Dashboard', icon: athenaIcons.store, keywords: ['estoque', 'loja'] },
      { href: '/app/estoque/produtos', label: 'Produtos', icon: athenaIcons.inventory, keywords: ['sku', 'produto'] },
      { href: '/app/estoque/movimentacoes', label: 'Movimentações', icon: athenaIcons.payables, keywords: ['entrada', 'saída'] },
      { href: '/app/estoque/pdv', label: 'PDV', icon: athenaIcons.pdv, keywords: ['venda', 'caixa'] },
      { href: '/app/estoque/fornecedores', label: 'Fornecedores', icon: athenaIcons.users, keywords: ['supplier'] },
      { href: '/app/estoque/compras', label: 'Compras', icon: athenaIcons.subscriptions, keywords: ['pedido'] },
      { href: '/app/estoque/inventario', label: 'Inventário', icon: athenaIcons.assessments, keywords: ['contagem'] },
      { href: '/app/estoque/alertas', label: 'Alertas', icon: athenaIcons.health, keywords: ['mínimo'] },
      { href: '/app/estoque/relatorios', label: 'Relatórios', icon: athenaIcons.exports, keywords: ['csv'] },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: athenaIcons.analytics,
    items: [
      { href: '/app/bi', label: 'Dashboard', icon: athenaIcons.reports, keywords: ['bi', 'kpi'] },
      {
        href: '/app/bi/executivo',
        label: 'Executivo',
        icon: athenaIcons.bi,
        keywords: ['executivo', 'analytics'],
      },
      {
        href: '/app/bi/kpis',
        label: 'KPIs',
        icon: athenaIcons.reports,
        keywords: ['indicadores', 'kpi'],
      },
      {
        href: '/app/bi/insights',
        label: 'Insights',
        icon: athenaIcons.bi,
        keywords: ['ia', 'recomendações'],
      },
      {
        href: '/app/bi/previsoes',
        label: 'Previsões',
        icon: athenaIcons.bi,
        keywords: ['forecast', 'previsão'],
      },
      {
        href: '/app/bi/relatorios',
        label: 'Exportações',
        icon: athenaIcons.exports,
        keywords: ['export', 'csv'],
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform SaaS',
    icon: athenaIcons.admin,
    items: [
      { href: '/app/platform/dashboard', label: 'Dashboard SaaS', icon: athenaIcons.dashboard, keywords: ['mrr', 'churn'], anyOfPermissions: ['saas.read'] },
      { href: '/app/platform/tenants', label: 'Tenants', icon: athenaIcons.store, keywords: ['empresa', 'cliente'], anyOfPermissions: ['saas.manage', 'saas.read'] },
      { href: '/app/platform/plans', label: 'Planos SaaS', icon: athenaIcons.subscriptions, anyOfPermissions: ['saas.read'] },
      { href: '/app/platform/billing', label: 'Billing SaaS', icon: athenaIcons.finance, anyOfPermissions: ['saas.billing', 'saas.read'] },
      { href: '/app/platform/licenses', label: 'Licenças', icon: athenaIcons.roles, anyOfPermissions: ['saas.read'] },
      { href: '/app/platform/feature-flags', label: 'Feature flags', icon: athenaIcons.settings, anyOfPermissions: ['saas.manage'] },
      { href: '/app/platform/portal', label: 'Portal do cliente', icon: athenaIcons.profile, anyOfPermissions: ['saas.billing', 'platform.read'] },
      { href: '/app/platform/api-keys', label: 'API Keys', icon: athenaIcons.roles, anyOfPermissions: ['platform.manage', 'platform.read'] },
      { href: '/app/platform/webhooks', label: 'Webhooks', icon: athenaIcons.engagement, anyOfPermissions: ['platform.webhooks'] },
      { href: '/app/platform/marketplace', label: 'Marketplace SaaS', icon: athenaIcons.store, anyOfPermissions: ['marketplace.read'] },
      { href: '/app/platform/environments', label: 'Ambientes', icon: athenaIcons.settings, anyOfPermissions: ['saas.read'] },
      { href: '/app/platform/reports', label: 'Relatórios SaaS', icon: athenaIcons.exports, anyOfPermissions: ['saas.reports'] },
      { href: '/app/developers', label: 'Developers', icon: athenaIcons.help, anyOfPermissions: ['platform.read'] },
      { href: '/app/marketplace', label: 'Marketplace', icon: athenaIcons.store, anyOfPermissions: ['marketplace.read'] },
    ],
  },
  {
    id: 'admin',
    label: 'Administração',
    icon: athenaIcons.admin,
    items: [
      {
        href: '/app/admin/dashboard',
        label: 'Dashboard admin',
        icon: athenaIcons.dashboard,
        keywords: ['kpi', 'backoffice'],
        anyOfPermissions: ['admin.read'],
      },
      {
        href: '/app/admin/colaboradores',
        label: 'Colaboradores',
        icon: athenaIcons.users,
        keywords: ['rh', 'funcionário', 'employee'],
        anyOfPermissions: ['admin.employees', 'admin.read'],
      },
      {
        href: '/app/admin/cargos',
        label: 'Cargos',
        icon: athenaIcons.roles,
        keywords: ['rbac', 'permissões'],
        anyOfPermissions: ['roles.read', 'admin.write'],
      },
      {
        href: '/app/admin/escalas',
        label: 'Escalas',
        icon: athenaIcons.agenda,
        keywords: ['turno', 'folga'],
        anyOfPermissions: ['admin.employees', 'admin.read'],
      },
      {
        href: '/app/admin/patrimonio',
        label: 'Patrimônio',
        icon: athenaIcons.inventory,
        keywords: ['ativo', 'equipamento'],
        anyOfPermissions: ['admin.assets', 'admin.read'],
      },
      {
        href: '/app/admin/manutencoes',
        label: 'Manutenções',
        icon: athenaIcons.settings,
        keywords: ['os', 'preventiva'],
        anyOfPermissions: ['admin.maintenance', 'admin.read'],
      },
      {
        href: '/app/admin/documentos',
        label: 'Documentos',
        icon: athenaIcons.spreadsheet,
        keywords: ['vencimento', 'alvará'],
        anyOfPermissions: ['admin.documents', 'admin.read'],
      },
      {
        href: '/app/admin/ocorrencias',
        label: 'Ocorrências',
        icon: athenaIcons.audit,
        keywords: ['incidente'],
        anyOfPermissions: ['admin.incidents', 'admin.read'],
      },
      {
        href: '/app/admin/comunicados',
        label: 'Comunicados',
        icon: athenaIcons.engagement,
        keywords: ['mural'],
        anyOfPermissions: ['admin.announcements', 'admin.read'],
      },
      {
        href: '/app/admin/calendario',
        label: 'Calendário admin',
        icon: athenaIcons.agenda,
        keywords: ['férias', 'calendário'],
        anyOfPermissions: ['admin.read'],
      },
      {
        href: '/app/admin/centros-custo',
        label: 'Centros de custo',
        icon: athenaIcons.finance,
        keywords: ['custo', 'categoria'],
        anyOfPermissions: ['admin.write', 'finance.read'],
      },
      {
        href: '/app/admin/config',
        label: 'Config admin',
        icon: athenaIcons.settings,
        keywords: ['departamento', 'cargo hr'],
        anyOfPermissions: ['admin.write', 'admin.read'],
      },
      {
        href: '/app/admin/relatorios',
        label: 'Relatórios admin',
        icon: athenaIcons.exports,
        keywords: ['csv', 'pdf'],
        anyOfPermissions: ['admin.reports', 'admin.read'],
      },
      { href: '/app/users', label: 'Usuários', icon: athenaIcons.users },
      { href: '/app/settings', label: 'Configurações', icon: athenaIcons.settings, keywords: ['config', 'academia'] },
      { href: '/app/admin/logs', label: 'Auditoria', icon: athenaIcons.audit },
      { href: '/app/admin/health', label: 'Saúde', icon: athenaIcons.health },
      { href: '/app/commercial', label: 'CRM Movvo', icon: athenaIcons.sales, keywords: ['lead', 'demo', 'comercial plataforma'] },
      { href: '/app/commercial/analytics', label: 'Analytics comercial', icon: athenaIcons.dashboard, keywords: ['funil', 'leads'] },
      { href: '/app/commercial/onboarding', label: 'Onboarding comercial', icon: athenaIcons.help },
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
  gestao: '/app/matriculas',
  financeiro: '/app/financeiro',
  academia: '/app/acesso',
  estoque: '/app/estoque',
  relatorios: '/app/bi',
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
    // Prefer longest matching href to avoid /app/financeiro matching sub-routes incorrectly as leaf only
    const matches = g.items
      .filter((i) => isNavActive(pathname, i.href))
      .sort((a, b) => b.href.length - a.href.length);
    const leaf = matches[0];
    if (leaf) {
      const hub = groupHub[g.id];
      if (hub && hub !== leaf.href) {
        crumbs.push({ label: g.label, href: hub });
        if (leaf.label !== g.label) {
          crumbs.push({ label: leaf.label });
        }
      } else {
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

export const APP_VERSION = '0.7.0-beta';
export const APP_BUILD_LABEL = '2026.08';
