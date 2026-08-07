import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DOC_PAGES, getDoc } from '@/modules/marketing/content/docs';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return DOC_PAGES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return { title: 'Developers — Movvo' };
  return {
    title: `${doc.title} — Developers Movvo`,
    description: doc.description,
  };
}

export default async function DeveloperDocPage({ params }: Props) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();
  return (
    <section className="movvo-mkt-section">
      <article className="movvo-mkt-container" style={{ maxWidth: 760 }} data-testid="developers-doc">
        <h1 className="movvo-mkt-h2">{doc.title}</h1>
        <p className="movvo-mkt-lead">{doc.description}</p>
        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--mkt-muted)', lineHeight: 1.65 }}>{doc.body}</div>
        <p style={{ marginTop: '2rem' }}>
          <Link href="/developers" className="movvo-mkt-btn movvo-mkt-btn-secondary">Voltar</Link>
        </p>
      </article>
    </section>
  );
}
