import { ChevronRight, LogIn, Search } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useL10n } from '@/lib/i18n';
import { useSite, useTerm } from '@/lib/site';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher.jsx';
import { Logo } from './Logo.jsx';
import { MobileMenu } from './MobileMenu.jsx';
import { SearchBar } from './SearchBar.jsx';
import { SmartLink } from './SmartLink.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';

const navLinkClass = ({ isActive }) =>
  cn(
    'inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-foreground/75 transition-colors hover:bg-muted hover:text-foreground',
    isActive && 'text-brand',
  );

function ClassesMenu({ label }) {
  const site = useSite();
  const t = useL10n();
  const term = useTerm();
  const classes = [...(site?.classes || [])].sort((a, b) => b.number - a.number);
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="h-9 bg-transparent px-3 text-sm font-semibold text-foreground/75">{label}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-[34rem] grid-cols-2 gap-1.5 p-2">
          {classes.map((cls) => (
            <Link key={cls._id} to={cls.url} className="group flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft font-heading text-sm font-extrabold text-brand">{cls.number}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold group-hover:text-brand">{t(cls.name) || `${term('class')} ${cls.number}`}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {term('ncertSolutions')} · {term('notes')}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function MobileSearch() {
  const [open, setOpen] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon-lg" className="md:hidden" aria-label="Search / खोजें">
          <Search className="size-5" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-x-0 top-0 z-50 border-b bg-background p-4 shadow-xl data-open:animate-in data-open:slide-in-from-top-4">
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <SearchBar autoFocus size="lg" onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Header() {
  const site = useSite();
  const t = useL10n();
  const header = site?.settings?.header || {};
  const items = site?.navigation?.header || [];

  return (
    <header
      className={cn(
        'z-40 border-b bg-background/88 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75',
        header.sticky !== false && 'sticky top-0',
      )}
    >
      <div className="container-page flex h-[var(--header-height)] items-center gap-3">
        <MobileMenu />
        <Logo className="mr-auto lg:mr-2" textClassName="max-w-[10.5rem] sm:max-w-none" />

        <NavigationMenu viewport={false} className="hidden lg:flex" aria-label="Main">
          <NavigationMenuList className="gap-0.5">
            {items.map((item) => {
              if (item.type === 'classes') return <ClassesMenu key={item._id} label={t(item.label)} />;
              if (item.type === 'column') {
                return (
                  <NavigationMenuItem key={item._id}>
                    <NavigationMenuTrigger className="h-9 bg-transparent px-3 text-sm font-semibold text-foreground/75">{t(item.label)}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="w-64 p-2">
                        {item.children.map((child) => (
                          <li key={child._id}>
                            <SmartLink to={child.url} newTab={child.newTab} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted">
                              {t(child.label)} <ChevronRight className="size-4 text-muted-foreground" />
                            </SmartLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              }
              return (
                <NavigationMenuItem key={item._id}>
                  {item.newTab || /^https?:/.test(item.url) ? (
                    <SmartLink to={item.url} newTab className={navLinkClass({ isActive: false })}>
                      {t(item.label)}
                    </SmartLink>
                  ) : (
                    <NavLink to={item.url || '/'} end={item.url === '/'} className={navLinkClass}>
                      {t(item.label)}
                    </NavLink>
                  )}
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {header.showSearch !== false && (
            <>
              <SearchBar className="hidden w-64 md:block xl:w-80" />
              <MobileSearch />
            </>
          )}
          {header.showLanguageSwitch !== false && <LanguageSwitcher className="hidden sm:flex" />}
          {header.showThemeSwitch !== false && <ThemeToggle />}
          {header.showLoginButton && header.loginUrl && (
            <Button asChild size="lg" className="hidden sm:inline-flex">
              <SmartLink to={header.loginUrl}>
                <LogIn /> {t(header.loginLabel) || 'Login'}
              </SmartLink>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
