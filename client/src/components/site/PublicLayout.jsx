import { useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ImageViewerProvider } from '@/components/content/ImageViewer.jsx';
import { failSafe, gsap, shouldAnimate, useGSAP } from '@/lib/motion';
import { useSiteQuery } from '@/lib/site';
import { AdSlot } from './AdSlot.jsx';
import { AnnouncementBar } from './AnnouncementBar.jsx';
import { Footer } from './Footer.jsx';
import { Header } from './Header.jsx';
import { ErrorState, PageSkeleton } from './States.jsx';

function PageTransition({ children }) {
  const ref = useRef(null);
  const location = useLocation();
  useGSAP(
    () => {
      if (!shouldAnimate() || !ref.current) return undefined;
      gsap.fromTo(ref.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'opacity,visibility,transform' });
      return failSafe(ref.current, 1200);
    },
    { dependencies: [location.pathname] },
  );
  return <div ref={ref}>{children}</div>;
}

export default function PublicLayout() {
  const site = useSiteQuery();

  return (
    <ImageViewerProvider>
      <div className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only z-[60] rounded-md bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
          Skip to content
        </a>
        {site?.isPending ? (
          <>
            <div className="h-[var(--header-height)] border-b bg-background" />
            <PageSkeleton />
          </>
        ) : site?.isError ? (
          <div className="container-page py-16">
            <ErrorState error={site.error} onRetry={site.refetch} title="Website could not load / वेबसाइट लोड नहीं हो सकी" />
          </div>
        ) : (
          <>
            <AnnouncementBar />
            <Header />
            <AdSlot placement="belowHeader" />
            <main id="main" className="flex-1">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </main>
            <AdSlot placement="aboveFooter" />
            <Footer />
          </>
        )}
      </div>
    </ImageViewerProvider>
  );
}
