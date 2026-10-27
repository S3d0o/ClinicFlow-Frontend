import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** A titled card of the encounter workspace. */
export function Panel({ icon, title, aside, children, className }: { icon: ReactNode; title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5', className)}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-title-sm text-ink">
          <span aria-hidden="true" className="text-primary">{icon}</span>
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
