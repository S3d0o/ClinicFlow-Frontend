import { useState, type ReactNode } from 'react';
import { MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Service } from '@/features/catalog/model/catalog';
import type { Branch } from '@/features/org/model/branch';
import { branchName } from '@/features/org/model/branch-access';
import { pageCount } from '@/shared/api/page';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatInstant, formatMoney, formatWallClock, formatWeekday, WEEK_FROM_SATURDAY } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { Avatar } from '@/shared/ui/Avatar';
import { Pagination } from '@/shared/ui/Pagination';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { useDoctorReviews } from '../hooks/use-directory';
import type { DoctorProfile } from '../model/doctor';

const REVIEWS_PAGE_SIZE = 5;

export function ProfileSection({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <header className="mb-4 space-y-1">
        <h2 id={`${id}-title`} className="font-display text-headline-md text-ink">
          {title}
        </h2>
        {intro && <p className="text-body-sm text-muted-foreground">{intro}</p>}
      </header>
      {children}
    </section>
  );
}

/** The doctor's services with duration and price; a range when branches charge differently. */
export function ServicesList({ doctor, services }: { doctor: DoctorProfile; services: Service[] }) {
  const { t } = useTranslation('doctors');
  const { language } = useLanguage();
  return (
    <ul className="space-y-3">
      {doctor.services.map((offer) => {
        const service = services.find((s) => s.id === offer.serviceId);
        if (!service || offer.prices.length === 0) return null;
        const amounts = offer.prices.map((p) => p.price);
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);
        return (
          <li key={offer.serviceId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
            <div className="min-w-0 space-y-1">
              <p className="text-title-sm font-display text-ink">{nameIn(service, language)}</p>
              <p className="flex flex-wrap gap-2 text-caption text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">{t(`profile.category.${service.category}`)}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">{t('profile.minutes', { count: offer.durationMinutes })}</span>
              </p>
            </div>
            <p className="font-display text-headline-md text-highlight-strong">
              {min === max ? formatMoney(min, language) : `${formatMoney(min, language)} – ${formatMoney(max, language)}`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** Weekly hours per branch, Saturday first. */
export function BranchHours({ doctor, branches }: { doctor: DoctorProfile; branches: Branch[] }) {
  const { language } = useLanguage();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {branches
        .filter((b) => doctor.branchIds.includes(b.id))
        .map((branch) => {
          const shifts = doctor.schedule.filter((s) => s.branchId === branch.id);
          return (
            <article key={branch.id} className="space-y-3 rounded-xl border border-border p-4">
              <h3 className="font-display text-title-sm text-ink">{branchName(branch, language)}</h3>
              <p className="flex items-start gap-2 text-body-sm text-muted-foreground">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {language === 'ar' ? branch.addressAr : branch.addressEn}
              </p>
              <dl className="space-y-1 text-body-sm">
                {WEEK_FROM_SATURDAY.filter((day) => shifts.some((s) => s.weekday === day)).map((day) => (
                  <div key={day} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{formatWeekday(day, language)}</dt>
                    <dd className="tabular-nums text-foreground">
                      {shifts
                        .filter((s) => s.weekday === day)
                        .map((s) => `${formatWallClock(s.startTime, language)} – ${formatWallClock(s.endTime, language)}`)
                        .join('، ')}
                    </dd>
                  </div>
                ))}
              </dl>
              <a href={`tel:${branch.phone}`} className="inline-flex items-center gap-2 text-label-md text-primary hover:underline">
                <Phone aria-hidden="true" className="size-4" />
                <bdi dir="ltr">{formatEgyptianPhone(branch.phone)}</bdi>
              </a>
            </article>
          );
        })}
    </div>
  );
}

/** Reviews with a star filter, newest first. */
export function ReviewsList({ doctor }: { doctor: DoctorProfile }) {
  const { t } = useTranslation('doctors');
  const { language } = useLanguage();
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const reviews = useDoctorReviews(doctor.id, { page, pageSize: REVIEWS_PAGE_SIZE, rating });

  const filters = [
    { value: undefined, label: `${t('profile.allRatings')} (${doctor.reviewCount})` },
    ...([5, 4, 3, 2, 1] as const)
      .filter((stars) => doctor.ratingCounts[stars] > 0)
      .map((stars) => ({ value: stars, label: `${t('profile.stars', { count: stars })} (${doctor.ratingCounts[stars]})` })),
  ];

  if (doctor.reviewCount === 0) return <p className="text-body-md text-muted-foreground">{t('profile.noReviews')}</p>;

  return (
    <div className="space-y-4">
      <div role="group" aria-label={t('profile.reviews')} className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            aria-pressed={rating === filter.value}
            onClick={() => {
              setRating(filter.value);
              setPage(1);
            }}
            className={cn(
              'min-h-8 rounded-full border px-3 text-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              rating === filter.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-primary'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {reviews.isPending ? (
        <LoadingState />
      ) : reviews.isError ? (
        <ErrorState onRetry={() => void reviews.refetch()} />
      ) : (
        <>
          <ul className={cn('space-y-3', reviews.isPlaceholderData && 'opacity-60')}>
            {reviews.data.items.map((review) => (
              <li key={review.id} className="space-y-2 rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={review.authorName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="text-start text-label-md text-foreground">{review.authorName}</p>
                    <p className="text-caption text-muted-foreground">
                      {t('profile.visit', { date: formatInstant(review.createdAt, language, 'Africa/Cairo', { month: 'short', year: 'numeric' }) })}
                    </p>
                  </div>
                  <p className="text-label-md text-highlight-strong">
                    <span aria-hidden="true">{'★'.repeat(review.rating)}</span>
                    <span className="sr-only">{t('card.rating', { rating: review.rating })}</span>
                  </p>
                </div>
                {review.comment && (
                  <p dir="auto" className="text-start text-body-md text-foreground">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <Pagination page={page} pageCount={pageCount(reviews.data.total, REVIEWS_PAGE_SIZE)} onChange={setPage} />
        </>
      )}
    </div>
  );
}
