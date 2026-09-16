import { useSite } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * Reserved advertising space. Renders nothing unless the admin enabled ads + this slot.
 * Space is reserved with min-height (no layout shift) and ad code runs in a sandboxed iframe.
 */
export function AdSlot({ placement, pageType, className }) {
  const site = useSite();
  if (!site?.settings?.ads?.enabled) return null;
  const slots = (site.adSlots || []).filter(
    (slot) => slot.placement === placement && (!slot.pageTypes?.length || !pageType || slot.pageTypes.includes(pageType)),
  );
  if (!slots.length) return null;

  return slots.map((slot) => (
    <aside
      key={slot._id}
      aria-label="Advertisement"
      className={cn(
        'container-page my-4',
        slot.device === 'desktop' && 'hidden md:block',
        slot.device === 'mobile' && 'md:hidden',
        className,
      )}
    >
      <p className="mb-1 text-center text-[10px] tracking-wider text-muted-foreground uppercase">विज्ञापन · Advertisement</p>
      <div
        className="flex items-center justify-center overflow-hidden rounded-lg bg-muted/40 [min-height:var(--ad-mobile)] md:[min-height:var(--ad-desktop)]"
        style={{ '--ad-mobile': `${slot.minHeightMobile}px`, '--ad-desktop': `${slot.minHeightDesktop}px` }}
      >
        <iframe
          title={`Advertisement: ${slot.name}`}
          src={`/api/public/ad-frame/${slot._id}`}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          loading="lazy"
          className="block h-[var(--ad-mobile)] w-full border-0 md:h-[var(--ad-desktop)]"
          style={{ '--ad-mobile': `${slot.minHeightMobile}px`, '--ad-desktop': `${slot.minHeightDesktop}px` }}
        />
      </div>
    </aside>
  ));
}
