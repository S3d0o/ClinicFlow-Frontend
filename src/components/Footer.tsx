import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

const columns = [
  {
    title: 'For patients',
    links: [
      { label: 'Find a doctor', to: '/doctors' },
      { label: 'Create an account', to: '/register/patient' },
      { label: 'Sign in', to: '/login' },
    ],
  },
  {
    title: 'For doctors',
    links: [
      { label: 'Join as a doctor', to: '/register/doctor' },
      { label: 'Doctor sign in', to: '/login' },
    ],
  },
];

/** Footer for signed-out visitors (signed-in pages use the slim footer in `shell/AppShell`). */
export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-body-md text-muted-foreground">
              Find a specialist, see real availability, and book a confirmed clinic appointment — then manage it all in one place.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="eyebrow">{col.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-body-md text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 border-t border-border/70 pt-6 text-body-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ClinicFlow</p>
        </div>
      </div>
    </footer>
  );
}
