import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatMoney, formatWallClock } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { useDayLabel } from '../hooks/use-day-label';
import type { DoctorSummary } from '../model/doctor';
import { doctorPath, slotPath } from '../model/links';
import { RatingBadge } from './RatingBadge';

interface DoctorCardProps {
  doctor: DoctorSummary;
  specialtyName: string;
  branchNames: string;
}

/** One search result: who, where, how much, and the next free times (U1, U4). */
export function DoctorCard({ doctor, specialtyName, branchNames }: DoctorCardProps) {
  const { t } = useTranslation('doctors');
  const { language } = useLanguage();
  const dayLabel = useDayLabel();
  const profile = doctorPath(doctor.id);

  return (
    <article className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-hover md:flex-row">
      <div className="flex min-w-0 flex-1 gap-4">
        <Avatar name={doctor.fullName} size="lg" className="size-16 text-headline-md" />
        <div className="min-w-0 space-y-1.5">
          <h2 className="font-display text-headline-md text-ink">
            <Link to={profile} className="hover:text-primary">
              {doctor.fullName}
            </Link>
          </h2>
          <p className="text-body-md text-primary">{specialtyName}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {doctor.reviewCount > 0 && <RatingBadge rating={doctor.rating} count={doctor.reviewCount} />}
            <span className="inline-flex items-center gap-1 text-body-sm text-muted-foreground">
              <MapPin aria-hidden="true" className="size-3.5" />
              {branchNames}
            </span>
          </div>
          {doctor.fromPrice !== null && (
            <p className="text-body-md">
              <span className="font-semibold text-highlight-strong">{t('card.fromPrice', { price: formatMoney(doctor.fromPrice, language) })}</span>
              <span className="text-muted-foreground"> · {t('card.consultation')}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:w-80 md:items-end">
        <p className="text-label-sm uppercase tracking-[0.06em] text-muted-foreground">{t('card.nextAvailable')}</p>
        {doctor.nextSlots.length > 0 ? (
          <ul className="flex flex-wrap gap-2 md:justify-end">
            {doctor.nextSlots.map((slot, index) => {
              const day = dayLabel(slot.date);
              const time = formatWallClock(slot.startTime, language);
              return (
                <li key={slot.id}>
                  <Link
                    to={slotPath(slot)}
                    aria-label={t('card.bookSlot', { day, time })}
                    className={cn(
                      'inline-flex min-h-9 items-center rounded-lg border px-3 text-label-md transition-colors',
                      index === 0
                        ? 'border-highlight/30 bg-highlight/10 text-highlight-strong hover:bg-highlight/15'
                        : 'border-border bg-card text-foreground hover:border-primary hover:text-primary'
                    )}
                  >
                    {day} · <bdi dir="ltr" className="ms-1">{time}</bdi>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-body-sm text-muted-foreground">{t('card.noSlots')}</p>
        )}
        <div className="mt-auto flex gap-2">
          <Button asChild variant="ghost">
            <Link to={profile}>{t('card.viewProfile')}</Link>
          </Button>
          <Button asChild>
            <Link to={doctor.nextSlots[0] ? slotPath(doctor.nextSlots[0]) : profile}>{t('card.book')}</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
