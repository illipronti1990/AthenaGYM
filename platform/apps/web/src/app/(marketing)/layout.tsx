import type { Metadata } from 'next';
import { MarketingNavbar } from '@/modules/marketing/components/MarketingNavbar';
import { MarketingFooter } from '@/modules/marketing/components/MarketingFooter';
import { MarketingAnalytics } from '@/modules/marketing/components/MarketingAnalytics';
import '@/modules/marketing/marketing.css';

export const metadata: Metadata = {
  title: 'Movvo ERP — Gestão inteligente para academias',
  description:
    'Movimente sua gestão. ERP completo para academias: alunos, financeiro, treinos, agenda, CRM, PDV, estoque e Movvo AI.',
  alternates: { canonical: 'https://movvoerp.com.br' },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="movvo-mkt" data-testid="marketing-shell">
      <MarketingAnalytics />
      <MarketingNavbar />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
