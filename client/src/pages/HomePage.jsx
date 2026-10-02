import { useQuery } from '@tanstack/react-query';
import { LayoutTemplate } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { DefaultHomeContent } from '@/components/home/DefaultHomeContent.jsx';
import { SectionRenderer } from '@/components/home/SectionRenderer.jsx';
import { PreviewBanner } from '@/components/site/PreviewBanner.jsx';
import { Seo } from '@/components/site/Seo.jsx';
import { PageSkeleton } from '@/components/site/States.jsx';
import { get } from '@/lib/api';
import { useL10n } from '@/lib/i18n';
import { prefersReducedMotion } from '@/lib/motion';
import { useSite } from '@/lib/site';

export function useHashScroll(ready) {
  const location = useLocation();
  useEffect(() => {
    if (!ready || !location.hash) return;
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }));
  }, [ready, location.hash]);
}

export default function HomePage() {
  const site = useSite();
  const t = useL10n();
  const [params] = useSearchParams();
  const preview = params.get('preview') === '1';
  const home = useQuery({ queryKey: ['home', preview], queryFn: () => get('/public/home', preview ? { preview: 1 } : undefined) });
  useHashScroll(home.isSuccess);

  const route = site?.seoRoutes?.home || {};
  const settings = site?.settings || {};
  const faq = (home.data?.sections || []).filter((s) => s.type === 'faq').flatMap((s) => s.items);

  return (
    <>
      <Seo
        title={t(route.title) || t(settings.seo?.defaultTitle) || 'NCERT गणित हल कक्षा 6 से 12 | Passion Maths Study'}
        description={t(route.description) || t(settings.seo?.defaultDescription) || 'Class 6 to 12 NCERT Mathematics step-by-step solutions, formulas and notes in Hindi and English.'}
        canonical="/"
        robots={route.robots}
        image={route.ogImage?.url}
        jsonLd={
          faq.length
            ? {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faq.map((f) => ({ '@type': 'Question', name: t(f.title), acceptedAnswer: { '@type': 'Answer', text: t(f.description) } })),
              }
            : null
        }
      />
      {preview && <PreviewBanner />}
      {home.isPending && <PageSkeleton />}
      {home.isError && <DefaultHomeContent />}
      {home.isSuccess && (
        home.data?.sections?.length ? (
          <SectionRenderer sections={home.data.sections} />
        ) : (
          <DefaultHomeContent />
        )
      )}
    </>
  );
}
