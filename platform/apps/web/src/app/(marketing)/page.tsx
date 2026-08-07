import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { MarketingHero } from '@/modules/marketing/components/MarketingHero';
import { ModulesGrid } from '@/modules/marketing/components/ModulesGrid';
import { FinalCta } from '@/modules/marketing/components/FinalCta';
import { ContactSection } from '@/modules/marketing/components/ContactSection';

const DashboardShowcase = dynamic(
  () =>
    import('@/modules/marketing/components/DashboardShowcase').then((m) => m.DashboardShowcase),
  { loading: () => <section className="movvo-mkt-section movvo-mkt-section-alt" aria-busy /> },
);
const IntegrationsSection = dynamic(
  () =>
    import('@/modules/marketing/components/IntegrationsSection').then((m) => m.IntegrationsSection),
);
const DifferentialsSection = dynamic(
  () =>
    import('@/modules/marketing/components/DifferentialsSection').then((m) => m.DifferentialsSection),
);
const AppShowcase = dynamic(() =>
  import('@/modules/marketing/components/AppShowcase').then((m) => m.AppShowcase),
);
const TestimonialsSection = dynamic(() =>
  import('@/modules/marketing/components/TestimonialsSection').then((m) => m.TestimonialsSection),
);
const PlansSection = dynamic(() =>
  import('@/modules/marketing/components/PlansSection').then((m) => m.PlansSection),
);
const FaqSection = dynamic(() =>
  import('@/modules/marketing/components/FaqSection').then((m) => m.FaqSection),
);

export const metadata: Metadata = {
  title: 'Movvo ERP — A gestão inteligente para academias que querem crescer',
  description:
    'Gerencie alunos, financeiro, treinos, agenda, CRM, PDV, estoque e muito mais em uma única plataforma.',
  openGraph: {
    title: 'Movvo ERP',
    description: 'A gestão inteligente para academias que querem crescer.',
    url: 'https://movvoerp.com.br',
    images: [{ url: '/brand/social-preview.png', width: 1200, height: 630 }],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Movvo ERP',
      url: 'https://movvoerp.com.br',
      logo: 'https://movvoerp.com.br/brand/logo.svg',
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'suporte@movvoerp.com.br',
        contactType: 'sales',
        availableLanguage: ['Portuguese'],
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Movvo ERP',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
        description: 'Sob consulta',
      },
      description:
        'ERP completo para academias: alunos, financeiro, treinos, agenda, CRM, PDV, estoque e IA.',
      url: 'https://movvoerp.com.br',
    },
  ],
};

export default function MarketingHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingHero />
      <ModulesGrid />
      <DashboardShowcase />
      <IntegrationsSection />
      <DifferentialsSection />
      <AppShowcase />
      <TestimonialsSection />
      <PlansSection />
      <FaqSection />
      <FinalCta />
      <ContactSection />
    </>
  );
}
