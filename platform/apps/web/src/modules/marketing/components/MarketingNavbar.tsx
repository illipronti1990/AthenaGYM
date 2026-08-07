'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '@movvo/ui';
import { trackEvent } from '../lib/analytics';

const NAV = [
  { href: '/planos', label: 'Planos' },
  { href: '/#recursos', label: 'Recursos' },
  { href: '/ajuda', label: 'Ajuda' },
  { href: '/blog', label: 'Blog' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
] as const;

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`movvo-mkt-nav${scrolled ? ' is-scrolled' : ''}`}
      data-testid="marketing-navbar"
    >
      <div className="movvo-mkt-nav-inner">
        <Link href="/" className="movvo-mkt-nav-brand" aria-label="Movvo ERP — início">
          <Logo variant="horizontal" tone="brand" className="!justify-start !px-0 !py-0" />
        </Link>

        <nav className="movvo-mkt-nav-links" aria-label="Principal">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="movvo-mkt-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="movvo-mkt-nav-actions">
          <Link
            href="/login"
            className="movvo-mkt-btn movvo-mkt-btn-ghost"
            data-testid="nav-login"
            onClick={() => trackEvent('login_cta_click', { placement: 'navbar' })}
          >
            Entrar
          </Link>
          <Link
            href="/demonstracao"
            className="movvo-mkt-btn movvo-mkt-btn-primary"
            data-testid="nav-demo"
            onClick={() => trackEvent('demo_cta_click', { placement: 'navbar' })}
          >
            Solicitar demonstração
          </Link>
          <button
            type="button"
            className="movvo-mkt-nav-burger"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            data-testid="nav-burger"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="movvo-mkt-nav-drawer" data-testid="nav-drawer">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="movvo-mkt-nav-drawer-link"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="movvo-mkt-btn movvo-mkt-btn-ghost" onClick={() => setOpen(false)}>
            Entrar
          </Link>
          <Link
            href="/demonstracao"
            className="movvo-mkt-btn movvo-mkt-btn-primary"
            onClick={() => {
              setOpen(false);
              trackEvent('demo_cta_click', { placement: 'navbar_mobile' });
            }}
          >
            Solicitar demonstração
          </Link>
        </div>
      ) : null}
    </header>
  );
}
