import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface AuthCardProps {
  /** A small label above the title ("Password recovery", "Staff security check"). */
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  centered?: boolean;
  children: ReactNode;
  /** Shown under the card (alternative paths, help). */
  after?: ReactNode;
}

/** The card every account screen sits in. Renders the page's only <h1>. */
export function AuthCard({ eyebrow, title, intro, centered, children, after }: AuthCardProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <header className={cn('mb-6 space-y-2', centered && 'text-center')}>
          {eyebrow && (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-highlight/25 bg-highlight/10 px-2.5 py-0.5 text-label-sm uppercase tracking-[0.06em] text-highlight-strong">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-headline-lg text-ink sm:text-headline-xl">{title}</h1>
          {intro && <p className="text-body-md text-muted-foreground">{intro}</p>}
        </header>
        {children}
      </section>
      {after}
    </div>
  );
}
