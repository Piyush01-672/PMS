import { Link } from 'react-router';
import { useL10n } from '@/lib/i18n';
import { useBrand } from '@/lib/site';
import { cn } from '@/lib/utils';

export function Logo({ className, showText = true, textClassName, variant = 'header' }) {
  const brand = useBrand();
  const t = useL10n();
  const src = variant === 'footer' ? brand.footerLogoSrc : brand.logoSrc;
  const name = t(brand.name) || 'Passion Maths Study';
  return (
    <Link to="/" className={cn('group flex shrink-0 items-center gap-2.5', className)} aria-label={`${name} – Home`}>
      <span className={cn('grid size-10 sm:size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-0.5 shadow-xs ring-1 ring-black/5 dark:ring-white/10', variant === 'footer' && 'size-12')}>
        <img
          src={src || '/brand/pms-logo.png'}
          alt={brand.logoAlt || name}
          width="44"
          height="44"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/brand/pms-logo.png';
          }}
          className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </span>
      {showText && (
        <span className={cn('flex flex-col leading-tight shrink-0', textClassName)}>
          <span className="font-heading text-[14px] sm:text-[15px] xl:text-base font-extrabold tracking-tight whitespace-nowrap text-foreground">{name}</span>
          {t(brand.tagline) && <span className="text-[10.5px] sm:text-[11px] font-medium text-muted-foreground whitespace-nowrap">{t(brand.tagline)}</span>}
        </span>
      )}
    </Link>
  );
}
