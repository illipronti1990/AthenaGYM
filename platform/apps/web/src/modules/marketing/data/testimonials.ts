export type Testimonial = {
  id: string;
  name: string;
  academy: string;
  rating: number;
  comment: string;
  photo: string;
};

/** Fictícios — exibir apenas com NEXT_PUBLIC_MARKETING_DEMO_SOCIAL=true */
export const DEMO_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Camila Ferreira',
    academy: 'Pulse Fit Studio',
    rating: 5,
    comment:
      'Centralizamos financeiro e CRM. Em poucas semanas a inadimplência ficou visível e tratável.',
    photo: '/brand/logo-mark.svg',
  },
  {
    id: 't2',
    name: 'Rafael Souza',
    academy: 'Iron House Academia',
    rating: 5,
    comment:
      'A agenda e o check-in reduziram filas na recepção. A equipe finalmente trabalha no mesmo sistema.',
    photo: '/brand/logo-mark.svg',
  },
  {
    id: 't3',
    name: 'Juliana Mendes',
    academy: 'Athena Academia (demo)',
    rating: 5,
    comment:
      'O BI mostra o que importa. Tomamos decisões de plano e ocupação com dados, não achismo.',
    photo: '/brand/logo-mark.svg',
  },
];
