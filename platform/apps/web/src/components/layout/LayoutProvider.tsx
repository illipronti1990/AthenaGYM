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
import { ShortcutDialog } from '@movvo/ui';

const SIDEBAR_KEY = 'movvo_sidebar_collapsed';

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
  shortcutsOpen: boolean;
  setShortcutsOpen: (v: boolean) => void;
};

const Ctx = createContext<LayoutCtx | null>(null);

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(SIDEBAR_KEY) ||
        localStorage.getItem('athena_sidebar_collapsed');
      if (saved === '1') setCollapsedState(true);
      if (!localStorage.getItem(SIDEBAR_KEY) && localStorage.getItem('athena_sidebar_collapsed')) {
        localStorage.setItem(SIDEBAR_KEY, localStorage.getItem('athena_sidebar_collapsed')!);
        localStorage.removeItem('athena_sidebar_collapsed');
      }
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
      const typing = isTypingTarget(e.target);

      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setShortcutsOpen(false);
        setMobileOpen(false);
        window.dispatchEvent(new CustomEvent('movvo:escape'));
        return;
      }

      if (!typing && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }

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
        router.push('/app/matriculas/nova');
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('movvo:save'));
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
      shortcutsOpen,
      setShortcutsOpen,
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
      shortcutsOpen,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <ShortcutDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </Ctx.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLayout requires LayoutProvider');
  return ctx;
}
