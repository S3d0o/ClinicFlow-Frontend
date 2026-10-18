import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const widths = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-6xl',
  full: 'max-w-7xl',
} as const;

interface PageProps {
  width?: keyof typeof widths;
  className?: string;
  children: ReactNode;
}

/** Standard page container: consistent width, gutters and vertical rhythm. */
export function Page({ width = 'default', className, children }: PageProps) {
  return <div className={cn('mx-auto w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8', widths[width], className)}>{children}</div>;
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  className?: string;
}

/** Page title block: optional back link, uppercase eyebrow, display title, description and actions. */
export function PageHeader({ title, description, eyebrow, actions, back, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-8', className)}>
      {back && (
        <Link
          to={back.to}
          className="mb-4 inline-flex items-center gap-1.5 text-label-md text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="mb-2 text-label-sm uppercase tracking-[0.08em] text-primary">{eyebrow}</p>}
          <h1 className="font-display text-headline-lg text-foreground sm:text-headline-xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-body-md text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** A titled group of content inside a page. */
export function Section({ title, description, actions, children, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="font-display text-headline-md text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-body-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
