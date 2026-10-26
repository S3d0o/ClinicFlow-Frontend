import { AlertTriangle, Clock, Footprints, Megaphone, MoreVertical, Star, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { bloodPressure } from '@/features/triage/model/vitals';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { StatusChip } from '@/shared/ui/StatusChip';
import { LONG_WAIT_MINUTES, minutesInStage, type QueueEntry } from '../model/queue';
import { TicketBadge } from './TicketBadge';

export interface QueueCardActions {
  /** Calls the patient into the room (`queue.manage`). */
  onCall?: (entry: QueueEntry) => void;
  onMoveToFront?: (entry: QueueEntry) => void;
  /** Takes payments (`payments.collect`): done visits link to the checkout. */
  canCollect: boolean;
  calling?: string | null;
}

/** One visit on the queue board (design front-desk/05): ticket, patient, doctor and what's next. */
export function QueueCard({ entry, now, actions }: { entry: QueueEntry; now: Date; actions: QueueCardActions }) {
  const { t } = useTranslation('queue');
  const { language } = useLanguage();
  const { specialtyLabel } = useLookups();
  const minutes = minutesInStage(entry, now);
  const waitingStage = entry.stage === 'WaitingTriage' || entry.stage === 'ReadyForDoctor';
  const longWait = waitingStage && minutes >= LONG_WAIT_MINUTES;
  const bp = entry.vitals && bloodPressure(entry.vitals);
  const canMove = waitingStage && !!actions.onMoveToFront;

  return (
    <article
      className={cn(
        'space-y-2.5 rounded-xl border bg-card p-3 shadow-card',
        longWait ? 'border-warning ring-1 ring-warning/40' : entry.priorityReason ? 'border-highlight/60' : 'border-border',
        entry.stage === 'Done' && entry.amountDue === 0 && 'opacity-75'
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <TicketBadge ticket={entry.ticketNo} />
          {entry.source === 'WalkIn' && (
            <StatusChip tone="highlight">
              <Footprints aria-hidden="true" className="size-3" />
              {t('card.walkIn')}
            </StatusChip>
          )}
          {entry.lateMinutes > 0 && <StatusChip tone="danger">{t('card.late', { minutes: entry.lateMinutes })}</StatusChip>}
        </div>
        {canMove && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('card.more', { ticket: entry.ticketNo })}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => actions.onMoveToFront?.(entry)}>{t('card.moveToFront')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <div className="min-w-0">
        <h3 className="truncate text-title-sm text-ink"><bdi>{entry.patientName}</bdi></h3>
        <p className="truncate text-body-sm text-primary">
          {entry.doctorName} · {specialtyLabel(entry.specialtyId)}
        </p>
      </div>

      {entry.priorityReason && (
        <p className="flex items-start gap-1.5 rounded-lg bg-highlight/10 px-2 py-1.5 text-body-sm text-highlight-strong">
          <Star aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t('card.priority')}: <bdi dir="auto">{entry.priorityReason}</bdi>
          </span>
        </p>
      )}
      {entry.stage === 'WaitingTriage' && entry.complaint && (
        <p dir="auto" className="rounded-lg bg-muted px-2 py-1.5 text-body-sm text-foreground">{entry.complaint}</p>
      )}
      {entry.stage === 'ReadyForDoctor' && (bp || entry.vitals?.pulse) && (
        <p className="rounded-lg bg-muted px-2 py-1.5 text-body-sm text-foreground">
          {t('card.vitals')}:{' '}
          <bdi dir="ltr">
            {[bp && `BP ${bp}`, entry.vitals?.pulse && `HR ${entry.vitals.pulse}`].filter(Boolean).join(' · ')}
          </bdi>
        </p>
      )}

      <footer className="flex min-h-9 items-center justify-between gap-2 border-t border-border pt-2 text-body-sm">
        {entry.stage === 'WithDoctor' ? (
          <span className="flex items-center gap-1.5 text-info">
            <Stethoscope aria-hidden="true" className="size-4" />
            {t('card.inRoom', { minutes, room: entry.room ? nameIn(entry.room, language) : '' })}
          </span>
        ) : entry.stage === 'Done' ? (
          entry.amountDue > 0 ? (
            <span className="font-medium text-warning">{t('card.toPay', { amount: formatMoney(entry.amountDue, language) })}</span>
          ) : (
            <span className="text-success">{t('card.paid')}</span>
          )
        ) : (
          <span className={cn('flex items-center gap-1.5', longWait ? 'font-semibold text-warning' : 'text-muted-foreground')}>
            {longWait ? <AlertTriangle aria-hidden="true" className="size-4" /> : <Clock aria-hidden="true" className="size-4" />}
            {t('card.waiting', { minutes })}
          </span>
        )}

        {entry.stage === 'ReadyForDoctor' && actions.onCall && (
          <Button size="sm" variant="strong" disabled={actions.calling === entry.appointmentId} onClick={() => actions.onCall?.(entry)}>
            <Megaphone aria-hidden="true" />
            {t('card.call')}
          </Button>
        )}
        {entry.stage === 'Done' && entry.amountDue > 0 && actions.canCollect && (
          <Button asChild size="sm">
            <Link to={`/desk/payments?visit=${entry.appointmentId}`}>{t('card.checkout')}</Link>
          </Button>
        )}
      </footer>
    </article>
  );
}
