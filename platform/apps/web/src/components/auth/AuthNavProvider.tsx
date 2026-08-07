'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { MeResponse } from '@movvo/shared';
import { apiGetMe } from '@/services/api';
import {
  applyFeatureFlagsToNav,
  filterNavGroups,
  flattenFilteredNav,
  isStudentOnly,
  type NavAuth,
} from '@/config/navAccess';
import type { NavGroup, NavItem } from '@/config/navigation';
import { useFeatureFlags } from '@/components/FeatureFlagsProvider';

type AuthNavValue = {
  loading: boolean;
  me: MeResponse | null;
  auth: NavAuth;
  studentOnly: boolean;
  groups: NavGroup[];
  flatItems: NavItem[];
};

const AuthNavContext = createContext<AuthNavValue | null>(null);

const EMPTY_AUTH: NavAuth = { roles: [], permissions: [], isSuperAdmin: false };

function flattenGroups(groups: NavGroup[]): NavItem[] {
  const items: NavItem[] = [];
  for (const g of groups) {
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

export function AuthNavProvider({
  accessToken,
  children,
}: {
  accessToken: string;
  children: React.ReactNode;
}) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { flags } = useFeatureFlags();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void apiGetMe(accessToken)
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const value = useMemo<AuthNavValue>(() => {
    const auth: NavAuth = me
      ? {
          roles: me.auth?.roles || me.roles?.map((r) => r.slug) || [],
          permissions: me.permissions || me.auth?.permissions || [],
          isSuperAdmin: Boolean(me.auth?.isSuperAdmin),
        }
      : EMPTY_AUTH;
    const baseGroups = filterNavGroups(auth);
    const groups = applyFeatureFlagsToNav(baseGroups, flags);
    return {
      loading,
      me,
      auth,
      studentOnly: isStudentOnly(auth.roles),
      groups,
      flatItems: flattenGroups(groups),
    };
  }, [me, loading, flags]);

  return <AuthNavContext.Provider value={value}>{children}</AuthNavContext.Provider>;
}

export function useAuthNav(): AuthNavValue {
  const ctx = useContext(AuthNavContext);
  if (!ctx) {
    return {
      loading: false,
      me: null,
      auth: EMPTY_AUTH,
      studentOnly: false,
      groups: filterNavGroups(EMPTY_AUTH),
      flatItems: flattenFilteredNav(EMPTY_AUTH),
    };
  }
  return ctx;
}
