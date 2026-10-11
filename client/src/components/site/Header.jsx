import { ChevronRight, LogIn, Search, Sparkles } from 'lucide-react';
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

const FALLBACK_CLASSES = [
  { number: 12, url: '/class-12/maths', label: { hi: 'कक्षा 12 गणित', en: 'Class 12 Maths' } },
  { number: 11, url: '/class-11/maths', label: { hi: 'कक्षा 11 गणित', en: 'Class 11 Maths' } },
  { number: 10, url: '/class-10/maths', label: { hi: 'कक्षा 10 गणित', en: 'Class 10 Maths' } },
  { number: 9, url: '/class-9/maths', label: { hi: 'कक्षा 9 गणित', en: 'Class 9 Maths' } },
  { number: 8, url: '/class-8/maths', label: { hi: 'कक्षा 8 गणित', en: 'Class 8 Maths' } },
  { number: 7, url: '/class-7/maths', label: { hi: 'कक्षा 7 गणित', en: 'Class 7 Maths' } },
  { number: 6, url: '/class-6/maths', label: { hi: 'कक्षा 6 गणित', en: 'Class 6 Maths' } },
];

function ClassesMenu({ label }) {
  const site = useSite();
  const t = useL10n();
  const term = useTerm();
  const rawClasses = site?.classes?.length ? site.classes : FALLBACK_CLASSES;
  const classes = [...rawClasses].sort((a, b) => b.number - a.number);
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="h-9 bg-transparent px-3 text-sm font-semibold text-foreground/75 hover:text-brand">
        {label || term('class')}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-[36rem] grid-cols-2 gap-2 p-3">
          {classes.map((cls) => (
            <Link key={cls._id || cls.number} to={cls.url} className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-muted/80">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 font-heading text-sm font-extrabold text-brand transition group-hover:bg-brand group-hover:text-white">
                {cls.number}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold group-hover:text-brand">
                  {cls.name ? t(cls.name) : (t(cls.label) || `${term('class')} ${cls.number}`)}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  NCERT हल · सूत्र · नोट्स
                </span>
              </span>
            </Link>
          ))}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function StudyMaterialsMenu() {
  const items = [
    { title: 'NCERT Solutions', sub: 'Class 6–12 step-by-step solutions', url: '/study-materials/ncert-solutions' },
    { title: 'NCERT Books', sub: 'Latest edition textbook PDFs', url: '/study-materials/ncert-books' },
    { title: 'NCERT Notes', sub: 'Key formulas & chapter summaries', url: '/study-materials/ncert-notes' },
    { title: 'CBSE Sample Papers', sub: 'Model papers & PYQ with solutions', url: '/study-materials/cbse-sample-papers' },
    { title: 'Extra Questions', sub: 'Practice questions with steps', url: '/study-materials/extra-questions' },
    { title: 'Important Questions', sub: 'High-scoring board questions', url: '/study-materials/important-questions' },
    { title: 'English Summaries', sub: 'Concept summaries & proof guides', url: '/study-materials/english-summaries' },
    { title: 'Syllabus', sub: 'Updated CBSE curriculum & marking', url: '/study-materials/syllabus' },
  ];

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="h-9 bg-transparent px-3 text-sm font-semibold text-foreground/75 hover:text-brand">
        Study Materials
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-[36rem] grid-cols-2 gap-2 p-3">
          {items.map((item) => (
            <Link key={item.url} to={item.url} className="group rounded-xl p-2.5 transition hover:bg-muted/80">
              <span className="block text-sm font-bold text-foreground group-hover:text-brand">
                {item.title}
              </span>
              <span className="block text-xs text-muted-foreground">
                {item.sub}
              </span>
            </Link>
          ))}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function ReferenceSolutionsMenu() {
  const items = [
    { title: 'RS Aggarwal Solutions', author: 'R.S. Aggarwal', sub: 'Classes 6 to 12 solutions', url: '/reference-solutions/rs-aggarwal' },
    { title: 'RD Sharma Solutions', author: 'Dr. R.D. Sharma', sub: 'Detailed question steps & proofs', url: '/reference-solutions/rd-sharma' },
    { title: 'ML Aggarwal Solutions', author: 'M.L. Aggarwal', sub: 'Understanding Mathematics solutions', url: '/reference-solutions/ml-aggarwal' },
  ];

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="h-9 bg-transparent px-3 text-sm font-semibold text-foreground/75 hover:text-brand">
        Reference Solutions
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-80 p-2 space-y-1">
          {items.map((item) => (
            <Link key={item.url} to={item.url} className="group flex items-center justify-between rounded-xl p-2.5 transition hover:bg-muted/80">
              <div>
                <span className="block text-sm font-bold text-foreground group-hover:text-brand">
                  {item.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.sub}
                </span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-brand" />
            </Link>
          ))}
          <div className="border-t pt-1.5 mt-1">
            <Link to="/reference-solutions" className="block text-center text-xs font-bold text-brand hover:underline py-1">
              Browse All Reference Books →
            </Link>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function MoreMenu() {
  const items = [
    { title: 'Search Website', url: '/search' },
    { title: 'Important Formulas', url: '/class-10/maths/prashnavali' },
    { title: 'About Passion Maths', url: '/about-us' },
    { title: 'Contact Us', url: '/contact' },
    { title: 'Privacy Policy', url: '/privacy-policy' },
  ];

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="h-9 bg-transparent px-3 text-sm font-semibold text-foreground/75 hover:text-brand">
        More
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="w-52 p-2 space-y-0.5">
          {items.map((item) => (
            <li key={item.url}>
              <Link to={item.url} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted hover:text-brand">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
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
  const term = useTerm();
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
        <Logo className="mr-auto lg:mr-2 sm:hidden" showText={false} />
        <Logo className="mr-auto lg:mr-2 hidden sm:flex" />

        <NavigationMenu viewport={false} className="hidden lg:flex" aria-label="Main">
          <NavigationMenuList className="gap-0.5">
            <ClassesMenu label={term('class')} />
            <StudyMaterialsMenu />
            <ReferenceSolutionsMenu />
            <MoreMenu />
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-2">
          {header.showLanguageSwitcher !== false && <LanguageSwitcher />}
          {header.showSearch !== false && (
            <>
              <SearchBar className="hidden w-56 md:block xl:w-72" />
              <MobileSearch />
            </>
          )}
          {header.showThemeSwitch !== false && <ThemeToggle />}
          {header.showLoginButton && header.loginUrl ? (
            <Button asChild size="default" className="hidden sm:inline-flex">
              <SmartLink to={header.loginUrl}>
                <LogIn className="size-4" /> {t(header.loginLabel) || 'Login'}
              </SmartLink>
            </Button>
          ) : (
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <Link to="/login">
                <LogIn className="size-3.5" /> Admin
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
