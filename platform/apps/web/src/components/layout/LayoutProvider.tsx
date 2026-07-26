'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

const SIDEBAR_KEY = 'athena_sidebar_collapsed';

type LayoutCtx = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  toggleMobile: () => void;
  pageLoading: boolean;
  openSearch: () => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (v: boolean) => void;
};

const Ctx = createContext<LayoutCtx | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY);
      if (saved === '1') setCollapsedState(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    try {
      localStorage.setItem(SIDEBAR_KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setPageLoading(true);
    const t = setTimeout(() => setPageLoading(false), 180);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !typing) {
        e.preventDefault();
        if (window.matchMedia('(max-width: 767px)').matches) {
          setMobileOpen((v) => !v);
        } else {
          setCollapsedState((prev) => {
            const next = !prev;
            try {
              localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
            } catch {
              /* ignore */
            }
            return next;
          });
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !typing) {
        e.preventDefault();
        router.push('/app/students/new');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      mobileOpen,
      setMobileOpen,
      toggleMobile,
      pageLoading,
      openSearch,
      searchOpen,
      setSearchOpen,
      notificationsOpen,
      setNotificationsOpen,
    }),
    [
      collapsed,
      setCollapsed,
      toggleCollapsed,
      mobileOpen,
      pageLoading,
      openSearch,
      searchOpen,
      notificationsOpen,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLayout() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLayout requires LayoutProvider');
  return ctx;
}
