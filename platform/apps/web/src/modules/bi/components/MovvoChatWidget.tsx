'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MOVVO_PRODUCT } from '@movvo/shared';
import { MovvoChat } from './MovvoChat';

export function MovvoChatWidget({ accessToken }: { accessToken: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Keep chat mounted after first open so closing the panel does not wipe React state.
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="movvo-chat-backdrop"
          aria-label="Fechar Movvo AI"
          data-testid="movvo-chat-backdrop"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="movvo-chat-widget" data-testid="movvo-chat-widget">
        {mounted ? (
          <div
            className={`movvo-chat-widget-panel${open ? '' : ' is-hidden'}`}
            role="dialog"
            aria-label="Movvo AI chat"
            aria-hidden={!open}
            hidden={!open}
          >
            <div className="movvo-chat-widget-panel-inner">
              <MovvoChat accessToken={accessToken} compact />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="movvo-chat-fab"
          aria-label={open ? 'Fechar Movvo AI' : 'Abrir Movvo AI'}
          aria-expanded={open}
          title={open ? 'Fechar Movvo AI' : 'Movvo AI'}
          data-testid="movvo-chat-fab"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X size={20} strokeWidth={2.25} aria-hidden />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={MOVVO_PRODUCT.assets.aiMascot}
              alt=""
              width={28}
              height={28}
              className="movvo-chat-fab-mascot"
              aria-hidden
            />
          )}
          {!open && <span className="movvo-chat-fab-label">Movvo AI</span>}
        </button>
      </div>
    </>
  );
}
