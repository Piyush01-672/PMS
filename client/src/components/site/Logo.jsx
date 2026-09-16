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
    <Link to="/" className={cn('group flex min-w-0 items-center gap-2.5', className)} aria-label={`${name} – Home`}>
      <span className={cn('grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-0.5 ring-1 ring-black/5', variant === 'footer' && 'size-12')}>
        <img src={src} alt={brand.logoAlt || name} width="44" height="44" className="size-full object-contain transition-transform duration-300 group-hover:scale-105" />
      </span>
      {showText && (
        <span className={cn('flex min-w-0 flex-col leading-tight', textClassName)}>
          <span className="truncate font-heading text-[15px] font-extrabold tracking-tight sm:text-base">{name}</span>
          {t(brand.tagline) && <span className="truncate text-[11px] font-medium text-muted-foreground">{t(brand.tagline)}</span>}
        </span>
      )}
    </Link>
  );
}
