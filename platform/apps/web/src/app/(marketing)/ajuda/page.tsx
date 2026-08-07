import type { Metadata } from 'next';
import { HelpCenter } from '@/modules/marketing/components/HelpCenter';

export const metadata: Metadata = {
  title: 'Central de Ajuda — Movvo ERP',
  description: 'Guias e FAQs para operar a Movvo.',
  alternates: { canonical: 'https://movvoerp.com.br/ajuda' },
};

export default function AjudaPage() {
  return (
    <section className="movvo-mkt-section">
      <HelpCenter />
    </section>
  );
}
