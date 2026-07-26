'use client';

import Link from 'next/link';
import {
  CalendarPlus,
  CreditCard,
  Dumbbell,
  FileText,
  MessageCircle,
  UserPlus,
  Wallet,
} from 'lucide-react';

const ACTIONS = [
  { href: '/app/students/new', label: 'Novo Aluno', icon: UserPlus },
  { href: '/app/sales/enrollments', label: 'Nova Matrícula', icon: CreditCard },
  { href: '/app/finance/receivables', label: 'Receber', icon: Wallet },
  { href: '/app/operations/agenda', label: 'Agendar', icon: CalendarPlus },
  { href: '/app/workouts/assessments', label: 'Nova Avaliação', icon: Dumbbell },
  { href: '/app/sales/contracts', label: 'Gerar Contrato', icon: FileText },
  { href: '/app/engagement', label: 'Enviar WhatsApp', icon: MessageCircle },
] as const;

export function QuickActions() {
  return (
    <div className="athena-card" data-testid="quick-actions">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href + a.label} href={a.href} className="athena-btn athena-btn-secondary athena-btn-sm">
              <Icon size={16} />
              {a.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
