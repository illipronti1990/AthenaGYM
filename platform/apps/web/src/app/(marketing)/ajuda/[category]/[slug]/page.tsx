import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HelpCenter } from '@/modules/marketing/components/HelpCenter';
import { getHelpArticle, HELP_ARTICLES } from '@/modules/marketing/content/help';

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ category: a.category, slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const article = getHelpArticle(category, slug);
  if (!article) return { title: 'Ajuda — Movvo ERP' };
  return {
    title: `${article.title} — Ajuda Movvo`,
    description: article.description,
    alternates: { canonical: `https://movvoerp.com.br/ajuda/${category}/${slug}` },
  };
}

export default async function AjudaArticlePage({ params }: Props) {
  const { category, slug } = await params;
  if (!getHelpArticle(category, slug)) notFound();
  return (
    <section className="movvo-mkt-section">
      <HelpCenter category={category} slug={slug} />
    </section>
  );
}
