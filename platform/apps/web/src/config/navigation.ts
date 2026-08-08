import { movvoIcons, type MovvoIconName } from '@movvo/ui';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  iconName?: MovvoIconName;
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
    icon: movvoIcons.dashboard,
    href: '/app',
    items: [],
  },
  {
    id: 'gestao',
    label: 'Gestão',
    icon: movvoIcons.students,
    items: [
      { href: '/app/alunos', label: 'Alunos', icon: movvoIcons.student, keywords: ['aluno', 'cliente'] },
      {
        href: '/app/matriculas/nova',
        label: 'Matrícula rápida',
        icon: movvoIcons.subscriptions,
        keywords: ['matricula', 'wizard', 'recepção'],
      },
      {
        href: '/app/matriculas',
        label: 'Matrículas',
        icon: movvoIcons.subscriptions,
        keywords: ['matricula', 'plano', 'contrato', 'renovação'],
      },
      {
        href: '/app/matriculas/planos',
        label: 'Planos',
        icon: movvoIcons.subscriptions,
        keywords: ['plano', 'mensalidade'],
      },
      { href: '/app/crm', label: 'Comercial', icon: movvoIcons.sales, keywords: ['venda', 'lead', 'crm', 'campanha', 'fidelidade', 'nps'] },
      { href: '/app/trainers', label: 'Professores', icon: movvoIcons.trainer, keywords: ['trainer', 'personal'] },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: movvoIcons.finance,
    items: [
      { href: '/app/financeiro/caixa', label: 'Caixa', icon: movvoIcons.cash, keywords: ['caixa', 'sessão'] },
      {
        href: '/app/financeiro/receber',
        label: 'Receitas',
        icon: movvoIcons.receivables,
        keywords: ['receber', 'receita'],
      },
      {
        href: '/app/financeiro/pagar',
        label: 'Despesas',
        icon: movvoIcons.payables,
        keywords: ['pagar', 'despesa'],
      },
      {
        href: '/app/financeiro/mensalidades',
        label: 'Mensalidades',
        icon: movvoIcons.subscriptions,
        keywords: ['mensalidade', 'assinatura'],
      },
      {
        href: '/app/financeiro/fluxo-caixa',
        label: 'Fluxo de caixa',
        icon: movvoIcons.cash,
        keywords: ['fluxo', 'cashflow'],
      },
      {
        href: '/app/financeiro/inadimplencia',
        label: 'Inadimplência',
        icon: movvoIcons.receivables,
        keywords: ['inadimplencia', 'atraso'],
      },
      { href: '/app/financeiro', label: 'Visão geral', icon: movvoIcons.finance },
    ],
  },
  {
    id: 'academia',
    label: 'Academia',
    icon: movvoIcons.workouts,
    items: [
      { href: '/app/treinos', label: 'Treinos', icon: movvoIcons.workouts, keywords: ['treino', 'ficha', 'pt'] },
      {
        href: '/app/treinos/avaliacoes',
        label: 'Avaliações',
        icon: movvoIcons.assessments,
        keywords: ['avaliação', 'bio'],
      },
      {
        href: '/app/treinos/professor',
        label: 'Professor',
        icon: movvoIcons.trainer,
        keywords: ['coach', 'agenda', 'pt'],
      },
      {
        href: '/app/acesso/checkin',
        label: 'Check-in',
        icon: movvoIcons.checkin,
        keywords: ['checkin', 'acesso', 'cpf'],
      },
      {
        href: '/app/acesso/presenca',
        label: 'Presença',
        icon: movvoIcons.operations,
        keywords: ['presença', 'ocupação'],
      },
      {
        href: '/app/acesso',
        label: 'Acesso',
        icon: movvoIcons.operations,
        keywords: ['catraca', 'monitor', 'regras'],
      },
      {
        href: '/app/integracoes',
        label: 'Integrações',
        icon: movvoIcons.settings,
        keywords: ['wellhub', 'totalpass', 'parceiro'],
      },
      { href: '/app/acesso/agenda', label: 'Timeline', icon: movvoIcons.agenda, keywords: ['timeline', 'checkin'] },
      { href: '/app/agenda', label: 'Agenda aulas', icon: movvoIcons.agenda, keywords: ['agenda', 'aula'] },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque / Loja',
    icon: movvoIcons.inventory,
    items: [
      { href: '/app/estoque', label: 'Dashboard', icon: movvoIcons.store, keywords: ['estoque', 'loja'] },
      { href: '/app/estoque/produtos', label: 'Produtos', icon: movvoIcons.inventory, keywords: ['sku', 'produto'] },
      { href: '/app/estoque/movimentacoes', label: 'Movimentações', icon: movvoIcons.payables, keywords: ['entrada', 'saída'] },
      { href: '/app/estoque/pdv', label: 'PDV', icon: movvoIcons.pdv, keywords: ['venda', 'caixa'] },
      { href: '/app/estoque/fornecedores', label: 'Fornecedores', icon: movvoIcons.users, keywords: ['supplier'] },
      { href: '/app/estoque/compras', label: 'Compras', icon: movvoIcons.subscriptions, keywords: ['pedido'] },
      { href: '/app/estoque/inventario', label: 'Inventário', icon: movvoIcons.assessments, keywords: ['contagem'] },
      { href: '/app/estoque/alertas', label: 'Alertas', icon: movvoIcons.health, keywords: ['mínimo'] },
      { href: '/app/estoque/relatorios', label: 'Relatórios', icon: movvoIcons.exports, keywords: ['csv'] },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: movvoIcons.analytics,
    items: [
      { href: '/app/bi', label: 'Dashboard', icon: movvoIcons.reports, keywords: ['bi', 'kpi'] },
      {
        href: '/app/bi/executivo',
        label: 'Executivo',
        icon: movvoIcons.bi,
        keywords: ['executivo', 'analytics'],
      },
      {
        href: '/app/bi/kpis',
        label: 'KPIs',
        icon: movvoIcons.reports,
        keywords: ['indicadores', 'kpi'],
      },
      {
        href: '/app/bi/insights',
        label: 'Insights',
        icon: movvoIcons.bi,
        keywords: ['ia', 'recomendações'],
      },
      {
        href: '/app/bi/previsoes',
        label: 'Previsões',
        icon: movvoIcons.bi,
        keywords: ['forecast', 'previsão'],
      },
      {
        href: '/app/bi/relatorios',
        label: 'Exportações',
        icon: movvoIcons.exports,
        keywords: ['export', 'csv'],
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform SaaS',
    icon: movvoIcons.admin,
    items: [
      { href: '/app/platform/dashboard', label: 'Dashboard SaaS', icon: movvoIcons.dashboard, keywords: ['mrr', 'churn'], anyOfPermissions: ['saas.read'] },
      { href: '/app/platform/tenants', label: 'Tenants', icon: movvoIcons.store, keywords: ['empresa', 'cliente'], anyOfPermissions: ['saas.manage', 'saas.read'] },
      { href: '/app/platform/plans', label: 'Planos SaaS', icon: movvoIcons.subscriptions, anyOfPermissions: ['saas.read'] },
      { href: '/app/platform/billing', label: 'Billing SaaS', icon: movvoIcons.finance, anyOfPermissions: ['saas.billing', 'saas.read'] },
      { href: '/app/platform/licenses', label: 'Licenças', icon: movvoIcons.roles, anyOfPermissions: ['saas.read'] },
      { href: '/app/platform/feature-flags', label: 'Feature flags', icon: movvoIcons.settings, anyOfPermissions: ['saas.manage'] },
      { href: '/app/platform/portal', label: 'Portal do cliente', icon: movvoIcons.profile, anyOfPermissions: ['saas.billing', 'platform.read'] },
      { href: '/app/platform/api-keys', label: 'API Keys', icon: movvoIcons.roles, anyOfPermissions: ['platform.manage', 'platform.read'] },
      { href: '/app/platform/webhooks', label: 'Webhooks', icon: movvoIcons.engagement, anyOfPermissions: ['platform.webhooks'] },
      { href: '/app/platform/marketplace', label: 'Marketplace SaaS', icon: movvoIcons.store, anyOfPermissions: ['marketplace.read'] },
      { href: '/app/platform/environments', label: 'Ambientes', icon: movvoIcons.settings, anyOfPermissions: ['saas.read'] },
      { href: '/app/platform/reports', label: 'Relatórios SaaS', icon: movvoIcons.exports, anyOfPermissions: ['saas.reports'] },
      {
        href: '/app/platform/observability',
        label: 'Observabilidade',
        icon: movvoIcons.health,
        keywords: ['health', 'redis', 'métricas', 'filas', 'devops'],
        anyOfPermissions: ['observability.read', 'platform.manage', 'saas.read'],
      },
      { href: '/app/developers', label: 'Developers', icon: movvoIcons.help, anyOfPermissions: ['platform.read'] },
      { href: '/app/marketplace', label: 'Marketplace', icon: movvoIcons.store, anyOfPermissions: ['marketplace.read'] },
    ],
  },
  {
    id: 'security',
    label: 'Segurança',
    icon: movvoIcons.admin,
    items: [
      {
        href: '/app/security/dashboard',
        label: 'Dashboard segurança',
        icon: movvoIcons.dashboard,
        keywords: ['mfa', 'lgpd', 'compliance'],
        anyOfPermissions: ['security.read', 'audit.read'],
      },
      {
        href: '/app/security/sessions',
        label: 'Sessões e MFA',
        icon: movvoIcons.profile,
        keywords: ['sessão', 'dispositivo', 'mfa', 'otp'],
      },
      {
        href: '/app/security/audit',
        label: 'Auditoria',
        icon: movvoIcons.exports,
        keywords: ['logs', 'audit'],
        anyOfPermissions: ['audit.read', 'security.read'],
      },
      {
        href: '/app/security/lgpd',
        label: 'LGPD',
        icon: movvoIcons.users,
        keywords: ['privacidade', 'exportar', 'anonimizar'],
        anyOfPermissions: ['lgpd.manage', 'lgpd.read'],
      },
      {
        href: '/app/security/retention',
        label: 'Retenção',
        icon: movvoIcons.settings,
        keywords: ['retenção', 'purge'],
        anyOfPermissions: ['security.write', 'security.read'],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administração',
    icon: movvoIcons.admin,
    items: [
      {
        href: '/app/admin/dashboard',
        label: 'Dashboard admin',
        icon: movvoIcons.dashboard,
        keywords: ['kpi', 'backoffice'],
        anyOfPermissions: ['admin.read'],
      },
      {
        href: '/app/admin/colaboradores',
        label: 'Colaboradores',
        icon: movvoIcons.users,
        keywords: ['rh', 'funcionário', 'employee'],
        anyOfPermissions: ['admin.employees', 'admin.read'],
      },
      {
        href: '/app/admin/cargos',
        label: 'Cargos',
        icon: movvoIcons.roles,
        keywords: ['rbac', 'permissões'],
        anyOfPermissions: ['roles.read', 'admin.write'],
      },
      {
        href: '/app/admin/escalas',
        label: 'Escalas',
        icon: movvoIcons.agenda,
        keywords: ['turno', 'folga'],
        anyOfPermissions: ['admin.employees', 'admin.read'],
      },
      {
        href: '/app/admin/patrimonio',
        label: 'Patrimônio',
        icon: movvoIcons.inventory,
        keywords: ['ativo', 'equipamento'],
        anyOfPermissions: ['admin.assets', 'admin.read'],
      },
      {
        href: '/app/admin/manutencoes',
        label: 'Manutenções',
        icon: movvoIcons.settings,
        keywords: ['os', 'preventiva'],
        anyOfPermissions: ['admin.maintenance', 'admin.read'],
      },
      {
        href: '/app/admin/documentos',
        label: 'Documentos',
        icon: movvoIcons.spreadsheet,
        keywords: ['vencimento', 'alvará'],
        anyOfPermissions: ['admin.documents', 'admin.read'],
      },
      {
        href: '/app/admin/ocorrencias',
        label: 'Ocorrências',
        icon: movvoIcons.audit,
        keywords: ['incidente'],
        anyOfPermissions: ['admin.incidents', 'admin.read'],
      },
      {
        href: '/app/admin/comunicados',
        label: 'Comunicados',
        icon: movvoIcons.engagement,
        keywords: ['mural'],
        anyOfPermissions: ['admin.announcements', 'admin.read'],
      },
      {
        href: '/app/admin/calendario',
        label: 'Calendário admin',
        icon: movvoIcons.agenda,
        keywords: ['férias', 'calendário'],
        anyOfPermissions: ['admin.read'],
      },
      {
        href: '/app/admin/centros-custo',
        label: 'Centros de custo',
        icon: movvoIcons.finance,
        keywords: ['custo', 'categoria'],
        anyOfPermissions: ['admin.write', 'finance.read'],
      },
      {
        href: '/app/admin/config',
        label: 'Config admin',
        icon: movvoIcons.settings,
        keywords: ['departamento', 'cargo hr'],
        anyOfPermissions: ['admin.write', 'admin.read'],
      },
      {
        href: '/app/admin/relatorios',
        label: 'Relatórios admin',
        icon: movvoIcons.exports,
        keywords: ['csv', 'pdf'],
        anyOfPermissions: ['admin.reports', 'admin.read'],
      },
      { href: '/app/users', label: 'Usuários', icon: movvoIcons.users },
      { href: '/app/settings', label: 'Configurações', icon: movvoIcons.settings, keywords: ['config', 'academia'] },
      { href: '/app/admin/logs', label: 'Auditoria', icon: movvoIcons.audit },
      { href: '/app/admin/health', label: 'Saúde', icon: movvoIcons.health },
      { href: '/app/commercial', label: 'CRM Movvo', icon: movvoIcons.sales, keywords: ['lead', 'demo', 'comercial plataforma'] },
      { href: '/app/commercial/analytics', label: 'Analytics comercial', icon: movvoIcons.dashboard, keywords: ['funil', 'leads'] },
      { href: '/app/commercial/onboarding', label: 'Onboarding comercial', icon: movvoIcons.help },
      { href: '/app/engagement', label: 'Engajamento', icon: movvoIcons.engagement },
      { href: '/app/help', label: 'Ajuda', icon: movvoIcons.help },
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
