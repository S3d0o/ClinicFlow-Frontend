import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

/** Calendar-style date tile for a "yyyy-MM-dd" date (month, day, weekday). */
export function DateTile({ date, muted = false, className }: { date: string; muted?: boolean; className?: string }) {
  const d = parseISO(date);
  return (
    <time
      dateTime={date}
      className={cn(
        'flex w-14 shrink-0 flex-col items-center justify-center self-start rounded-xl py-2 text-center',
        muted ? 'bg-muted text-muted-foreground' : 'bg-secondary text-secondary-foreground',
        className
      )}
    >
      <span className="text-label-sm uppercase tracking-wider">{format(d, 'MMM')}</span>
      <span className="font-display text-headline-lg leading-none">{format(d, 'd')}</span>
      <span className="mt-0.5 text-caption font-medium">{format(d, 'EEE')}</span>
    </time>
  );
}
