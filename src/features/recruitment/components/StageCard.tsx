import type { ReactNode } from 'react';
import { CalendarPlus, CalendarDays, MapPin, Navigation, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Branch } from '@/features/org/model/branch';
import { branchName } from '@/features/org/model/branch-access';
import { useLanguage } from '@/shared/i18n/use-language';
import { todayIn } from '@/shared/lib/branch-time';
import { formatDay, formatInstant } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import type { DoctorApplication, InterviewDetails } from '../model/application';
import { buildIcs } from '../model/calendar';

const longDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } as const;

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-label-sm uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
        <div className="text-body-md text-foreground">{children}</div>
      </div>
    </div>
  );
}

const download = (fileName: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  Object.assign(document.createElement('a'), { href: url, download: fileName }).click();
  URL.revokeObjectURL(url);
};

function InterviewCard({ application, interview, branches }: { application: DoctorApplication; interview: InterviewDetails; branches: Branch[] }) {
  const { t } = useTranslation('recruitment');
  const { language } = useLanguage();
  const branch = branches.find((b) => b.id === interview.branchId);
  const timeZone = branch?.timeZone ?? 'Africa/Cairo';
  const address = branch ? (language === 'ar' ? branch.addressAr : branch.addressEn) : interview.location;
  const place = branch ? `${branchName(branch, language)}, ${address}` : (interview.location ?? '');

  return (
    <div className="space-y-5">
      <div className="grid gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
        <Detail icon={<CalendarDays className="size-5" />} label={t('mine.dateTime')}>
          <p className="font-semibold">{formatInstant(interview.at, language, timeZone, longDate)}</p>
          <p className="text-body-sm text-muted-foreground">
            {t('mine.branchTime', { time: formatInstant(interview.at, language, timeZone, { hour: 'numeric', minute: '2-digit' }) })}
          </p>
        </Detail>
        <Detail icon={<MapPin className="size-5" />} label={t('mine.location')}>
          {branch && <p className="font-semibold">{branchName(branch, language)}</p>}
          <p className="text-body-sm text-muted-foreground">{address}</p>
        </Detail>
        <Detail icon={<UserRound className="size-5" />} label={t('mine.interviewer')}>
          <p className="font-semibold">{interview.interviewerName}</p>
        </Detail>
      </div>
      {interview.notes && (
        <div className="rounded-xl border border-warning/25 bg-warning/10 p-4 text-body-md text-warning">
          <p className="font-semibold">{t('mine.notes')}</p>
          <p dir="auto" className="text-start">{interview.notes}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() =>
            download(
              'clinicflow-interview.ics',
              buildIcs({ uid: `${application.id}-${interview.at}`, title: t('mine.calendarTitle'), start: interview.at, durationMinutes: 60, location: place, description: interview.notes }),
              'text/calendar'
            )
          }
        >
          <CalendarPlus aria-hidden="true" />
          {t('mine.addToCalendar')}
        </Button>
        {address && (
          <Button asChild variant="link">
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`} target="_blank" rel="noreferrer">
              <Navigation aria-hidden="true" />
              {t('mine.directions')}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

/** What the applicant needs to know at the current stage (FR-REC-06). */
export function StageCard({ application, branches }: { application: DoctorApplication; branches: Branch[] }) {
  const { t } = useTranslation('recruitment');
  const { language } = useLanguage();
  const reapply = application.canReapplyFrom && (
    <p className="text-body-md text-muted-foreground">
      {t('mine.reapply', { date: formatDay(application.canReapplyFrom, language, { day: 'numeric', month: 'long', year: 'numeric' }) })}
    </p>
  );

  let title: string;
  let body: ReactNode;
  switch (application.status) {
    case 'Applied':
      title = t('mine.appliedTitle');
      body = <p className="text-body-md text-muted-foreground">{t('mine.appliedBody')}</p>;
      break;
    case 'Interview':
      title = t('mine.interviewTitle');
      body = application.interview && <InterviewCard application={application} interview={application.interview} branches={branches} />;
      break;
    case 'Accepted': {
      const branch = branches.find((b) => b.id === application.acceptance?.branchId);
      title = t('mine.acceptedTitle');
      body = (
        <div className="space-y-4">
          <p className="text-body-md text-muted-foreground">{t('mine.acceptedBody')}</p>
          {application.acceptance && (
            <dl className="grid gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-label-sm uppercase text-muted-foreground">{t('mine.startDate')}</dt>
                <dd className="font-semibold">{formatDay(application.acceptance.startDate, language, longDate)}</dd>
              </div>
              <div>
                <dt className="text-label-sm uppercase text-muted-foreground">{t('mine.branch')}</dt>
                <dd className="font-semibold">{branch ? branchName(branch, language) : ''}</dd>
              </div>
              {application.acceptance.notes && <dd className="text-body-md sm:col-span-2">{application.acceptance.notes}</dd>}
            </dl>
          )}
        </div>
      );
      break;
    }
    case 'Rejected': {
      const message = application.history.find((h) => h.toStatus === 'Rejected')?.message;
      title = t('mine.rejectedTitle');
      body = (
        <div className="space-y-3">
          <p className="text-body-md text-muted-foreground">{message ?? t('mine.rejectedBody')}</p>
          {reapply}
        </div>
      );
      break;
    }
    case 'Withdrawn':
      title = t('mine.withdrawnTitle');
      body = reapply;
      break;
  }

  return (
    <section aria-labelledby="stage-title" className="space-y-4 rounded-2xl border border-border border-t-4 border-t-primary bg-card p-5 shadow-card sm:p-6">
      <h2 id="stage-title" className="font-display text-headline-md text-ink">
        {title}
      </h2>
      {body}
      {(application.status === 'Rejected' || application.status === 'Withdrawn') &&
        (!application.canReapplyFrom || application.canReapplyFrom <= todayIn('Africa/Cairo')) && (
        <Button asChild>
          <Link to="/join">{t('mine.applyAgain')}</Link>
        </Button>
      )}
    </section>
  );
}
