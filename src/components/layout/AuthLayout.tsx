import type { ReactNode } from 'react';
import { BellRing, CalendarCheck, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const highlights = [
  { icon: CalendarCheck, title: 'Real availability', text: 'See open slots for the next two weeks and book in a few clicks.' },
  { icon: BellRing, title: 'Reminders that help', text: 'Get an email and an in-app reminder within 24 hours of your visit.' },
  { icon: ShieldCheck, title: 'Approved doctors', text: 'Doctors are approved by the clinic team before they appear in search.' },
];

interface AuthLayoutProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider form column for longer forms (registration) */
  wide?: boolean;
}

/** Split layout for sign-in, registration and account-recovery pages. */
export function AuthLayout({ title, description, children, footer, wide = false }: AuthLayoutProps) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-center lg:p-12 xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(60%_50%_at_20%_10%,hsl(168_60%_40%/0.45),transparent_70%),radial-gradient(50%_40%_at_90%_90%,hsl(40_80%_70%/0.12),transparent_70%)]"
        />
        <div className="relative max-w-sm">
          <p className="font-display text-3xl font-semibold leading-tight">Care that fits your schedule.</p>
          <ul className="mt-8 space-y-5">
            {highlights.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-3.5">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/15">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="mt-0.5 text-sm text-primary-foreground/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex items-start justify-center px-4 py-10 sm:px-6 sm:py-14 lg:items-center">
        <div className={cn('w-full', wide ? 'max-w-xl' : 'max-w-md')}>
          <div className="mb-8">
            <h1 className="font-display text-[1.875rem] font-semibold leading-tight">{title}</h1>
            {description && <p className="mt-2 text-[0.9375rem] text-muted-foreground">{description}</p>}
          </div>
          {children}
          {footer && <div className="mt-8 border-t pt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
