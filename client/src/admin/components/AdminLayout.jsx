import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, LogOut, Menu, ShieldCheck, UserCog, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/site/ThemeToggle.jsx';
import { adminUrl } from '@/lib/config';
import { failSafe, gsap, shouldAnimate, useGSAP } from '@/lib/motion';
import { useBrand } from '@/lib/site';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '../lib/auth.jsx';
import { ConfirmProvider } from './ConfirmDialog.jsx';
import { NAV_GROUPS } from './nav.js';

function SidebarNav({ onNavigate }) {
  const { can } = useAdminAuth();
  const brand = useBrand();
  return (
    <div className="flex h-full flex-col">
      <Link to={adminUrl('')} onClick={onNavigate} className="flex items-center gap-2.5 border-b px-4 py-4">
        <span className="grid size-10 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
          <img src={brand.logoSrc} alt="" className="size-full object-contain" />
        </span>
        <span className="leading-tight">
          <span className="block font-heading text-sm font-extrabold">PMS Admin</span>
          <span className="block text-[11px] text-muted-foreground">Content Management</span>
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Admin">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.permission || can(item.permission));
          if (!items.length) return null;
          return (
            <div key={group.label} className="mb-4">
              <p className="px-3 pb-1.5 text-[10px] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">{group.label}</p>
              <ul className="space-y-0.5">
                {items.map(({ to, label, icon: IconComponent, end }) => (
                  <li key={to}>
                    <NavLink
                      to={adminUrl(to)}
                      end={end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground',
                          isActive && 'bg-brand-soft font-semibold text-brand hover:bg-brand-soft hover:text-brand',
                        )
                      }
                    >
                      <IconComponent className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open admin menu">
          <Menu className="size-5" />
        </Button>
      </DialogPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-2xl"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              >
                <DialogPrimitive.Title className="sr-only">Admin navigation</DialogPrimitive.Title>
                <DialogPrimitive.Close asChild>
                  <Button variant="ghost" size="icon" className="absolute top-4 right-3 z-10" aria-label="Close menu">
                    <X />
                  </Button>
                </DialogPrimitive.Close>
                <SidebarNav onNavigate={() => setOpen(false)} />
              </motion.aside>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export function AdminLayout({ children }) {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const mainRef = useRef(null);

  useGSAP(
    () => {
      if (!shouldAnimate() || !mainRef.current) return undefined;
      gsap.fromTo(mainRef.current, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power1.out', clearProps: 'opacity,visibility,transform' });
      return failSafe(mainRef.current, 1000);
    },
    { dependencies: [location.pathname] },
  );

  const initials = (admin?.name || 'A')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ConfirmProvider>
      <meta name="robots" content="noindex,nofollow" />
      <title>PMS Admin</title>
      <div className="min-h-dvh bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:block">
          <SidebarNav />
        </aside>
        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur sm:px-5">
            <MobileSidebar />
            <div className="flex-1" />
            <Button asChild variant="ghost" size="lg" className="hidden sm:inline-flex">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink /> View website
              </a>
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-muted" aria-label="Account menu">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-brand text-xs font-bold text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left text-xs leading-tight sm:block">
                    <span className="block font-semibold">{admin?.name}</span>
                    <span className="block text-muted-foreground capitalize">{admin?.role}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{admin?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={adminUrl('account')}>
                    <UserCog /> My account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={adminUrl('account')}>
                    <ShieldCheck /> Two-factor {admin?.totpEnabled ? 'enabled' : 'setup'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout} variant="destructive">
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main ref={mainRef} className="mx-auto w-full max-w-[1400px] px-3 py-5 sm:px-6 sm:py-7">
            {children}
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
