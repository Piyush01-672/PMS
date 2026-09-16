import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { SmartLink } from '@/components/site/SmartLink.jsx';
import { useL10n } from '@/lib/i18n';
import { useReveal } from '@/lib/motion';
import { cn } from '@/lib/utils';

const BACKGROUNDS = {
  none: '',
  muted: 'bg-muted/50',
  grid: 'bg-grid',
  brand: 'bg-gradient-to-br from-brand to-[color-mix(in_oklab,var(--brand)_55%,var(--saffron))] text-white',
  dark: 'bg-[#1b1d2a] text-white dark:bg-[#0f1424]',
};

const BUTTON_VARIANT = { primary: 'default', secondary: 'secondary', outline: 'outline', ghost: 'ghost', link: 'link' };

export function SectionButtons({ buttons, className, inverted }) {
  const t = useL10n();
  if (!buttons?.length) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {buttons.map((button) => (
        <Button
          key={button._id}
          asChild
          size="lg"
          variant={BUTTON_VARIANT[button.variant] || 'default'}
          className={cn(
            'h-11 rounded-xl px-5 text-sm font-semibold',
            inverted && button.variant === 'outline' && 'border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white',
            inverted && button.variant === 'secondary' && 'bg-white text-ink hover:bg-white/90',
          )}
        >
          <SmartLink to={button.url} newTab={button.newTab}>
            {t(button.label)}
            {button.variant !== 'link' && <ArrowRight data-icon="inline-end" />}
          </SmartLink>
        </Button>
      ))}
    </div>
  );
}

export function SectionShell({ section, children, className, containerClassName, heading = true, headingAside }) {
  const ref = useRef(null);
  const t = useL10n();
  const background = section.config?.background || 'none';
  const inverted = background === 'brand' || background === 'dark';
  const centered = section.config?.align === 'center';
  useReveal(ref, { dependencies: [section._id] });

  return (
    <section ref={ref} id={section.name || section._id} className={cn('scroll-mt-20 py-12 sm:py-16', BACKGROUNDS[background], className)}>
      <div className={cn('container-page', containerClassName)}>
        {heading && (t(section.title) || t(section.badge)) && (
          <div className={cn('mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between', centered && 'items-center text-center md:flex-col md:items-center')}>
            <div className={cn('max-w-2xl', centered && 'mx-auto')} data-reveal>
              {t(section.badge) && (
                <span className={cn('mb-3 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold tracking-[0.12em] uppercase', inverted ? 'bg-white/15 text-white' : 'bg-brand-soft text-brand')}>
                  {t(section.badge)}
                </span>
              )}
              {t(section.title) && (
                <h2 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
                  {t(section.title)} {t(section.highlight) && <span className={inverted ? 'text-saffron' : 'text-brand'}>{t(section.highlight)}</span>}
                </h2>
              )}
              {t(section.description) && <p className={cn('mt-2 text-[15px] leading-relaxed', inverted ? 'text-white/75' : 'text-muted-foreground')}>{t(section.description)}</p>}
            </div>
            {headingAside ?? <SectionButtons buttons={section.buttons} inverted={inverted} />}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
