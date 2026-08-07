import type { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/modules/marketing/content/blog';
import { HELP_ARTICLES } from '@/modules/marketing/content/help';
import { DOC_PAGES } from '@/modules/marketing/content/docs';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://movvoerp.com.br';
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/planos`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/demonstracao`, lastModified: now, changeFrequency: 'monthly', priority: 0.95 },
    { url: `${base}/contato`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/ajuda`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/sobre`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/status`, lastModified: now, changeFrequency: 'daily', priority: 0.5 },
    { url: `${base}/developers`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const blog = BLOG_POSTS.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const help = HELP_ARTICLES.map((a) => ({
    url: `${base}/ajuda/${a.category}/${a.slug}`,
    lastModified: new Date(a.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  const docs = DOC_PAGES.map((d) => ({
    url: `${base}/developers/${d.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...blog, ...help, ...docs];
}
