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
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-[#161826] text-white dark:bg-[#070b14]">
      <div className="container-page py-12 lg:py-14">
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
            {footer.showSocial !== false && settings.social?.length > 0 && (
              <ul className="mt-5 flex gap-2" aria-label="Social links">
                {settings.social.map((s) => {
                  const IconComponent = SOCIAL_ICONS[s.platform] || Globe;
                  return (
                    <li key={s._id || s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform} className="grid size-9 place-items-center rounded-lg bg-white/10 text-white/80 hover:bg-brand hover:text-white">
                        <IconComponent className="size-4" />
                      </a>
                    </li>
                  );
                })}
              </ul>
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
          </ul>
        </div>
      </div>
    </footer>
  );
}
