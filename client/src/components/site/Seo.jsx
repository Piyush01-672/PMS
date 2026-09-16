import { useEffect } from 'react';
import { useLang, pickL10n } from '@/lib/i18n';
import { useSite } from '@/lib/site';

const absolute = (base, url) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
};

/**
 * Page metadata (React 19 hoists these tags into <head>).
 * JSON-LD is injected with an effect: React does not render <script> elements on the client,
 * and crawlers already receive the server-rendered structured data.
 */
export function Seo({ title, description, canonical, robots = 'index,follow', image, type = 'website', jsonLd }) {
  const site = useSite();
  const { lang } = useLang();
  const settings = site?.settings || {};
  const base = (settings.seo?.siteUrl || window.location.origin).replace(/\/$/, '');
  const brand = pickL10n(settings.brand?.name, lang) || 'Passion Maths Study';
  const template = settings.seo?.titleTemplate || '%s';
  const fullTitle = title ? template.replace('%s', title) : brand;
  const ogImage = absolute(base, image || settings.seo?.defaultOgImage?.url || settings.brand?.logo?.url);
  const schemaJson = JSON.stringify((Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean));

  useEffect(() => {
    const nodes = JSON.parse(schemaJson).map((schema) => {
      const node = document.createElement('script');
      node.type = 'application/ld+json';
      node.dataset.seo = 'client';
      node.textContent = JSON.stringify(schema);
      document.head.appendChild(node);
      return node;
    });
    return () => nodes.forEach((node) => node.remove());
  }, [schemaJson]);

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={robots} />
      {canonical && <link rel="canonical" href={absolute(base, canonical)} />}
      <meta property="og:site_name" content={brand} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title || brand} />
      {description && <meta property="og:description" content={description} />}
      {canonical && <meta property="og:url" content={absolute(base, canonical)} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}

export function breadcrumbSchema(crumbs, lang) {
  if (!crumbs?.length) return null;
  const base = window.location.origin;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: pickL10n(c.label, lang), item: `${base}${c.url}` })),
  };
}
