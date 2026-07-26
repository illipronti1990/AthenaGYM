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
        athena: ['var(--font-athena)', 'Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        athena: {
          red: 'var(--primary)',
          redHover: 'var(--primary-hover)',
          gold: 'var(--gold)',
          goldLight: 'var(--gold-light)',
          black: 'var(--background)',
          surface: 'var(--surface)',
          card: 'var(--card)',
          text: 'var(--text)',
          muted: 'var(--muted)',
          border: 'var(--border)',
          success: 'var(--success)',
          danger: 'var(--danger)',
          finance: 'var(--chart-finance)',
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
        athena: 'var(--radius-btn)',
        'athena-card': 'var(--radius-card)',
      },
      boxShadow: {
        'athena-card': 'var(--shadow-card)',
        'athena-card-hover': 'var(--shadow-card-hover)',
        'athena-focus': 'var(--shadow-focus)',
      },
    },
  },
  plugins: [],
} satisfies Config;
