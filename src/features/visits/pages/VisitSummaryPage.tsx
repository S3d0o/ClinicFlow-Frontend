import type { ReactNode } from 'react';
import { ArrowLeft, CalendarDays, CalendarPlus, Clock, Download, FileText, FlaskConical, Hash, ListChecks, MapPin, Stethoscope } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatDay, formatInstant } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { useDownloadPrescription, useVisit } from '../hooks/use-visits';

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-display text-title-sm text-ink">
        {icon}
        {title}
      </h2>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">{children}</div>
    </section>
  );
}

/** One visit's summary for the patient (design patient/14, FR-EMR-13): findings, medicines, tests, advice. */
export default function VisitSummaryPage() {
  const { t } = useTranslation(['records', 'screens']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const { visitId = '' } = useParams();
  const visit = useVisit(visitId);
  const download = useDownloadPrescription();
  const { branch, branchLabel, specialtyLabel } = useLookups();

  if (visit.isPending) return <LoadingState />;
  if (visit.isError) return <ErrorState onRetry={() => void visit.refetch()} />;

  const summary = visit.data;
  const timeZone = branch(summary.branchId)?.timeZone ?? 'Africa/Cairo';
  const day = (date: string) => formatDay(date, language, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label={t('summary.back')}>
          <Link to="/patient/visits">
            <ArrowLeft className="rtl-flip" />
          </Link>
        </Button>
        <h1 className="font-display text-headline-md text-ink">{t('screens:visitSummary')}</h1>
      </header>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Stethoscope className="size-5" />
          </span>
          <div>
            <p className="font-display text-title-sm text-ink">{summary.doctorName}</p>
            <p className="text-body-sm text-muted-foreground">{specialtyLabel(summary.specialtyId)}</p>
          </div>
        </div>
        <div className="space-y-2 border-t border-border pt-3 text-body-md">
          <p className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />
            <span>{formatInstant(summary.startsAtUtc, language, timeZone, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-4 text-muted-foreground" />
            <span>{branchLabel(summary.branchId)}</span>
          </p>
          <p className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Hash aria-hidden="true" className="size-4" />
              {t('summary.reference')}
            </span>
            <bdi dir="ltr" className="rounded-md border border-border px-2 font-mono text-body-sm">
              {summary.appointmentReference}
            </bdi>
          </p>
        </div>
      </section>

      <Section title={t('summary.found')} icon={<Stethoscope aria-hidden="true" className="size-4 text-primary" />}>
        {summary.diagnoses.map((diagnosis) => (
          <p key={diagnosis} dir="auto" className="text-start font-display text-title-sm text-ink">
            {diagnosis}
          </p>
        ))}
        {summary.findings && (
          <p dir="auto" className="text-start text-body-md text-muted-foreground">
            {summary.findings}
          </p>
        )}
      </Section>

      <Section title={t('summary.medicines')} icon={<FileText aria-hidden="true" className="size-4 text-primary" />}>
        {summary.prescriptions.length === 0 ? (
          <p className="text-body-md text-muted-foreground">{t('summary.noMedicines')}</p>
        ) : (
          <>
            {summary.prescriptionCode && (
              <p className="w-fit rounded-full bg-secondary px-3 py-1 text-caption text-primary">
                <Trans t={t} i18nKey="summary.rxCode" values={{ code: summary.prescriptionCode }} components={{ code: <bdi dir="ltr" className="font-mono" /> }} />
              </p>
            )}
            <ul className="space-y-3">
              {summary.prescriptions.map((rx) => (
                <li key={`${rx.drug}-${rx.strength}`} dir="auto" className="space-y-1 rounded-xl border border-border p-3 text-start">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-title-sm font-display text-ink">
                      {rx.drug} {rx.strength}
                      {rx.genericName && <span className="text-body-sm font-normal text-muted-foreground"> ({rx.genericName})</span>}
                    </p>
                    {rx.durationDays && <span className="shrink-0 text-label-md text-primary">{t('summary.days', { count: rx.durationDays })}</span>}
                  </div>
                  <p className="flex items-center gap-1.5 text-body-sm text-foreground">
                    <Clock aria-hidden="true" className="size-4 text-muted-foreground" />
                    {rx.dosage}
                  </p>
                  {rx.instructions && <p className="border-s-2 border-primary ps-2 text-body-sm text-muted-foreground">{rx.instructions}</p>}
                </li>
              ))}
            </ul>
            {download.isError && <FormAlert>{errorMessage(download.error)}</FormAlert>}
            <Button
              variant="outline"
              className="w-full"
              disabled={download.isPending}
              onClick={() => download.mutate({ visitId: summary.id, fileName: `prescription-${summary.prescriptionCode ?? summary.id}.pdf` })}
            >
              <Download aria-hidden="true" />
              {t('summary.downloadRx')}
            </Button>
          </>
        )}
      </Section>

      {summary.orders.length > 0 && (
        <Section title={t('summary.tests')} icon={<FlaskConical aria-hidden="true" className="size-4 text-primary" />}>
          <ul className="divide-y divide-border">
            {summary.orders.map((order) => (
              <li key={order.name} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div dir="auto" className="min-w-0 text-start">
                  <p className="text-label-md text-foreground">{order.name}</p>
                  {order.detail && <p className="text-body-sm text-muted-foreground">{order.detail}</p>}
                  {order.resultNote && <p className="text-body-sm text-success">{order.resultNote}</p>}
                </div>
                <StatusChip tone={order.status === 'Pending' ? 'warning' : 'success'}>{t(`summary.orderStatus.${order.status}`)}</StatusChip>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {summary.instructions.length > 0 && (
        <Section title={t('summary.instructions')} icon={<ListChecks aria-hidden="true" className="size-4 text-primary" />}>
          <ul className="list-disc space-y-2 ps-5 text-body-md text-foreground">
            {summary.instructions.map((line) => (
              <li key={line} dir="auto" className="text-start">
                {line}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {summary.followUp && (
        <section className="space-y-3 rounded-2xl border border-primary/30 bg-secondary/60 p-4">
          <h2 className="font-display text-title-sm text-ink">{t('summary.followUpTitle')}</h2>
          <p className="text-body-md text-foreground">{t('summary.followUpWindow', { from: day(summary.followUp.from), to: day(summary.followUp.to) })}</p>
          <Button asChild className="w-full">
            <Link to={`/patient/book/${summary.doctorId}?branch=${summary.branchId}${summary.followUp.serviceId ? `&service=${summary.followUp.serviceId}` : ''}`}>
              <CalendarPlus aria-hidden="true" />
              {t('summary.bookFollowUp')}
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}
