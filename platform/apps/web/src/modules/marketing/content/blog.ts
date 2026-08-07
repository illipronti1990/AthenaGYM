export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  description: string;
  body: string;
  publishedAt: string;
};

export const BLOG_CATEGORIES = [
  'Gestão de Academias',
  'Marketing',
  'Financeiro',
  'Tecnologia',
  'Novidades da Movvo',
] as const;

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'gestao-inteligente-academias',
    category: 'Gestão de Academias',
    title: 'Gestão inteligente: o que academias que crescem fazem diferente',
    description: 'Processos, dados e operação sob o mesmo teto.',
    publishedAt: '2026-08-01',
    body: `Academias que escalam unificam alunos, financeiro e agenda.\n\nA Movvo nasce para eliminar planilhas e sistemas fragmentados.`,
  },
  {
    slug: 'retencao-com-crm',
    category: 'Marketing',
    title: 'Retenção com CRM: do lead ao aluno ativo',
    description: 'Pipeline comercial e follow-up sem improviso.',
    publishedAt: '2026-08-03',
    body: `CRM não é só captar leads — é nutrir e recuperar.\n\nCom pipeline e automações, a equipe comercial trabalha com prioridade.`,
  },
  {
    slug: 'inadimplencia-sob-controle',
    category: 'Financeiro',
    title: 'Inadimplência sob controle sem perder o aluno',
    description: 'Visibilidade de caixa e cobrança humanizada.',
    publishedAt: '2026-08-05',
    body: `Ver o atraso cedo muda o jogo.\n\nCombine indicadores financeiros com comunicação clara.`,
  },
];

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
