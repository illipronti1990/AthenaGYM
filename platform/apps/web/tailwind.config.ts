import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        athena: {
          red: '#A00018',
          redHover: '#C1121F',
          gold: '#D4AF37',
          goldLight: '#F4D35E',
          black: '#0A0A0A',
          surface: '#151515',
          card: '#1B1B1F',
          text: '#FFFFFF',
          muted: '#A1A1AA',
          border: '#2B2B2B',
          finance: '#E63946',
        },
      },
      borderRadius: {
        athena: '10px',
        'athena-card': '16px',
      },
    },
  },
  plugins: [],
} satisfies Config;
