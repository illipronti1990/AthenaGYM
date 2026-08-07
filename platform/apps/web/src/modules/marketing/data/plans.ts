export type PlanId = 'start' | 'pro' | 'enterprise';

export type MarketingPlan = {
  id: PlanId;
  planCode: PlanId;
  name: string;
  tagline: string;
  highlight?: boolean;
  cta: string;
  billingReady: boolean;
};

export type PlanFeatureRow = {
  label: string;
  start: string;
  pro: string;
  enterprise: string;
};

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: 'start',
    planCode: 'start',
    name: 'Start',
    tagline: 'Para academias que estão começando a profissionalizar a gestão.',
    cta: 'Solicitar demonstração',
    billingReady: true,
  },
  {
    id: 'pro',
    planCode: 'pro',
    name: 'Pro',
    tagline: 'Para operações em crescimento com múltiplas frentes.',
    highlight: true,
    cta: 'Solicitar demonstração',
    billingReady: true,
  },
  {
    id: 'enterprise',
    planCode: 'enterprise',
    name: 'Enterprise',
    tagline: 'Para redes e franquias que precisam de escala e white-label.',
    cta: 'Falar com vendas',
    billingReady: true,
  },
];

export const PLAN_FEATURE_ROWS: PlanFeatureRow[] = [
  {
    label: 'Unidades',
    start: '1',
    pro: 'Até 5',
    enterprise: 'Ilimitado',
  },
  {
    label: 'Usuários (staff)',
    start: 'Até 5',
    pro: 'Até 25',
    enterprise: 'Ilimitado',
  },
  {
    label: 'Professores',
    start: 'Até 10',
    pro: 'Até 50',
    enterprise: 'Ilimitado',
  },
  {
    label: 'Alunos',
    start: 'Até 300',
    pro: 'Até 2.000',
    enterprise: 'Ilimitado / custom',
  },
  {
    label: 'Financeiro + PDV',
    start: 'Sim',
    pro: 'Sim',
    enterprise: 'Sim',
  },
  {
    label: 'CRM + Agenda + Treinos',
    start: 'Básico',
    pro: 'Completo',
    enterprise: 'Completo',
  },
  {
    label: 'API',
    start: 'Essenciais',
    pro: '+ pagamento',
    enterprise: 'Completa + SLA',
  },
  {
    label: 'White Label',
    start: '—',
    pro: '—',
    enterprise: 'Sim',
  },
  {
    label: 'Movvo AI',
    start: '—',
    pro: 'Sim',
    enterprise: 'Sim + prioridade',
  },
  {
    label: 'Aplicativo do aluno',
    start: 'Roadmap',
    pro: 'Incluído',
    enterprise: 'Incluído + custom',
  },
  {
    label: 'Suporte',
    start: 'E-mail',
    pro: 'Prioritário',
    enterprise: 'Dedicado',
  },
  {
    label: 'Treinamento',
    start: 'Base (docs)',
    pro: 'Onboarding guiado',
    enterprise: 'Implantação assistida',
  },
];

export const PLAN_FAQ = [
  {
    q: 'Os valores são mensais?',
    a: 'Sim. Os planos são comerciais sob consulta — na demonstração alinhamos o modelo ideal ao porte da academia.',
  },
  {
    q: 'Posso migrar de plano depois?',
    a: 'Sim. A estrutura já prevê upgrade (billing ready) sem perder dados ou configurações.',
  },
  {
    q: 'Há fidelidade?',
    a: 'Os termos são flexíveis e definidos na proposta comercial.',
  },
];
