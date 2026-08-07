'use client';

import Link from 'next/link';
import {
  CalendarPlus,
  CreditCard,
  Dumbbell,
  FileText,
  MessageCircle,
  QrCode,
  UserPlus,
  Wallet,
} from 'lucide-react';

const ACTIONS = [
  { href: '/app/alunos/novo', label: 'Novo Aluno', icon: UserPlus },
  { href: '/app/matriculas/nova', label: 'Nova Matrícula', icon: CreditCard },
  { href: '/app/financeiro/receber', label: 'Receber', icon: Wallet },
  { href: '/app/acesso/checkin', label: 'Check-in', icon: QrCode },
  { href: '/app/acesso/agenda', label: 'Agendar', icon: CalendarPlus },
  { href: '/app/workouts/assessments', label: 'Nova Avaliação', icon: Dumbbell },
  { href: '/app/matriculas/contratos', label: 'Gerar Contrato', icon: FileText },
  { href: '/app/engagement', label: 'Enviar WhatsApp', icon: MessageCircle },
] as const;

export function QuickActions() {
  return (
    <div className="movvo-card" data-testid="quick-actions">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href + a.label} href={a.href} className="movvo-btn movvo-btn-secondary movvo-btn-sm">
              <Icon size={16} />
              {a.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
