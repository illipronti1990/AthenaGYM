import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS, getBlogPost } from '@/modules/marketing/content/blog';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Blog — Movvo ERP' };
  return {
    title: `${post.title} — Movvo Blog`,
    description: post.description,
    openGraph: { title: post.title, description: post.description },
    alternates: { canonical: `https://movvoerp.com.br/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.publishedAt,
    description: post.description,
    author: { '@type': 'Organization', name: 'Movvo ERP' },
  };

  return (
    <section className="movvo-mkt-section" data-testid="blog-post">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="movvo-mkt-container" style={{ maxWidth: 760 }}>
        <p className="movvo-mkt-kicker">{post.category}</p>
        <h1 className="movvo-mkt-h2">{post.title}</h1>
        <p className="movvo-mkt-lead">{post.description}</p>
        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--mkt-muted)', lineHeight: 1.65 }}>{post.body}</div>
        <p style={{ marginTop: '2rem' }}>
          <Link href="/blog" className="movvo-mkt-btn movvo-mkt-btn-secondary">Voltar ao blog</Link>
        </p>
      </article>
    </section>
  );
}
