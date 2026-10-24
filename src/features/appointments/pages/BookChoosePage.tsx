import { Check, MapPin } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RatingBadge } from '@/features/doctors/components/RatingBadge';
import { useDayLabel } from '@/features/doctors/hooks/use-day-label';
import { useBranchServices, useDoctorSearch } from '@/features/doctors/hooks/use-directory';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatMoney, formatWallClock } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { useLookups } from '../hooks/use-lookups';
import { BookingSteps } from '../components/BookingSteps';

function SectionTitle({ id, n, children }: { id: string; n: number; children: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2 font-display text-title-sm text-ink">
      <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-secondary text-label-sm text-primary">
        {n}
      </span>
      {children}
    </h2>
  );
}

/** Booking step 1 (FR-PAT-01): branch, specialty, service, then a doctor. The choice lives in the URL. */
export default function BookChoosePage() {
  const { t } = useTranslation(['appointments', 'doctors']);
  const { language } = useLanguage();
  const dayLabel = useDayLabel();
  const [params, setParams] = useSearchParams();
  const { branches, branchLabel, specialtyLabel } = useLookups();

  const branchId = params.get('branch') ?? branches[0]?.id;
  const serviceId = params.get('service') ?? undefined;
  const branchServices = useBranchServices(branchId);
  const doctors = useDoctorSearch({ branchId, serviceId, sort: 'soonest', page: 1, pageSize: 20 });

  const choose = (change: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(change)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  const specialtyIds = [...new Set((branchServices.data ?? []).map((s) => s.specialtyId))];
  // One specialty at a time keeps the list short: the chosen one, the chosen service's, or the first
  const specialtyId =
    params.get('specialty') ?? branchServices.data?.find((s) => s.id === serviceId)?.specialtyId ?? specialtyIds[0];
  const services = (branchServices.data ?? []).filter((s) => s.specialtyId === specialtyId);

  return (
    <div className="space-y-6">
      <BookingSteps step={1} backTo="/patient" />

      <section aria-labelledby="branch-title" className="space-y-3">
        <SectionTitle id="branch-title" n={1}>{t('book.branch')}</SectionTitle>
        <div role="radiogroup" aria-label={t('book.branch')} className="scrollbar-thin -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
          {branches.map((branch) => {
            const selected = branch.id === branchId;
            return (
              <button
                key={branch.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose({ branch: branch.id, specialty: undefined, service: undefined })}
                className={cn(
                  'min-w-60 shrink-0 space-y-1 rounded-xl border bg-card p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-0',
                  selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary'
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-title-sm text-ink">{branchLabel(branch.id)}</span>
                  {selected && <Check aria-hidden="true" className="size-4 text-primary" />}
                </span>
                <span className="flex items-start gap-1.5 text-body-sm text-muted-foreground">
                  <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  {language === 'ar' ? branch.addressAr : branch.addressEn}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="specialty-title" className="space-y-3">
        <SectionTitle id="specialty-title" n={2}>{t('book.specialty')}</SectionTitle>
        <div role="group" aria-label={t('book.specialty')} className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {specialtyIds.map((id) => {
            const active = id === specialtyId;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => choose({ specialty: id, service: undefined })}
                className={cn(
                  'min-h-10 shrink-0 rounded-full border px-4 text-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary hover:text-primary'
                )}
              >
                {specialtyLabel(id)}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="service-title" className="space-y-3">
        <SectionTitle id="service-title" n={3}>{t('book.service')}</SectionTitle>
        {branchServices.isPending ? (
          <LoadingState className="py-6" />
        ) : branchServices.isError ? (
          <ErrorState className="py-6" onRetry={() => void branchServices.refetch()} />
        ) : (
          <div role="radiogroup" aria-label={t('book.service')} className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => {
              const selected = service.id === serviceId;
              return (
                <button
                  key={service.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose({ service: service.id })}
                  className={cn(
                    'flex items-start justify-between gap-3 rounded-xl border bg-card p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary'
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-label-md text-foreground">{nameIn(service, language)}</span>
                    <span className="block text-body-sm text-muted-foreground">
                      {t(`doctors:profile.category.${service.category}`)} · {t('book.minutes', { count: service.defaultDurationMinutes })}
                    </span>
                  </span>
                  <span className="shrink-0 text-label-md text-highlight-strong">{t('book.serviceFrom', { price: formatMoney(service.fromPrice, language) })}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="doctors-title" className="space-y-3">
        <SectionTitle id="doctors-title" n={4}>{t('book.doctors')}</SectionTitle>
        {!serviceId ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-body-md text-muted-foreground">
            {t('book.pickService')}
          </p>
        ) : doctors.isPending ? (
          <LoadingState className="py-6" />
        ) : doctors.isError ? (
          <ErrorState className="py-6" onRetry={() => void doctors.refetch()} />
        ) : doctors.data.items.length === 0 ? (
          <EmptyState className="rounded-xl border border-dashed border-border" title={t('book.noDoctors')} />
        ) : (
          <ul className="space-y-3">
            {doctors.data.items.map((doctor) => {
              const next = doctor.nextSlots[0];
              return (
                <li key={doctor.id} className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex gap-3">
                    <Avatar name={doctor.fullName} size="lg" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-title-sm text-ink">{doctor.fullName}</h3>
                        {doctor.fromPrice !== null && (
                          <span className="shrink-0 rounded-md bg-highlight/10 px-2 py-0.5 text-label-md text-highlight-strong">
                            {formatMoney(doctor.fromPrice, language)}
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-primary">{specialtyLabel(doctor.specialtyId)}</p>
                      {doctor.reviewCount > 0 && <RatingBadge rating={doctor.rating} count={doctor.reviewCount} />}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="text-body-sm text-muted-foreground">
                      {next ? (
                        <>
                          {t('book.nextAvailable', { when: dayLabel(next.date) })} · <bdi dir="ltr">{formatWallClock(next.startTime, language)}</bdi>
                        </>
                      ) : (
                        t('book.noSlots')
                      )}
                    </p>
                    {next && (
                      <Button asChild size="sm">
                        <Link to={`/patient/book/${doctor.id}?branch=${branchId}&service=${serviceId}`}>{t('book.selectSlot')}</Link>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
