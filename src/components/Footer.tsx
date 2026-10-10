import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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

function BottomBar() {
  return (
    <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>© {new Date().getFullYear()} ClinicFlow. Built with .NET &amp; React.</p>
      <a
        href="https://github.com/S3d0o/ClinicFlow"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        <Github className="size-3.5" aria-hidden="true" />
        View on GitHub
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}

export function Footer() {
  const { isAuthenticated } = useAuth();

  // Signed-in users are working in the app; sign-up links would be noise
  if (isAuthenticated) {
    return (
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <BottomBar />
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Find a specialist, see real availability, and book a confirmed clinic appointment — then manage it all in one place.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-semibold">{col.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 border-t pt-6">
          <BottomBar />
        </div>
      </div>
    </footer>
  );
}
