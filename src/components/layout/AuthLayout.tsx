import type { ReactNode } from 'react';
import { BellRing, CalendarCheck, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
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

/** Two-card layout for sign-in, registration and account recovery: brand panel + form panel. */
export function AuthLayout({ title, description, children, footer, wide = false }: AuthLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className={cn('grid items-start gap-6 lg:gap-8', wide ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : 'lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]')}>
        <aside className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card lg:sticky lg:top-24 lg:flex lg:flex-col">
          <div className="p-8">
            <Logo asLink={false} />
            <p className="mt-8 font-display text-headline-xl text-foreground">Care that fits your schedule.</p>
            <p className="mt-2 text-body-md text-muted-foreground">
              One place to find a specialist, book a confirmed visit and keep track of every appointment.
            </p>

            <div className="mt-8 rounded-xl bg-muted p-5">
              <p className="eyebrow">Why ClinicFlow</p>
              <ul className="mt-4 space-y-4">
                {highlights.map(({ icon: Icon, title: t, text }) => (
                  <li key={t} className="flex gap-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-xs">
                      <Icon className="size-[1.125rem]" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-label-md text-foreground">{t}</p>
                      <p className="mt-1 text-body-sm text-muted-foreground">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-card sm:p-10">
          <div className={cn('mx-auto w-full', wide ? 'max-w-xl' : 'max-w-md')}>
            <div className="mb-8">
              <h1 className="font-display text-headline-lg text-foreground sm:text-headline-xl">{title}</h1>
              {description && <p className="mt-2 text-body-md text-muted-foreground">{description}</p>}
            </div>
            {children}
            {footer && <div className="mt-8 border-t border-border/70 pt-6 text-body-md text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
