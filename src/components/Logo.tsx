import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

/** ClinicFlow mark + wordmark. Links home unless `asLink` is false. */
export function Logo({ className, inverted = false, asLink = true }: { className?: string; inverted?: boolean; asLink?: boolean }) {
  const content = (
    <>
      <span
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-lg',
          inverted ? 'bg-white/10 text-white ring-1 ring-inset ring-white/20' : 'bg-primary text-primary-foreground'
        )}
      >
        <Stethoscope className="size-[1.125rem]" aria-hidden="true" />
      </span>
      <span className={cn('font-display text-xl font-semibold leading-none', inverted ? 'text-white' : 'text-foreground')}>
        ClinicFlow
      </span>
    </>
  );
  if (!asLink) return <span className={cn('inline-flex items-center gap-2.5', className)}>{content}</span>;
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5 rounded-md', className)} aria-label="ClinicFlow home">
      {content}
    </Link>
  );
}
