import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/Logo';
import { navByRole } from '@/lib/navigation';
import { cn } from '@/lib/utils';

/** Top navigation for signed-out visitors. Signed-in users get the sidebar in `shell/AppShell`. */
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = navByRole.Guest;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-label-md transition-colors',
                  isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register/patient">Create account</Link>
            </Button>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm gap-0 p-0">
              <SheetHeader className="border-b border-border/70 p-5">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
                <Logo asLink={false} />
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 p-3">
                {[{ label: 'Home', to: '/' }, ...navItems].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium transition-colors',
                        isActive ? 'bg-secondary font-semibold text-secondary-foreground' : 'text-foreground hover:bg-accent'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-auto grid gap-2 border-t border-border/70 p-4">
                <Button asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/register/patient">Create account</Link>
                </Button>
                <Button variant="outline" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
