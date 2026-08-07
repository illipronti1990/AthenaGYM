import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Sora } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://movvoerp.com.br'),
  title: {
    default: 'Movvo ERP',
    template: '%s',
  },
  description: 'Movimente sua gestão. — ERP completo para academias.',
  applicationName: 'Movvo ERP',
  manifest: '/brand/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/brand/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon.ico' },
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://movvoerp.com.br',
    siteName: 'Movvo ERP',
    title: 'Movvo ERP',
    description: 'Movimente sua gestão.',
    images: [{ url: '/brand/social-preview.png', width: 1200, height: 630, alt: 'Movvo ERP' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Movvo ERP',
    description: 'Movimente sua gestão.',
    images: ['/brand/social-preview.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#080808' },
    { media: '(prefers-color-scheme: light)', color: '#F7F7F8' },
  ],
};

const chunkRecoveryScript = `
(function () {
  try {
    var key = 'movvo-chunk-reload';
    function stale(msg) {
      return typeof msg === 'string' && (
        msg.indexOf("reading 'call'") !== -1 ||
        msg.indexOf('ChunkLoadError') !== -1 ||
        msg.indexOf('Loading chunk') !== -1 ||
        msg.indexOf('Failed to fetch dynamically imported module') !== -1
      );
    }
    function reload() {
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
      var url = new URL(location.href);
      url.searchParams.set('_rsc', String(Date.now()));
      location.replace(url.toString());
    }
    window.addEventListener('error', function (e) {
      if (stale((e && e.message) || (e && e.error && e.error.message))) reload();
    });
    window.addEventListener('unhandledrejection', function (e) {
      var r = e && e.reason;
      var msg = typeof r === 'string' ? r : (r && r.message) || String(r || '');
      if (stale(msg)) reload();
    });
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${sora.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: chunkRecoveryScript }} />
      </head>
      <body className="min-h-screen bg-[var(--background)] font-body text-[var(--text)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
