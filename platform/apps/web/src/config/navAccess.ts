import { movvoIcons } from '@movvo/ui';
import type { NavGroup, NavItem } from './navigation';
import { navGroups } from './navigation';

const STAFF_ROLES = new Set([
  'super_admin',
  'admin',
  'manager',
  'reception',
  'finance',
  'trainer',
  'personal',
]);

export function isStudentOnly(roles: string[] | undefined | null): boolean {
  if (!roles?.length) return false;
  if (!roles.includes('student')) return false;
  return !roles.some((r) => STAFF_ROLES.has(r));
}

/** Trainer/personal without management roles — limited Relatórios surface. */
export function isProfessorOnly(roles: string[] | undefined | null): boolean {
  if (!roles?.length) return false;
  const hasCoach = roles.includes('trainer') || roles.includes('personal');
  if (!hasCoach) return false;
  return !roles.some((r) =>
    ['super_admin', 'admin', 'manager', 'finance', 'reception'].includes(r),
  );
}

const PROFESSOR_BI_ALLOWED = new Set(['/app/bi/relatorios']);

/** Basic student surface — no finance, reports, or administration. */
export const studentNavGroups: NavGroup[] = [
  {
    id: 'portal',
    label: 'Início',
    icon: movvoIcons.dashboard,
    href: '/app/portal',
    items: [],
  },
  {
    id: 'meu-treino',
    label: 'Meu treino',
    icon: movvoIcons.workouts,
    items: [
      {
        href: '/app/portal/treinos',
        label: 'Treinos',
        icon: movvoIcons.workouts,
        keywords: ['treino', 'ficha'],
      },
      {
        href: '/app/portal/evolucao',
        label: 'Minha evolução',
        icon: movvoIcons.assessments,
        keywords: ['evolução', 'avaliação'],
      },
      {
        href: '/app/portal/agenda',
        label: 'Minha agenda',
        icon: movvoIcons.agenda,
        keywords: ['agenda', 'aula', 'reserva'],
      },
    ],
  },
  {
    id: 'comunidade',
    label: 'Comunidade',
    icon: movvoIcons.engagement,
    items: [
      {
        href: '/app/portal/indicacao',
        label: 'Indicar amigo',
        icon: movvoIcons.users,
        keywords: ['indicação', 'amigo', 'referral'],
      },
      {
        href: '/app/portal/nps',
        label: 'Avaliar academia',
        icon: movvoIcons.assessments,
        keywords: ['nps', 'avaliação', 'satisfação'],
      },
    ],
  },
  {
    id: 'conta',
    label: 'Conta',
    icon: movvoIcons.users,
    items: [
      {
        href: '/app/profile',
        label: 'Meu perfil',
        icon: movvoIcons.student,
        keywords: ['perfil', 'conta'],
      },
      {
        href: '/app/help',
        label: 'Ajuda',
        icon: movvoIcons.help,
        keywords: ['ajuda', 'faq'],
      },
    ],
  },
];

export type NavAuth = {
  roles: string[];
  permissions: string[];
  isSuperAdmin?: boolean;
};

function canSeeItem(item: NavItem & { anyOfPermissions?: string[] }, auth: NavAuth): boolean {
  if (auth.isSuperAdmin) return true;
  const required = item.anyOfPermissions;
  if (!required?.length) return true;
  const set = new Set(auth.permissions);
  return required.some((p) => set.has(p));
}

function canSeeGroup(group: NavGroup & { anyOfPermissions?: string[] }, auth: NavAuth): boolean {
  if (auth.isSuperAdmin) return true;
  const required = group.anyOfPermissions;
  if (!required?.length) return true;
  const set = new Set(auth.permissions);
  return required.some((p) => set.has(p));
}

/** Staff nav annotated with permission gates (student uses studentNavGroups). */
export const staffNavGroups: NavGroup[] = navGroups.map((g) => {
  if (g.id === 'financeiro') {
    return {
      ...g,
      anyOfPermissions: ['finance.read'],
      items: g.items.map((i) => ({ ...i, anyOfPermissions: ['finance.read'] })),
    };
  }
  if (g.id === 'relatorios') {
    return {
      ...g,
      anyOfPermissions: ['analytics.read', 'finance.reports', 'reports.export', 'finance.export'],
      items: g.items.map((i) => {
        if (i.href === '/app/bi/relatorios') {
          return {
            ...i,
            anyOfPermissions: ['reports.export', 'finance.export', 'analytics.read'],
          };
        }
        return {
          ...i,
          anyOfPermissions: ['analytics.read', 'finance.reports', 'executive.read'],
        };
      }),
    };
  }
  if (g.id === 'estoque') {
    return {
      ...g,
      anyOfPermissions: ['inventory.read', 'pdv.sell', 'purchases.read'],
      items: g.items.map((i) => {
        if (i.href === '/app/estoque/pdv') {
          return { ...i, anyOfPermissions: ['pdv.sell'] };
        }
        if (i.href.startsWith('/app/estoque/compras') || i.href.startsWith('/app/estoque/fornecedores')) {
          return { ...i, anyOfPermissions: ['purchases.read', 'purchases.manage', 'inventory.read'] };
        }
        if (i.href.startsWith('/app/estoque/inventario')) {
          return { ...i, anyOfPermissions: ['inventory.adjust', 'inventory.manage', 'inventory.read'] };
        }
        return { ...i, anyOfPermissions: ['inventory.read', 'inventory.manage', 'pdv.sell'] };
      }),
    };
  }
  if (g.id === 'platform') {
    return {
      ...g,
      anyOfPermissions: ['saas.read', 'saas.manage', 'platform.read', 'platform.manage'],
      items: g.items.map((i) => ({
        ...i,
        anyOfPermissions: i.anyOfPermissions?.length
          ? i.anyOfPermissions
          : ['saas.read', 'platform.read'],
      })),
    };
  }
  if (g.id === 'admin') {
    return {
      ...g,
      items: g.items.map((i) => {
        if (i.href.startsWith('/app/users')) return { ...i, anyOfPermissions: ['users.read'] };
        if (i.href.startsWith('/app/roles') || i.href === '/app/admin/cargos') {
          return { ...i, anyOfPermissions: i.anyOfPermissions || ['roles.read', 'admin.write'] };
        }
        if (i.href.startsWith('/app/settings') && !i.href.startsWith('/app/admin')) {
          return { ...i, anyOfPermissions: ['settings.read'] };
        }
        if (i.href === '/app/admin/logs' || i.href === '/app/admin/health') {
          return { ...i, anyOfPermissions: ['audit.read'] };
        }
        if (i.href.startsWith('/app/admin')) {
          return {
            ...i,
            anyOfPermissions: i.anyOfPermissions?.length
              ? i.anyOfPermissions
              : ['admin.read', 'admin.write'],
          };
        }
        if (i.href.startsWith('/app/commercial')) return { ...i, anyOfPermissions: ['audit.read', 'settings.update'] };
        if (i.href.startsWith('/app/help')) return i;
        if (i.href.startsWith('/app/engagement')) return { ...i, anyOfPermissions: ['dashboard.read'] };
        return { ...i, anyOfPermissions: ['users.read', 'settings.read', 'roles.read'] };
      }),
    };
  }
  if (g.id === 'gestao') {
    return {
      ...g,
      items: g.items.map((i) => {
        if (i.href.startsWith('/app/alunos')) return { ...i, anyOfPermissions: ['students.read'] };
        if (
          i.href.startsWith('/app/matriculas') ||
          i.href.startsWith('/app/sales') ||
          i.href.startsWith('/app/crm')
        ) {
          return {
            ...i,
            anyOfPermissions: [
              'sales.read',
              'campaigns.read',
              'engagement.read',
              'students.create',
              'students.update',
            ],
          };
        }
        if (i.href.startsWith('/app/trainers')) return { ...i, anyOfPermissions: ['users.read'] };
        return i;
      }),
    };
  }
  if (g.id === 'academia') {
    return {
      ...g,
      items: g.items.map((i) => {
        if (i.href.startsWith('/app/treinos')) return { ...i, anyOfPermissions: ['workouts.read'] };
        if (i.href.startsWith('/app/acesso') || i.href.startsWith('/app/operations') || i.href.startsWith('/app/agenda')) {
          return { ...i, anyOfPermissions: ['operations.read', 'operations.checkin'] };
        }
        if (i.href.startsWith('/app/integracoes')) {
          return { ...i, anyOfPermissions: ['operations.configure', 'settings.update'] };
        }
        return i;
      }),
    };
  }
  return g;
}) as NavGroup[];

export function filterNavGroups(auth: NavAuth): NavGroup[] {
  if (isStudentOnly(auth.roles)) return studentNavGroups;
  const professorOnly = isProfessorOnly(auth.roles);

  return staffNavGroups
    .map((group) => {
      if (!canSeeGroup(group as NavGroup & { anyOfPermissions?: string[] }, auth)) {
        return null;
      }
      let items = group.items.filter((item) =>
        canSeeItem(item as NavItem & { anyOfPermissions?: string[] }, auth),
      );
      if (professorOnly && group.id === 'relatorios') {
        items = items.filter((item) => PROFESSOR_BI_ALLOWED.has(item.href));
      }
      if (!group.href && items.length === 0) return null;
      return { ...group, items };
    })
    .filter(Boolean) as NavGroup[];
}

export function flattenFilteredNav(auth: NavAuth): NavItem[] {
  const items: NavItem[] = [];
  for (const g of filterNavGroups(auth)) {
    if (g.href) items.push({ href: g.href, label: g.label, icon: g.icon });
    items.push(...g.items);
  }
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = `${i.href}:${i.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Hide commercial modules when feature flags are off. */
export function applyFeatureFlagsToNav(
  groups: NavGroup[],
  flags: {
    inventory?: boolean;
    crm?: boolean;
    bi?: boolean;
    pdv?: boolean;
    marketplace?: boolean;
  },
): NavGroup[] {
  return groups
    .map((group) => {
      if (group.id === 'estoque' && flags.inventory === false) return null;
      if (group.id === 'relatorios' && flags.bi === false) return null;

      let items = group.items;
      if (flags.pdv === false) {
        items = items.filter((i) => i.href !== '/app/estoque/pdv');
      }
      if (flags.crm === false) {
        items = items.filter((i) => !i.href.startsWith('/app/crm') && !i.href.startsWith('/app/sales'));
      }
      if (flags.marketplace === false) {
        items = items.filter(
          (i) => !i.href.startsWith('/app/marketplace') && !i.href.startsWith('/app/developers'),
        );
      }
      if (!group.href && items.length === 0) return null;
      return { ...group, items };
    })
    .filter(Boolean) as NavGroup[];
}

/** Paths blocked for student-only accounts. */
export function isStudentBlockedPath(pathname: string): boolean {
  const blockedPrefixes = [
    '/app/financeiro',
    '/app/finance',
    '/app/analytics',
    '/app/bi',
    '/app/users',
    '/app/roles',
    '/app/settings',
    '/app/platform',
    '/app/admin',
    '/app/commercial',
    '/app/alunos',
    '/app/matriculas',
    '/app/sales',
    '/app/crm',
    '/app/trainers',
    '/app/acesso',
    '/app/integracoes',
    '/app/operations',
    '/app/treinos',
    '/app/engagement',
    '/app/marketplace',
    '/app/developers',
    '/app/estoque',
  ];
  if (pathname === '/app' || pathname === '/app/') return true; // redirect home → portal
  return blockedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** BI dashboards blocked for professor — only Exportações (/app/bi/relatorios). */
export function isProfessorBlockedPath(pathname: string): boolean {
  if (PROFESSOR_BI_ALLOWED.has(pathname)) return false;
  if (pathname === '/app/analytics' || pathname.startsWith('/app/analytics/')) return true;
  if (pathname === '/app/bi' || pathname.startsWith('/app/bi/')) return true;
  return false;
}
