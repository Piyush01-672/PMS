import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { useL10n } from '@/lib/i18n';
import { useSite, useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher.jsx';
import { Logo } from './Logo.jsx';
import { SearchBar } from './SearchBar.jsx';
import { SmartLink } from './SmartLink.jsx';

function ClassAccordion({ cls, open, onToggle }) {
  const t = useL10n();
  const term = useTerm();
  const id = useId();
  const title = t(cls.name) || `${term('class')} ${cls.number} ${term('mathematics')}`;
  return (
    <li className="border-b last:border-b-0">
      <button
        id={`${id}-trigger`}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center justify-between gap-3 px-1 py-3.5 text-left text-[15px] font-semibold"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-xs font-extrabold text-brand">{cls.number}</span>
          {title}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="size-5 text-muted-foreground" aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-trigger`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            {cls.subjects.map((subject) => {
              const links = [
                { label: term('ncertSolutions'), url: subject.url },
                { label: term('chapterWise'), url: `${subject.url}#chapters` },
                { label: term('exerciseWise'), url: `${subject.url}/prashnavali` },
                { label: term('importantQuestions'), url: `${subject.url}/important-questions` },
                { label: term('notes'), url: `${subject.url}/notes` },
              ];
              return (
                <ul key={subject._id} className="mb-3 ml-4 space-y-0.5 border-l-2 border-brand/20 pl-4">
                  {cls.subjects.length > 1 && <li className="pb-1 text-xs font-bold text-muted-foreground uppercase">{t(subject.name)}</li>}
                  {links.map((link) => (
                    <li key={link.url}>
                      <Link to={link.url} className="block rounded-md px-2 py-2 text-sm text-foreground/85 hover:bg-muted hover:text-brand">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function MobileMenu() {
  const site = useSite();
  const t = useL10n();
  const term = useTerm();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const classes = [...(site?.classes || [])].sort((a, b) => b.number - a.number);
  const links = (site?.navigation?.header || []).filter((item) => item.type === 'link');

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open menu / मेनू खोलें">
          <Menu className="size-6" />
        </Button>
      </DialogPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col bg-background shadow-2xl outline-none"
              >
                <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                  <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">Mathematics classes and links</DialogPrimitive.Description>
                  <Logo textClassName="max-w-[11rem]" />
                  <DialogPrimitive.Close asChild>
                    <Button variant="outline" size="lg" className="shrink-0 gap-1.5" aria-label="Close menu / बंद करें">
                      <X className="size-5" /> <span className="text-xs font-semibold">Close</span>
                    </Button>
                  </DialogPrimitive.Close>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                  <SearchBar onNavigate={() => setOpen(false)} />
                  {site?.settings?.header?.showLanguageSwitch !== false && (
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">भाषा / Language</span>
                      <LanguageSwitcher />
                    </div>
                  )}

                  {links.length > 0 && (
                    <nav aria-label="Main" className="mt-5 grid grid-cols-2 gap-2">
                      {links.map((item) => (
                        <SmartLink
                          key={item._id}
                          to={item.url}
                          newTab={item.newTab}
                          className={cn('rounded-lg border bg-card px-3 py-2.5 text-sm font-medium hover:border-brand/40 hover:text-brand', location.pathname === item.url && 'border-brand/50 text-brand')}
                        >
                          {t(item.label)}
                        </SmartLink>
                      ))}
                    </nav>
                  )}

                  <p className="mt-6 mb-1 text-xs font-extrabold tracking-[0.14em] text-brand uppercase">{term('mathematics')}</p>
                  <ul>
                    {classes.map((cls) => (
                      <ClassAccordion key={cls._id} cls={cls} open={expanded === cls._id} onToggle={() => setExpanded((id) => (id === cls._id ? null : cls._id))} />
                    ))}
                  </ul>
                </div>
              </motion.aside>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
