import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/** A tappable row leading to another flow ("New to ClinicFlow? Create a patient account"). */
export function LinkRow({ to, icon, title, hint, state }: { to: string; icon: ReactNode; title: string; hint: string; state?: unknown }) {
  return (
    <Link
      to={to}
      state={state}
      className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
    >
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-label-md text-foreground">{title}</span>
        <span className="block text-body-sm text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight aria-hidden="true" className="rtl-flip size-4 text-muted-foreground" />
    </Link>
  );
}
