export type ContentArticle = {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  body: string;
  updatedAt: string;
};

export const HELP_CATEGORIES = [
  { id: 'primeiros-passos', label: 'Primeiros passos' },
  { id: 'alunos', label: 'Alunos' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'treinos', label: 'Treinos' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'integracoes', label: 'Integrações' },
  { id: 'bi', label: 'BI' },
  { id: 'movvo-ai', label: 'Movvo AI' },
  { id: 'faq', label: 'Perguntas frequentes' },
] as const;

export const HELP_ARTICLES: ContentArticle[] = [
  {
    slug: 'criar-conta',
    category: 'primeiros-passos',
    categoryLabel: 'Primeiros passos',
    title: 'Como criar sua academia na Movvo',
    description: 'Passos iniciais após a contratação.',
    updatedAt: '2026-08-07',
    body: `## Visão geral\n\nApós o go-live comercial, você recebe acesso de administrador.\n\n1. Acesse https://movvoerp.com.br/login\n2. Complete o perfil da empresa e da unidade matriz\n3. Convide usuários (recepção, financeiro, professores)\n4. Importe alunos ou cadastre o primeiro plano\n\n## Dica\n\nUse a Central de Ajuda autenticada em /app/ajuda para checklists operacionais.`,
  },
  {
    slug: 'cadastrar-aluno',
    category: 'alunos',
    categoryLabel: 'Alunos',
    title: 'Cadastrar e matricular um aluno',
    description: 'Fluxo básico de matrícula.',
    updatedAt: '2026-08-07',
    body: `## Cadastro\n\nNo módulo Alunos, crie a ficha com CPF, contato e unidade.\n\n## Matrícula\n\nVincule um plano ativo e confirme o contrato/financeiro.\n\n## Portal\n\nO aluno acessa treinos e financeiro pelo portal quando liberado.`,
  },
  {
    slug: 'mensalidades',
    category: 'financeiro',
    categoryLabel: 'Financeiro',
    title: 'Mensalidades e inadimplência',
    description: 'Como acompanhar cobranças.',
    updatedAt: '2026-08-07',
    body: `## Mensalidades\n\nO financeiro gera títulos conforme o plano.\n\n## Inadimplência\n\nUse filtros de atraso e ações de cobrança (WhatsApp/e-mail quando configurados).\n\n## PDV\n\nVendas avulsas caem no caixa do dia.`,
  },
  {
    slug: 'wellhub-totalpass',
    category: 'integracoes',
    categoryLabel: 'Integrações',
    title: 'Wellhub e TotalPass',
    description: 'Check-in e elegibilidade.',
    updatedAt: '2026-08-07',
    body: `## Disponível\n\nWellhub e TotalPass fazem parte das integrações disponíveis.\n\nConfigure as credenciais em Integrações e valide o fluxo de check-in na unidade.`,
  },
  {
    slug: 'faq-geral',
    category: 'faq',
    categoryLabel: 'Perguntas frequentes',
    title: 'FAQ geral da plataforma',
    description: 'Respostas rápidas.',
    updatedAt: '2026-08-07',
    body: `## A Movvo é cloud?\n\nSim, 100% cloud.\n\n## Tem multiunidade?\n\nSim, nos planos Pro e Enterprise.\n\n## Como solicitar demonstração?\n\nAcesse /demonstracao.`,
  },
];

export function getHelpArticle(category: string, slug: string) {
  return HELP_ARTICLES.find((a) => a.category === category && a.slug === slug);
}

export function searchHelp(q: string) {
  const term = q.trim().toLowerCase();
  if (!term) return HELP_ARTICLES;
  return HELP_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(term) ||
      a.description.toLowerCase().includes(term) ||
      a.body.toLowerCase().includes(term),
  );
}
