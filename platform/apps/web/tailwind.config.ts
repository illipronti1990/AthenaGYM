import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/theme/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Sora', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
        movvo: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        movvo: {
          primary: 'var(--primary)',
          primaryHover: 'var(--primary-hover)',
          secondary: 'var(--gold)',
          secondaryLight: 'var(--gold-light)',
          black: 'var(--background)',
          surface: 'var(--surface)',
          card: 'var(--card)',
          text: 'var(--text)',
          muted: 'var(--muted)',
          border: 'var(--border)',
          success: 'var(--success)',
          warning: 'var(--warning)',
          error: 'var(--error)',
          info: 'var(--info)',
          danger: 'var(--danger)',
          finance: 'var(--chart-finance)',
          red: 'var(--primary)',
          redHover: 'var(--primary-hover)',
          gold: 'var(--gold)',
          goldLight: 'var(--gold-light)',
        },
      },
      spacing: {
        8: '8px',
        16: '16px',
        24: '24px',
        32: '32px',
        48: '48px',
        64: '64px',
      },
      borderRadius: {
        movvo: 'var(--radius-btn)',
        'movvo-card': 'var(--radius-card)',
      },
      boxShadow: {
        'movvo-card': 'var(--shadow-card)',
        'movvo-card-hover': 'var(--shadow-card-hover)',
        'movvo-focus': 'var(--shadow-focus)',
      },
    },
  },
  plugins: [],
} satisfies Config;
