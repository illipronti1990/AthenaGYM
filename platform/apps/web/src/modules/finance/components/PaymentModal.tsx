'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { PaymentMethod, Receivable } from '@athena/shared';
import { calcReceivableRemaining } from '@athena/shared';
import { Button, Modal } from '@athena/ui';
import { financeApi, type ReceivePaymentBody } from '../services/financeApi';
import { useToast } from '@/components/ui/Toast';

type Props = {
  open: boolean;
  accessToken: string;
  receivable: Receivable | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaymentModal({ open, accessToken, receivable, onClose, onSuccess }: Props) {
  const { push } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [amount, setAmount] = useState(0);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [interest, setInterest] = useState(0);
  const [fine, setFine] = useState(0);
  const [nsu, setNsu] = useState('');
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [installments, setInstallments] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !receivable) return;
    const remaining = calcReceivableRemaining(receivable);
    setAmount(remaining);
    setInterest(receivable.interest || 0);
    setFine(receivable.fine || 0);
    setNsu('');
    setAuthorizationCode('');
    setCardBrand('');
    setInstallments(1);
    setPaymentMethodId(receivable.paymentMethodId || '');
  }, [open, receivable]);

  useEffect(() => {
    if (!open) return;
    void financeApi
      .paymentMethods(accessToken)
      .then((list) => {
        setMethods(list.filter((m) => m.active));
        setPaymentMethodId((prev) => prev || list.find((m) => m.active)?.id || '');
      })
      .catch(() => setMethods([]));
  }, [open, accessToken]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!receivable) return;
    setSaving(true);
    try {
      const body: ReceivePaymentBody = {
        amount,
        paymentMethodId: paymentMethodId || undefined,
        interest: interest || undefined,
        fine: fine || undefined,
        nsu: nsu.trim() || undefined,
        authorizationCode: authorizationCode.trim() || undefined,
        cardBrand: cardBrand.trim() || undefined,
        installments: installments > 1 ? installments : undefined,
      };
      await financeApi.receive(accessToken, receivable.id, body);
      push('Recebimento registrado.');
      onSuccess();
      onClose();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao receber', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Receber pagamento" onClose={onClose}>
      {receivable ? (
        <form onSubmit={onSubmit} className="grid gap-3" data-testid="payment-modal-form">
          <p className="text-sm text-[var(--muted)]">
            {receivable.description} ·{' '}
            {receivable.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>

          <label className="block text-sm">
            <span className="athena-label">Valor recebido (R$)</span>
            <input
              type="number"
              min={0.01}
              step={0.01}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="athena-input mt-1"
            />
          </label>

          <label className="block text-sm">
            <span className="athena-label">Forma de pagamento</span>
            <select
              className="athena-input mt-1"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
            >
              <option value="">Selecione…</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="athena-label">Juros (R$)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={interest}
                onChange={(e) => setInterest(Number(e.target.value))}
                className="athena-input mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="athena-label">Multa (R$)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={fine}
                onChange={(e) => setFine(Number(e.target.value))}
                className="athena-input mt-1"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="athena-label">NSU</span>
              <input
                value={nsu}
                onChange={(e) => setNsu(e.target.value)}
                className="athena-input mt-1"
              />
            </label>
            <label className="block text-sm">
              <span className="athena-label">Código de autorização</span>
              <input
                value={authorizationCode}
                onChange={(e) => setAuthorizationCode(e.target.value)}
                className="athena-input mt-1"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="athena-label">Bandeira do cartão</span>
              <input
                value={cardBrand}
                onChange={(e) => setCardBrand(e.target.value)}
                className="athena-input mt-1"
                placeholder="Visa, Master…"
              />
            </label>
            <label className="block text-sm">
              <span className="athena-label">Parcelas</span>
              <input
                type="number"
                min={1}
                max={24}
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="athena-input mt-1"
              />
            </label>
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving} loadingLabel="Recebendo…">
              Confirmar recebimento
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
