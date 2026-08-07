export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const MARKETING_FAQ: FaqItem[] = [
  {
    id: 'como-funciona',
    question: 'Como funciona?',
    answer:
      'A Movvo é 100% cloud. Você acessa pelo navegador, configura sua academia e começa a operar alunos, financeiro, agenda e demais módulos sem instalar nada.',
  },
  {
    id: 'fidelidade',
    question: 'Existe fidelidade?',
    answer:
      'Os planos comerciais são flexíveis. Na demonstração alinhamos o modelo ideal para o porte da sua academia, sem surpresas.',
  },
  {
    id: 'aplicativo',
    question: 'Tem aplicativo?',
    answer:
      'O ecossistema Movvo inclui experiência do aluno (treinos, check-in, agenda e financeiro). O app faz parte do roadmap e já é apresentado como extensão da plataforma.',
  },
  {
    id: 'wellhub',
    question: 'Integra com Wellhub?',
    answer:
      'Sim. Wellhub e TotalPass estão entre as integrações disponíveis para o fluxo de check-in e elegibilidade.',
  },
  {
    id: 'multiunidade',
    question: 'É multiunidade?',
    answer:
      'Sim. Os planos Pro e Enterprise suportam multiunidade e, no Enterprise, redes com white-label.',
  },
  {
    id: 'migracao',
    question: 'Como funciona a migração?',
    answer:
      'Nossa equipe orienta a importação de alunos, planos e históricos essenciais. Agende uma demonstração para mapear o seu cenário.',
  },
];
