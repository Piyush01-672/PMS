import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { cache } from '../lib/cache.js';
import { Chapter, Exercise, Note, Page, Question } from '../models/index.js';
import { resolvePath } from './publicContent.js';
import { getSiteBootstrap, publicClasses } from './site.js';
import { pick } from './terms.js';
import { urls } from './urls.js';

let template;
async function loadTemplate() {
  if (!template || !env.isProd) template = await fs.readFile(path.join(env.CLIENT_DIST_DIR, 'index.html'), 'utf8');
  return template;
}

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const jsonLd = (data) => `<script type="application/ld+json" data-ssr>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

function siteBase(settings) {
  return (settings.seo?.siteUrl || env.PUBLIC_SITE_URL).replace(/\/$/, '');
}

export function absolute(base, value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${base}${value.startsWith('/') ? value : `/${value}`}`;
}

function headTags({ settings, title, description, canonical, robots = 'index,follow', image, type = 'website', lang, extra = [] }) {
  const base = siteBase(settings);
  const brand = pick(settings.brand?.name, lang) || 'Passion Maths Study';
  const templateStr = settings.seo?.titleTemplate || '%s | Passion Maths Study';
  const fullTitle = title ? templateStr.replace('%s', title) : brand;
  const ogImage = absolute(base, image || settings.seo?.defaultOgImage?.url || settings.brand?.logo?.url || settings.brand?.logoUrl);
  const tags = [
    `<title data-ssr>${esc(fullTitle)}</title>`,
    `<meta data-ssr name="description" content="${esc(description)}" />`,
    `<meta data-ssr name="robots" content="${esc(robots)}" />`,
    canonical ? `<link data-ssr rel="canonical" href="${esc(absolute(base, canonical))}" />` : '',
    `<meta data-ssr property="og:site_name" content="${esc(brand)}" />`,
    `<meta data-ssr property="og:type" content="${esc(type)}" />`,
    `<meta data-ssr property="og:title" content="${esc(title || brand)}" />`,
    `<meta data-ssr property="og:description" content="${esc(description)}" />`,
    canonical ? `<meta data-ssr property="og:url" content="${esc(absolute(base, canonical))}" />` : '',
    ogImage ? `<meta data-ssr property="og:image" content="${esc(ogImage)}" />` : '',
    `<meta data-ssr property="og:locale" content="${lang === 'en' ? 'en_IN' : 'hi_IN'}" />`,
    `<meta data-ssr name="twitter:card" content="summary_large_image" />`,
    settings.seo?.twitterHandle ? `<meta data-ssr name="twitter:site" content="${esc(settings.seo.twitterHandle)}" />` : '',
    settings.seo?.googleSiteVerification
      ? `<meta data-ssr name="google-site-verification" content="${esc(settings.seo.googleSiteVerification)}" />`
      : '',
    ...extra,
  ];
  return tags.filter(Boolean).join('\n    ');
}

function structuredData(result, base, settings, lang) {
  const scripts = [];
  const crumbs = result.breadcrumbs || [];
  if (crumbs.length) {
    scripts.push(
      jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: pick(c.label, lang), item: absolute(base, c.url) })),
      }),
    );
  }
  const seo = result.seo || {};
  const isArticle = ['question', 'exercise', 'note', 'chapter'].includes(result.type);
  scripts.push(
    jsonLd({
      '@context': 'https://schema.org',
      '@type': isArticle ? 'Article' : 'WebPage',
      ...(isArticle ? { headline: seo.title } : { name: seo.title }),
      description: seo.description,
      url: absolute(base, seo.canonical),
      inLanguage: ['hi-IN', 'en-IN'],
      ...(seo.ogImage ? { image: absolute(base, seo.ogImage) } : {}),
      publisher: { '@type': 'Organization', name: settings.seo?.organizationName || 'Passion Maths Study' },
      isAccessibleForFree: true,
    }),
  );
  if (result.faq?.length) {
    scripts.push(
      jsonLd({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: result.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
      }),
    );
  }
  return scripts;
}

export async function renderAppHtml(req, res) {
  const [html, site] = await Promise.all([loadTemplate(), getSiteBootstrap()]);
  const { settings, seoRoutes } = site;
  const lang = settings.language?.default || 'hi';
  const base = siteBase(settings);
  const pathname = req.path.replace(/\/+$/, '') || '/';
  let status = 200;
  let head;

  if (pathname.startsWith(env.ADMIN_PATH)) {
    head = headTags({ settings, title: 'Admin', description: '', robots: 'noindex,nofollow', lang });
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.set('Cache-Control', 'no-store');
  } else if (pathname === '/') {
    const route = seoRoutes.home || {};
    const description = pick(route.description, lang) || pick(settings.seo?.defaultDescription, lang);
    head = headTags({
      settings,
      title: pick(route.title, lang) || pick(settings.seo?.defaultTitle, lang),
      description,
      canonical: '/',
      robots: route.robots,
      image: route.ogImage?.url,
      lang,
      extra: [
        jsonLd({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: pick(settings.brand?.name, lang),
          url: base,
          potentialAction: { '@type': 'SearchAction', target: `${base}/search?q={query}`, 'query-input': 'required name=query' },
        }),
        jsonLd({
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: settings.seo?.organizationName || 'Passion Maths Study',
          url: base,
          logo: absolute(base, settings.brand?.logo?.url || settings.brand?.logoUrl),
        }),
      ],
    });
  } else if (pathname === '/search') {
    const route = seoRoutes.search || {};
    head = headTags({ settings, title: pick(route.title, lang) || 'Search', description: pick(route.description, lang), robots: 'noindex,follow', lang });
  } else {
    try {
      const result = await cache.wrap(`resolve:${pathname}:1`, 60_000, () => resolvePath(pathname, { page: 1 }));
      if (result.type === 'redirect') return res.redirect(301, result.redirect);
      const seo = result.seo || {};
      head = headTags({
        settings,
        title: seo.title,
        description: seo.description,
        canonical: seo.canonical,
        robots: seo.robots,
        image: seo.ogImage,
        type: ['question', 'exercise', 'note', 'chapter'].includes(result.type) ? 'article' : 'website',
        lang,
        extra: structuredData(result, base, settings, lang),
      });
    } catch (err) {
      if (err.status !== 404) throw err;
      status = 404;
      head = headTags({ settings, title: 'Page not found', description: '', robots: 'noindex,follow', lang });
    }
  }

  const page = html.replace('<!--app-head-->', head).replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  if (!res.get('Cache-Control')) res.set('Cache-Control', status === 200 ? 'public, no-cache' : 'no-store');
  res.status(status).type('html').send(page);
}

export async function sitemapXml() {
  return cache.wrap('sitemap', 60 * 60_000, async () => {
    const site = await getSiteBootstrap();
    const base = siteBase(site.settings);
    const entries = [{ loc: '/', priority: '1.0' }];
    const indexable = (doc) => !String(doc.seo?.robots || '').startsWith('noindex');

    const classes = await publicClasses();
    for (const cls of classes) {
      for (const subject of cls.subjects) {
        entries.push({ loc: subject.url, lastmod: cls.updatedAt, priority: '0.9' });
        entries.push({ loc: `${subject.url}/prashnavali`, priority: '0.6' });
        entries.push({ loc: `${subject.url}/notes`, priority: '0.6' });
        entries.push({ loc: `${subject.url}/important-questions`, priority: '0.6' });

        const scope = { class: cls._id, subject: subject._id };
        const chapters = await Chapter.find(Chapter.publicFilter(scope)).select('slug updatedAt seo').lean();
        const chapterById = new Map(chapters.map((c) => [String(c._id), c]));
        for (const ch of chapters.filter(indexable)) entries.push({ loc: urls.chapter(cls, subject, ch), lastmod: ch.updatedAt, priority: '0.8' });

        const exercises = await Exercise.find(Exercise.publicFilter({ chapter: { $in: chapters.map((c) => c._id) } })).select('slug chapter updatedAt seo').lean();
        const exerciseById = new Map(exercises.map((e) => [String(e._id), e]));
        for (const ex of exercises.filter(indexable)) {
          const ch = chapterById.get(String(ex.chapter));
          entries.push({ loc: urls.exercise(cls, subject, ch, ex), lastmod: ex.updatedAt, priority: '0.8' });
        }

        const questions = await Question.find(Question.publicFilter({ exercise: { $in: exercises.map((e) => e._id) } })).select('slug exercise chapter updatedAt seo').lean();
        for (const q of questions.filter(indexable)) {
          const ex = exerciseById.get(String(q.exercise));
          const ch = chapterById.get(String(q.chapter));
          if (ex && ch) entries.push({ loc: urls.question(cls, subject, ch, ex, q), lastmod: q.updatedAt, priority: '0.7' });
        }

        const notes = await Note.find(Note.publicFilter(scope)).select('slug updatedAt seo').lean();
        for (const n of notes.filter(indexable)) entries.push({ loc: urls.note(cls, subject, n), lastmod: n.updatedAt, priority: '0.6' });
      }
    }
    const pages = await Page.find(Page.publicFilter()).select('slug updatedAt seo').lean();
    for (const p of pages.filter(indexable)) entries.push({ loc: urls.page(p), lastmod: p.updatedAt, priority: '0.4' });

    const body = entries
      .map((e) => `  <url><loc>${esc(absolute(base, e.loc))}</loc>${e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ''}<priority>${e.priority}</priority></url>`)
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  });
}

export async function robotsTxt() {
  const site = await getSiteBootstrap();
  const base = siteBase(site.settings);
  return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /search\n\nSitemap: ${base}/sitemap.xml\n`;
}
