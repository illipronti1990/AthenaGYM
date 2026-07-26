import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-athena',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Athena Academia · ATHENA ERP',
  description: 'Gestão Inteligente para Academias — Athena Academia',
  icons: {
    icon: [
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon.ico' },
    ],
    apple: '/brand/logo-mark.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${manrope.variable}`} suppressHydrationWarning>
      <body className={`${manrope.className} min-h-screen bg-[var(--background)] text-[var(--text)] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
