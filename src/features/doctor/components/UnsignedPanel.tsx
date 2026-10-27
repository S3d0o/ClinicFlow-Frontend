import { FileSignature } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatDay } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { useUnsignedEncounters } from '../hooks/use-doctor';
import { isOverdue } from '../model/rules';

/** Finished visits whose notes still need signing, oldest first; over 24 h is overdue (FR-EMR-09). */
export function UnsignedPanel({ now }: { now: Date }) {
  const { t } = useTranslation('doctor');
  const { language } = useLanguage();
  const { serviceLabel, branchLabel } = useLookups();
  const unsigned = useUnsignedEncounters();
  const overdue = unsigned.data?.filter((u) => isOverdue(u.completedAt, now)).length ?? 0;

  return (
    <section aria-labelledby="unsigned-heading" className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <header className="flex items-center justify-between gap-2">
        <h2 id="unsigned-heading" className="flex items-center gap-2 text-title-sm text-ink">
          <FileSignature aria-hidden="true" className="size-5 text-primary" />
          {t('unsigned.title')}
        </h2>
        {overdue > 0 && <StatusChip tone="danger">{t('unsigned.overdue', { count: overdue })}</StatusChip>}
      </header>
      {unsigned.isPending ? (
        <LoadingState />
      ) : unsigned.isError ? (
        <ErrorState onRetry={() => void unsigned.refetch()} />
      ) : unsigned.data.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{t('unsigned.none')}</p>
      ) : (
        <>
          <p className="text-body-sm text-muted-foreground">{t('unsigned.hint')}</p>
          <ul className="space-y-2">
            {unsigned.data.map((item) => (
              <li key={item.appointmentId} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-label-md text-ink"><bdi>{item.patientName}</bdi></p>
                  <p className="text-body-sm text-muted-foreground">
                    {serviceLabel(item.serviceId)} · {formatDay(item.date, language, { weekday: 'short', day: 'numeric', month: 'short' })} · {branchLabel(item.branchId)}
                  </p>
                  {isOverdue(item.completedAt, now) && <p className="text-body-sm font-medium text-destructive">{t('unsigned.late')}</p>}
                </div>
                <Button asChild size="sm" variant="strong">
                  <Link to={`/doctor/encounters/${item.appointmentId}`} aria-label={t('unsigned.signFor', { name: item.patientName })}>
                    {t('unsigned.sign')}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
