import type { Metadata } from 'next';
import StatusClient from './StatusClient';

export const metadata: Metadata = {
  title: 'Status — Movvo ERP',
  description: 'Status da API, banco, autenticação e integrações.',
  alternates: { canonical: 'https://movvoerp.com.br/status' },
};

export default function StatusPage() {
  return (
    <section className="movvo-mkt-section">
      <StatusClient />
    </section>
  );
}
