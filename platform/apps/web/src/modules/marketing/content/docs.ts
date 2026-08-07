export type DocPage = {
  slug: string;
  title: string;
  description: string;
  body: string;
};

export const DOC_PAGES: DocPage[] = [
  {
    slug: 'overview',
    title: 'Visão geral da API',
    description: 'Base URL, versão e autenticação.',
    body: `## Base URL\n\n\`https://api.movvoerp.com.br/api/v1\`\n\n## Documentação interativa\n\nSwagger: \`/api/v1/docs\`\n\n## Auth\n\nBearer JWT (Supabase) para o ERP. API pública de parceiros usa API keys e escopos.`,
  },
  {
    slug: 'webhooks',
    title: 'Webhooks',
    description: 'Eventos outbound para integrações.',
    body: `Configure endpoints no portal de desenvolvedores autenticado.\n\nEventos comuns: check-in, pagamento, matrícula.`,
  },
  {
    slug: 'demo-leads',
    title: 'Leads comerciais (marketing)',
    description: 'Endpoint público de demonstração.',
    body: `\`POST /api/v1/marketing/demo-requests\`\n\nPúblico, rate-limited, com honeypot e consentimento LGPD.`,
  },
];

export function getDoc(slug: string) {
  return DOC_PAGES.find((d) => d.slug === slug);
}
