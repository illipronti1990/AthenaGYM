'use client';

import { Button } from '@athena/ui';
import { Copy, Mail, Phone } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export function AlunoCommunicationBar({
  fullName,
  phone,
  whatsapp,
  email,
}: {
  fullName: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
}) {
  const { push } = useToast();
  const dial = whatsapp || phone;
  const digits = (dial || '').replace(/\D/g, '');

  function copyPhone() {
    if (!dial) return;
    void navigator.clipboard.writeText(dial).then(() => push('Telefone copiado.'));
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      data-testid="student-communication"
    >
      {digits ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            window.open(`https://wa.me/55${digits.replace(/^55/, '')}`, '_blank', 'noopener,noreferrer')
          }
        >
          WhatsApp
        </Button>
      ) : null}
      {email ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            window.location.href = `mailto:${email}?subject=Movvo - ${fullName}`;
          }}
        >
          <Mail size={14} className="mr-1 inline" />
          E-mail
        </Button>
      ) : null}
      {digits ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            window.location.href = `tel:${digits}`;
          }}
        >
          <Phone size={14} className="mr-1 inline" />
          Ligar
        </Button>
      ) : null}
      {dial ? (
        <Button type="button" size="sm" variant="secondary" onClick={copyPhone}>
          <Copy size={14} className="mr-1 inline" />
          Copiar telefone
        </Button>
      ) : null}
    </div>
  );
}
