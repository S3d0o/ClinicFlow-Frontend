import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  /** Buttons shown at the end of the header (start on mobile). */
  actions?: ReactNode;
  className?: string;
}

/** The title row every screen starts with. Renders the page's only <h1>. */
export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-display text-headline-lg text-ink sm:text-headline-xl">{title}</h1>
        {description && <p className="text-body-md text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
