import { AlarmClock, AlertCircle, MessageSquareWarning, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatMoney } from '@/shared/lib/intl';
import { minutesLate, type needsAction } from '../model/day';

interface NeedsActionPanelProps {
  items: ReturnType<typeof needsAction>;
  now: Date;
  canCollect: boolean;
}

/** Late arrivals, visits the patient hasn't confirmed and visits still to pay (U2, U7). */
export function NeedsActionPanel({ items, now, canCollect }: NeedsActionPanelProps) {
  const { t } = useTranslation('desk');
  const { language } = useLanguage();
  const { late, unconfirmed, unpaid, total } = items;

  return (
    <section aria-labelledby="needs-action" className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <h2 id="needs-action" className="flex items-center gap-2 text-title-sm text-ink">
        <AlertCircle aria-hidden="true" className={total ? 'size-5 text-highlight' : 'size-5 text-muted-foreground'} />
        {t('needsAction.title', { count: total })}
      </h2>
      {total === 0 ? (
        <p className="mt-2 text-body-md text-muted-foreground">{t('needsAction.none')}</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2 text-body-sm">
          {late.length > 0 && (
            <li className="flex flex-wrap items-center gap-1.5 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-destructive">
              <AlarmClock aria-hidden="true" className="size-4" />
              <span className="font-semibold">{t('needsAction.late', { count: late.length })}</span>
              {late.map((visit, index) => (
                <span key={visit.id}>
                  <bdi dir="auto">{visit.patient.fullName}</bdi> ({t('needsAction.minutes', { count: minutesLate(visit, now) })}){index < late.length - 1 && ','}
                </span>
              ))}
            </li>
          )}
          {unconfirmed.length > 0 && (
            <li className="flex flex-wrap items-center gap-1.5 rounded-lg border border-info/25 bg-info/10 px-3 py-2 text-info">
              <MessageSquareWarning aria-hidden="true" className="size-4" />
              <span className="font-semibold">{t('needsAction.unconfirmed', { count: unconfirmed.length })}</span>
              <span>
                {unconfirmed.map((visit, index) => (
                  <span key={visit.id}>
                    <bdi dir="auto">{visit.patient.fullName}</bdi>
                    {index < unconfirmed.length - 1 && ', '}
                  </span>
                ))}
              </span>
            </li>
          )}
          {unpaid.map((visit) => (
            <li key={visit.id} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-warning">
              <Wallet aria-hidden="true" className="size-4" />
              <span className="font-semibold">{t('needsAction.unpaid', { amount: formatMoney(visit.amountDue, language) })}</span>
              <bdi dir="auto">({visit.patient.fullName})</bdi>
              {canCollect && (
                <Link to={`/desk/payments?visit=${visit.id}`} className="font-semibold underline underline-offset-2">
                  {t('needsAction.collect')}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
