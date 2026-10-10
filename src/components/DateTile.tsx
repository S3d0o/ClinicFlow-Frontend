import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

/** Calendar-style date tile for a "yyyy-MM-dd" date (month, day, weekday). */
export function DateTile({ date, muted = false, className }: { date: string; muted?: boolean; className?: string }) {
  const d = parseISO(date);
  return (
    <div
      className={cn(
        'flex w-14 shrink-0 flex-col items-center justify-center self-start rounded-lg border py-1.5 text-center',
        muted ? 'bg-muted/60 text-muted-foreground' : 'bg-secondary/60 text-secondary-foreground',
        className
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider">{format(d, 'MMM')}</span>
      <span className="text-xl font-semibold leading-tight tabular-nums">{format(d, 'd')}</span>
      <span className="text-[10px] font-medium">{format(d, 'EEE')}</span>
    </div>
  );
}
