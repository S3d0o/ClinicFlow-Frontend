import { History, MailCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatInstant } from '@/shared/lib/intl';
import type { StageChange } from '../model/application';

/** The application's history, newest first, with whether each stage email went out (FR-REC-04). */
export function ApplicationHistory({ history }: { history: StageChange[] }) {
  const { t } = useTranslation('recruitment');
  const { language } = useLanguage();

  const titleOf = (change: StageChange) =>
    change.fromStatus === 'Interview' && change.toStatus === 'Interview' ? t('mine.historyEntry.InterviewRescheduled') : t(`mine.historyEntry.${change.toStatus}`);

  return (
    <section aria-labelledby="history-title" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 id="history-title" className="mb-4 flex items-center gap-2 font-display text-headline-md text-ink">
        <History aria-hidden="true" className="size-5 text-primary" />
        {t('mine.history')}
      </h2>
      <ol className="relative space-y-6 border-s-2 border-border ps-6">
        {history.map((change) => (
          <li key={change.id} className="relative">
            <span aria-hidden="true" className="absolute -start-[1.95rem] top-1 size-3.5 rounded-full border-2 border-primary bg-card" />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-title-sm font-display text-ink">{titleOf(change)}</h3>
              <time dateTime={change.changedAt} className="text-body-sm text-muted-foreground">
                {formatInstant(change.changedAt, language, 'Africa/Cairo', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </time>
            </div>
            {change.interview && (
              <p className="text-body-md text-muted-foreground">
                {formatInstant(change.interview.at, language, 'Africa/Cairo', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {change.interview.interviewerName}
              </p>
            )}
            {change.message && <p className="text-body-md text-muted-foreground">{change.message}</p>}
            {change.emailSent && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-info/25 bg-info/10 px-2 py-0.5 text-caption text-info">
                <MailCheck aria-hidden="true" className="size-3.5" />
                {t('mine.emailSent')}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
