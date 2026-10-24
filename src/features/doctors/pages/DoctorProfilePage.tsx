import { Award, BadgeCheck, Languages, MapPin } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useServiceCatalog, useSpecialties } from '@/features/catalog/hooks/use-catalog';
import { branchName } from '@/features/org/model/branch-access';
import { useBranches } from '@/features/org/hooks/use-branches';
import { isServiceError } from '@/shared/api/service-error';
import { nameIn, textIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatList } from '@/shared/lib/intl';
import { Avatar } from '@/shared/ui/Avatar';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button } from '@/shared/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { BookingCard } from '../components/BookingCard';
import { BranchHours, ProfileSection, ReviewsList, ServicesList } from '../components/ProfileSections';
import { RatingBadge } from '../components/RatingBadge';
import { useDoctor } from '../hooks/use-directory';

const SECTIONS = ['about', 'services', 'branches', 'reviews'] as const;

/** A doctor's public profile with the booking card (FR-STF-05, FR-PAT-02). */
export default function DoctorProfilePage() {
  const { t } = useTranslation(['doctors', 'screens', 'common']);
  const { language } = useLanguage();
  const { doctorId = '' } = useParams();
  const [params] = useSearchParams();
  const doctor = useDoctor(doctorId);
  const { data: branches = [] } = useBranches();
  const { data: specialties = [] } = useSpecialties();
  const { data: services = [] } = useServiceCatalog();

  if (doctor.isPending) return <LoadingState className="min-h-[50vh]" />;
  if (doctor.isError) {
    return isServiceError(doctor.error, 'Doctor.NotFound') ? (
      <EmptyState
        className="min-h-[50vh]"
        title={t('common:errors.Doctor.NotFound')}
        action={
          <Button asChild>
            <Link to="/doctors">{t('screens:findDoctor')}</Link>
          </Button>
        }
      />
    ) : (
      <ErrorState className="min-h-[50vh]" onRetry={() => void doctor.refetch()} />
    );
  }

  const profile = doctor.data;
  const specialty = specialties.find((s) => s.id === profile.specialtyId);
  const doctorBranches = branches.filter((b) => profile.branchIds.includes(b.id));
  const bio = textIn(profile.bioEn, profile.bioAr, language);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: t('screens:landing'), to: '/' }, { label: t('screens:findDoctor'), to: '/doctors' }, { label: profile.fullName }]} />

      <header className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-card sm:flex-row sm:p-6">
        <Avatar name={profile.fullName} size="lg" className="size-24 text-headline-lg" />
        <div className="min-w-0 space-y-2">
          <h1 className="font-display text-headline-lg text-ink sm:text-headline-xl">{profile.fullName}</h1>
          {specialty && <p className="text-body-lg text-primary">{nameIn(specialty, language)}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {profile.reviewCount > 0 && <RatingBadge rating={profile.rating} count={profile.reviewCount} />}
            <span className="inline-flex items-center gap-1 text-body-sm text-muted-foreground">
              <BadgeCheck aria-hidden="true" className="size-4 text-info" />
              <Trans t={t} i18nKey="profile.license" values={{ number: profile.licenseNo }} components={{ num: <bdi dir="ltr" /> }} />
            </span>
          </div>
          <ul className="flex flex-wrap gap-2 pt-1 text-body-sm">
            <li className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1">
              <Award aria-hidden="true" className="size-4 text-muted-foreground" />
              {t('profile.years', { count: profile.yearsOfExperience })}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1">
              <Languages aria-hidden="true" className="size-4 text-muted-foreground" />
              {t('profile.languagesLine', {
                languages: formatList(profile.languages.map((code) => t(`languages.${code}` as 'languages.ar')), language),
              })}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1">
              <MapPin aria-hidden="true" className="size-4 text-muted-foreground" />
              {formatList(doctorBranches.map((b) => branchName(b, language)), language)}
            </li>
          </ul>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="order-2 min-w-0 space-y-6 lg:order-1">
          <nav aria-label={t('profile.sections')} className="scrollbar-thin flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
            {SECTIONS.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="shrink-0 rounded-lg px-4 py-2 text-label-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t(`profile.${section}`)}
                {section === 'reviews' && profile.reviewCount > 0 && <span className="ms-1.5 rounded-full bg-secondary px-1.5 text-caption text-primary">{profile.reviewCount}</span>}
              </button>
            ))}
          </nav>

          <ProfileSection id="about" title={t('profile.about')}>
            <p className="text-body-lg text-foreground">{bio || t('profile.noBio')}</p>
          </ProfileSection>
          <ProfileSection id="services" title={t('profile.services')} intro={t('profile.servicesIntro')}>
            <ServicesList doctor={profile} services={services} />
          </ProfileSection>
          <ProfileSection id="branches" title={t('profile.branches')} intro={t('profile.branchesIntro')}>
            <BranchHours doctor={profile} branches={branches} />
          </ProfileSection>
          <ProfileSection id="reviews" title={t('profile.reviews')} intro={t('profile.reviewsIntro')}>
            <ReviewsList doctor={profile} />
          </ProfileSection>
        </div>

        <div className="order-1 lg:sticky lg:top-24 lg:order-2">
          {branches.length > 0 && services.length > 0 && (
            <BookingCard
              doctor={profile}
              branches={branches}
              services={services}
              initialBranchId={params.get('branch') ?? undefined}
              initialSlotId={params.get('slot') ?? undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}
