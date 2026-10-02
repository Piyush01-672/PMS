import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router';
import { useL10n } from '@/lib/i18n';
import { useSite, useTerm } from '@/lib/site';
import { Logo } from './Logo.jsx';
import { SmartLink } from './SmartLink.jsx';
import { SOCIAL_ICONS } from './SocialIcons.jsx';

function Column({ title, children }) {
  return (
    <div>
      <h2 className="mb-4 text-xs font-extrabold tracking-[0.14em] text-white uppercase">{title}</h2>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

const linkClass = 'text-white/65 transition-colors hover:text-white';

const DEFAULT_SOCIAL = [
  { platform: 'whatsapp', url: 'https://whatsapp.com/channel/0029Vb8ePtV6xCSKZnaBfu0N', label: 'WhatsApp' },
  { platform: 'youtube', url: 'https://youtube.com/@passionmathsstudy?si=tc1BLKqOF3RTZnnc', label: 'YouTube' },
  { platform: 'instagram', url: 'https://www.instagram.com/nitishkumar65462?stkn=dXJ5N3M0c2U1NDhl', label: 'Instagram' },
  { platform: 'facebook', url: 'https://www.facebook.com/share/19ZEaJ72X5/', label: 'Facebook' },
];

const SOCIAL_STYLES = {
  youtube: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] hover:shadow-lg hover:shadow-[#FF0000]/25',
  facebook: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] hover:shadow-lg hover:shadow-[#1877F2]/25',
  instagram: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-[#dc2743]/25',
  whatsapp: 'hover:bg-[#25D366] hover:text-white hover:border-[#25D366] hover:shadow-lg hover:shadow-[#25D366]/25',
};

export function Footer() {
  const site = useSite();
  const t = useL10n();
  const term = useTerm();
  const settings = site?.settings || {};
  const footer = settings.footer || {};
  const contact = settings.contact || {};
  const classes = [...(site?.classes || [])].sort((a, b) => a.number - b.number);
  const columns = site?.navigation?.footer || [];
  const looseLinks = columns.filter((c) => c.type === 'link');
  const socialList = settings.social?.length ? settings.social : DEFAULT_SOCIAL;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-[#161826] text-white dark:bg-[#070b14]">
      <div className="container-page py-12 lg:py-14">
        {/* WhatsApp Channel Callout Banner */}
        <div className="mb-12 rounded-2xl border border-[#25D366]/30 bg-gradient-to-r from-[#25D366]/15 via-[#25D366]/5 to-white/5 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25">
                <SOCIAL_ICONS.whatsapp className="size-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-base font-extrabold text-white sm:text-lg">
                    Passion Maths Study WhatsApp Channel
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-[#25D366]/20 px-2 py-0.5 text-[10px] font-bold text-[#25D366] ring-1 ring-[#25D366]/30">
                    Official
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-white/70">
                  NCERT 2024-25 गणित के दैनिक सूत्र, नए हल, नोट्स और परीक्षा अपडेट्स सीधे अपने WhatsApp पर पाएँ।
                </p>
              </div>
            </div>
            <a
              href="https://whatsapp.com/channel/0029Vb8ePtV6xCSKZnaBfu0N"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#20bd5a] hover:shadow-lg active:scale-95 sm:self-auto self-start"
            >
              <SOCIAL_ICONS.whatsapp className="size-4" /> Follow on WhatsApp
            </a>
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4">
            <Logo variant="footer" textClassName="[&>span:last-child]:text-white/60" />
            {t(footer.description) && <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">{t(footer.description)}</p>}
            {footer.badges?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {footer.badges.map((badge, i) => (
                  <span key={i} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                    {t(badge)}
                  </span>
                ))}
              </div>
            )}
            {footer.showSocial !== false && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-bold tracking-wider text-white/50 uppercase">Follow Us On Social Media</p>
                <ul className="flex flex-wrap items-center gap-2.5" aria-label="Social media links">
                  {socialList.map((s) => {
                    const IconComponent = SOCIAL_ICONS[s.platform] || Globe;
                    const hoverClass = SOCIAL_STYLES[s.platform] || 'hover:bg-brand hover:text-white';
                    return (
                      <li key={s._id || s.url}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.platform}
                          title={`Follow on ${s.platform.charAt(0).toUpperCase() + s.platform.slice(1)}`}
                          className={`grid size-10 place-items-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition-all active:scale-95 ${hoverClass}`}
                        >
                          <IconComponent className="size-5" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {columns
            .filter((c) => c.type !== 'link')
            .map((column) => (
              <div key={column._id} className="lg:col-span-2">
                <Column title={t(column.label)}>
                  {column.type === 'classes'
                    ? classes.map((cls) => (
                      <li key={cls._id}>
                        <Link to={cls.url} className={linkClass}>
                          {term('class')} {cls.number} {term('mathematics')}
                        </Link>
                      </li>
                    ))
                    : column.children.map((child) => (
                      <li key={child._id}>
                        <SmartLink to={child.url} newTab={child.newTab} className={linkClass}>
                          {t(child.label)}
                        </SmartLink>
                      </li>
                    ))}
                </Column>
              </div>
            ))}

          {looseLinks.length > 0 && (
            <div className="lg:col-span-2">
              <Column title="Links">
                {looseLinks.map((link) => (
                  <li key={link._id}>
                    <SmartLink to={link.url} newTab={link.newTab} className={linkClass}>
                      {t(link.label)}
                    </SmartLink>
                  </li>
                ))}
              </Column>
            </div>
          )}

          {(contact.email || contact.phone || t(contact.address)) && (
            <div className="lg:col-span-2">
              <Column title="Contact">
                {contact.email && (
                  <li>
                    <a href={`mailto:${contact.email}`} className={`${linkClass} inline-flex items-center gap-2 break-all`}>
                      <Mail className="size-4 shrink-0" /> {contact.email}
                    </a>
                  </li>
                )}
                {contact.phone && (
                  <li>
                    <a href={`tel:${contact.phone}`} className={`${linkClass} inline-flex items-center gap-2`}>
                      <Phone className="size-4 shrink-0" /> {contact.phone}
                    </a>
                  </li>
                )}
                {t(contact.address) && (
                  <li className="flex gap-2 text-white/65">
                    <MapPin className="mt-0.5 size-4 shrink-0" /> {t(contact.address)}
                  </li>
                )}
              </Column>
            </div>
          )}
        </div>

        {t(footer.disclaimer) && <p className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/45">{t(footer.disclaimer)}</p>}

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row">
          <p>{(t(footer.copyright) || `© {year} Passion Maths Study`).replace('{year}', year)}</p>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {(site?.navigation?.footerBottom || []).map((link) => (
              <li key={link._id}>
                <SmartLink to={link.url} newTab={link.newTab} className="hover:text-white">
                  {t(link.label)}
                </SmartLink>
              </li>
            ))}
            <li>
              <Link to="/login" className="text-white/40 hover:text-white transition-colors">
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
