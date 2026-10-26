import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';

/** A queue ticket ("A-14") as printed on the slip and shown on the waiting-room screen. */
export function TicketBadge({ ticket, size = 'md', className }: { ticket: string; size?: 'md' | 'lg'; className?: string }) {
  const { t } = useTranslation('queue');
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md bg-ink font-display tabular-nums text-ink-foreground',
        size === 'lg' ? 'px-3 py-1.5 text-headline-md' : 'px-2 py-0.5 text-label-md',
        className
      )}
    >
      <span className="sr-only">{t('ticket')} </span>
      <bdi dir="ltr">{ticket}</bdi>
    </span>
  );
}
