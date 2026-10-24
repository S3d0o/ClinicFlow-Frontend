import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpecialties } from '@/features/catalog/hooks/use-catalog';
import { useDayLabel } from '@/features/doctors/hooks/use-day-label';
import { useDoctorSearch } from '@/features/doctors/hooks/use-directory';
import { slotPath } from '@/features/doctors/model/links';
import type { Branch } from '@/features/org/model/branch';
import { branchName } from '@/features/org/model/branch-access';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatWallClock } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { Avatar } from '@/shared/ui/Avatar';
import { ErrorState, LoadingState } from '@/shared/ui/states';

/** The soonest free times at a branch, each one tap away from booking (hero card). */
export function QuickSlotsCard({ branches }: { branches: Branch[] }) {
  const { t } = useTranslation('site');
  const { language } = useLanguage();
  const dayLabel = useDayLabel();
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const activeBranch = branchId ?? branches[0]?.id;
  const results = useDoctorSearch({ branchId: activeBranch, sort: 'soonest', page: 1, pageSize: 3 });
  const { data: specialties = [] } = useSpecialties();

  return (
    <section aria-labelledby="quick-title" className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-elevated">
      <header className="space-y-1">
        <h2 id="quick-title" className="font-display text-title-sm text-ink">
          {t('quick.title')}
        </h2>
        <p className="text-body-sm text-muted-foreground">{t('quick.intro')}</p>
      </header>

      <div role="group" aria-label={t('quick.branch')} className="flex flex-wrap gap-2">
        {branches.map((branch) => (
          <button
            key={branch.id}
            type="button"
            aria-pressed={branch.id === activeBranch}
            onClick={() => setBranchId(branch.id)}
            className={cn(
              'min-h-9 rounded-full border px-3 text-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              branch.id === activeBranch ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-primary'
            )}
          >
            {branchName(branch, language)}
          </button>
        ))}
      </div>

      {!activeBranch || results.isPending ? (
        <LoadingState className="py-8" />
      ) : results.isError ? (
        <ErrorState className="py-8" onRetry={() => void results.refetch()} />
      ) : (
        <ul className={cn('divide-y divide-border', results.isPlaceholderData && 'opacity-60')}>
          {results.data.items.filter((d) => d.nextSlots.length > 0).length === 0 && (
            <li className="py-6 text-center text-body-sm text-muted-foreground">{t('quick.empty')}</li>
          )}
          {results.data.items
            .filter((doctor) => doctor.nextSlots.length > 0)
            .map((doctor) => {
              const slot = doctor.nextSlots[0];
              const specialty = specialties.find((s) => s.id === doctor.specialtyId);
              return (
                <li key={doctor.id} className="flex items-center gap-3 py-3">
                  <Avatar name={doctor.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label-md text-foreground">{doctor.fullName}</p>
                    <p className="truncate text-body-sm text-muted-foreground">{specialty ? nameIn(specialty, language) : ''}</p>
                  </div>
                  <Link
                    to={slotPath(slot)}
                    className="shrink-0 rounded-lg border border-highlight/30 bg-highlight/10 px-3 py-2 text-label-md text-highlight-strong hover:bg-highlight/15"
                  >
                    {dayLabel(slot.date)} · <bdi dir="ltr">{formatWallClock(slot.startTime, language)}</bdi>
                  </Link>
                </li>
              );
            })}
        </ul>
      )}

      <Link to={activeBranch ? `/doctors?branch=${activeBranch}` : '/doctors'} className="block text-center text-label-md text-primary hover:underline">
        {t('quick.seeAll')}
      </Link>
    </section>
  );
}
