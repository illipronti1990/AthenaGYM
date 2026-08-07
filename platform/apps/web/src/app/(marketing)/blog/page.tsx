import type { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '@/modules/marketing/content/blog';

export const metadata: Metadata = {
  title: 'Blog — Movvo ERP',
  description: 'Gestão, marketing, financeiro, tecnologia e novidades da Movvo.',
  alternates: { canonical: 'https://movvoerp.com.br/blog' },
};

export default function BlogPage() {
  return (
    <section className="movvo-mkt-section" data-testid="blog-index">
      <div className="movvo-mkt-container">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Blog</p>
          <h1 className="movvo-mkt-h2">Conteúdo para gestores de academia</h1>
        </header>
        <div className="movvo-mkt-modules">
          {BLOG_POSTS.map((post) => (
            <article key={post.slug} className="movvo-mkt-module">
              <p className="movvo-mkt-kicker">{post.category}</p>
              <h2 className="movvo-mkt-module-title">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="movvo-mkt-module-desc">{post.description}</p>
              <p className="movvo-mkt-footer-meta">{post.publishedAt}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
