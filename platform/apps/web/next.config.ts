import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  transpilePackages: ['@athena/ui', '@athena/shared', '@athena/theme', '@athena/branding'],
  compress: true,
  poweredByHeader: false,
  // Do NOT use optimizePackageImports on workspace packages — breaks webpack
  // module factories in Next 15.1.x monorepo + turbopack/webpack hybrid edge cases.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return [
      {
        source: '/app/students',
        destination: '/app/alunos',
        permanent: true,
      },
      {
        source: '/app/students/new',
        destination: '/app/alunos/novo',
        permanent: true,
      },
      {
        source: '/app/students/enroll',
        destination: '/app/matriculas/nova',
        permanent: true,
      },
      {
        source: '/app/students/:id',
        destination: '/app/alunos/:id',
        permanent: true,
      },
      {
        source: '/app/alunos/matricula',
        destination: '/app/matriculas/nova',
        permanent: false,
      },
      {
        source: '/app/sales/plans',
        destination: '/app/matriculas/planos',
        permanent: false,
      },
      {
        source: '/app/sales/enrollments',
        destination: '/app/matriculas',
        permanent: false,
      },
      {
        source: '/app/sales/contracts',
        destination: '/app/matriculas/contratos',
        permanent: false,
      },
      {
        source: '/app/finance',
        destination: '/app/financeiro',
        permanent: false,
      },
      {
        source: '/app/finance/receivables',
        destination: '/app/financeiro/receber',
        permanent: false,
      },
      {
        source: '/app/finance/payables',
        destination: '/app/financeiro/pagar',
        permanent: false,
      },
      {
        source: '/app/finance/cashflow',
        destination: '/app/financeiro/fluxo-caixa',
        permanent: false,
      },
      {
        source: '/app/finance/subscriptions',
        destination: '/app/financeiro/mensalidades',
        permanent: false,
      },
      {
        source: '/app/finance/reports',
        destination: '/app/financeiro/relatorios',
        permanent: false,
      },
      {
        source: '/app/finance/settings',
        destination: '/app/financeiro/configuracoes',
        permanent: false,
      },
      {
        source: '/app/finance/reconciliation',
        destination: '/app/financeiro/conciliacao',
        permanent: false,
      },
      {
        source: '/app/operations',
        destination: '/app/acesso',
        permanent: false,
      },
      {
        source: '/app/operations/checkin',
        destination: '/app/acesso/checkin',
        permanent: false,
      },
      {
        source: '/app/operations/acesso',
        destination: '/app/acesso/monitor',
        permanent: false,
      },
      {
        source: '/app/operations/ocupacao',
        destination: '/app/acesso/presenca',
        permanent: false,
      },
      {
        source: '/app/operations/agenda',
        destination: '/app/agenda/calendario',
        permanent: false,
      },
      {
        source: '/app/operations/aulas',
        destination: '/app/agenda/reservas',
        permanent: false,
      },
      {
        source: '/app/operations/parceiros',
        destination: '/app/integracoes',
        permanent: false,
      },
      {
        source: '/app/workouts',
        destination: '/app/treinos',
        permanent: false,
      },
      {
        source: '/app/workouts/list',
        destination: '/app/treinos/construtor',
        permanent: false,
      },
      {
        source: '/app/workouts/exercises',
        destination: '/app/treinos/exercicios',
        permanent: false,
      },
      {
        source: '/app/workouts/assessments',
        destination: '/app/treinos/avaliacoes',
        permanent: false,
      },
      {
        source: '/app/workouts/evolution',
        destination: '/app/treinos/evolucao',
        permanent: false,
      },
      {
        source: '/app/sales',
        destination: '/app/crm',
        permanent: false,
      },
      {
        source: '/app/sales/leads',
        destination: '/app/crm/leads',
        permanent: false,
      },
      {
        source: '/app/sales/pipeline',
        destination: '/app/crm/pipeline',
        permanent: false,
      },
      {
        source: '/app/engagement',
        destination: '/app/crm',
        permanent: false,
      },
      {
        source: '/app/engagement/campaigns',
        destination: '/app/crm/campanhas',
        permanent: false,
      },
      {
        source: '/app/engagement/loyalty',
        destination: '/app/crm/fidelidade',
        permanent: false,
      },
      {
        source: '/app/analytics',
        destination: '/app/bi',
        permanent: false,
      },
      {
        source: '/app/analytics/executive',
        destination: '/app/bi/executivo',
        permanent: false,
      },
      {
        source: '/app/analytics/reports',
        destination: '/app/bi/relatorios',
        permanent: false,
      },
      {
        source: '/app/analytics/predictions',
        destination: '/app/bi/previsoes',
        permanent: false,
      },
      {
        source: '/app/analytics/ai',
        destination: '/app/bi/chat',
        permanent: false,
      },
    ];
  },
  async headers() {
    // NEVER set immutable cache on /_next/static in development — browsers keep
    // stale webpack chunks and throw: Cannot read properties of undefined (reading 'call')
    if (!isProd) {
      return [
        {
          source: '/_next/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, must-revalidate',
            },
          ],
        },
      ];
    }

    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
