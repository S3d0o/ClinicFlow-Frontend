import { useEffect } from 'react';
import { ArrowRight, CalendarCheck, CheckCircle2, ClipboardList, MapPin, Phone, ReceiptText, Stethoscope } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { homePath } from '@/features/auth/model/access';
import { useSession } from '@/features/auth/hooks/use-session';
import { useSpecialties } from '@/features/catalog/hooks/use-catalog';
import { branchName } from '@/features/org/model/branch-access';
import { useBranches } from '@/features/org/hooks/use-branches';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { Button } from '@/shared/ui/button';
import { AvailabilitySearch } from '../components/AvailabilitySearch';
import { QuickSlotsCard } from '../components/QuickSlotsCard';

function SectionHeader({ id, eyebrow, title, intro, centered }: { id: string; eyebrow: string; title: string; intro?: string; centered?: boolean }) {
  return (
    <header className={centered ? 'mx-auto max-w-2xl space-y-2 text-center' : 'space-y-2'}>
      <p className="text-label-sm uppercase tracking-[0.08em] text-highlight-strong">{eyebrow}</p>
      <h2 id={id} className="font-display text-headline-lg text-ink sm:text-headline-xl">
        {title}
      </h2>
      {intro && <p className="text-body-md text-muted-foreground">{intro}</p>}
    </header>
  );
}

const JOURNEY = [
  { key: 'step1', icon: CalendarCheck },
  { key: 'step2', icon: ClipboardList },
  { key: 'step3', icon: Stethoscope },
  { key: 'step4', icon: ReceiptText },
] as const;

/** The public home page: search-first hero, branches, how a visit works, specialties, and the two ways in. */
export default function LandingPage() {
  const { t } = useTranslation(['site', 'common']);
  const { language } = useLanguage();
  const location = useLocation();
  const { user } = useSession();
  const { data: branches = [] } = useBranches();
  const { data: specialties = [] } = useSpecialties();

  // "/#branches" and "/#specialties" scroll to their section once it has rendered
  const sectionReady = branches.length > 0 && specialties.length > 0;
  useEffect(() => {
    if (location.hash && sectionReady) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash, sectionReady]);

  return (
    <div className="space-y-20 pb-20">
      <section className="border-b border-border bg-card/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:px-8 lg:py-16">
          <div className="space-y-6">
            <h1 className="font-display text-display-md text-ink sm:text-display-lg">{t('hero.title')}</h1>
            <p className="max-w-xl text-body-lg text-muted-foreground">{t('hero.body')}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/doctors">
                  <CalendarCheck aria-hidden="true" />
                  {t('hero.book')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/#specialties">{t('hero.specialties')}</Link>
              </Button>
            </div>
          </div>
          {branches.length > 0 && <QuickSlotsCard branches={branches} />}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AvailabilitySearch branches={branches} specialties={specialties} />
      </div>

      <section id="branches" aria-labelledby="branches-title" className="mx-auto max-w-7xl scroll-mt-24 space-y-8 px-4 sm:px-6 lg:px-8">
        <SectionHeader id="branches-title" eyebrow={t('branches.eyebrow')} title={t('branches.title')} intro={t('branches.intro')} />
        <ul className="grid gap-5 md:grid-cols-3">
          {branches.map((branch) => (
            <li key={branch.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-headline-md text-ink">
                {branchName(branch, language)}
              </h3>
              <p className="flex items-start gap-2 text-body-md text-muted-foreground">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {language === 'ar' ? branch.addressAr : branch.addressEn}
              </p>
              <a href={`tel:${branch.phone}`} className="inline-flex items-center gap-2 text-body-md text-foreground hover:text-primary">
                <Phone aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">{t('branches.call', { branch: branchName(branch, language) })}</span>
                <bdi dir="ltr">{formatEgyptianPhone(branch.phone)}</bdi>
              </a>
              <Link to={`/doctors?branch=${branch.id}`} className="mt-auto flex items-center justify-between border-t border-border pt-4 text-label-md text-primary hover:underline">
                {t('branches.viewDoctors')}
                <ArrowRight aria-hidden="true" className="rtl-flip size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="journey-title" className="border-y border-border bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <SectionHeader id="journey-title" centered eyebrow={t('journey.eyebrow')} title={t('journey.title')} />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map(({ key, icon: Icon }, index) => (
              <li key={key} className="space-y-3 rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-headline-lg text-primary">{String(index + 1).padStart(2, '0')}</span>
                  <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Icon className="size-5" />
                  </span>
                </div>
                <h3 className="font-display text-title-sm text-ink">{t(`journey.${key}Title`)}</h3>
                <p className="text-body-md text-muted-foreground">{t(`journey.${key}Body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="specialties" aria-labelledby="specialties-title" className="mx-auto max-w-7xl scroll-mt-24 space-y-8 px-4 sm:px-6 lg:px-8">
        <SectionHeader id="specialties-title" eyebrow={t('specialties.eyebrow')} title={t('specialties.title')} intro={t('specialties.intro')} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {specialties.map((specialty) => (
            <li key={specialty.id}>
              <Link
                to={`/doctors?specialty=${specialty.id}`}
                aria-label={t('specialties.doctors', { specialty: nameIn(specialty, language) })}
                className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-label-md text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Stethoscope aria-hidden="true" className="size-5 shrink-0 text-primary" />
                {nameIn(specialty, language)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section aria-labelledby="promise-title" className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <p className="w-fit rounded-full bg-secondary px-3 py-1 text-label-sm text-primary">{t('promise.badge')}</p>
          <h2 id="promise-title" className="font-display text-headline-lg text-ink">
            {t('promise.title')}
          </h2>
          <ul className="space-y-3">
            {(['point1', 'point2', 'point3', 'point4'] as const).map((key) => (
              <li key={key} className="flex items-start gap-3 text-body-md text-foreground">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                {t(`promise.${key}`)}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="mt-auto w-fit">
            <Link to={user ? homePath(user) : '/sign-up'}>{user ? t('promise.ctaSignedIn') : t('promise.cta')}</Link>
          </Button>
        </section>

        <section aria-labelledby="careers-title" className="flex flex-col gap-5 rounded-2xl bg-ink p-6 text-ink-foreground sm:p-8">
          <p className="w-fit rounded-full bg-ink-foreground/10 px-3 py-1 text-label-sm">{t('careers.badge')}</p>
          <h2 id="careers-title" className="font-display text-headline-lg">
            {t('careers.title')}
          </h2>
          <p className="text-body-md text-ink-foreground/80">{t('careers.body')}</p>
          <ul className="space-y-3">
            {(['point1', 'point2'] as const).map((key) => (
              <li key={key} className="flex items-start gap-3 text-body-md">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-highlight" />
                {t(`careers.${key}`)}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-auto w-fit bg-card text-ink hover:bg-card/90">
            <Link to="/join">{t('careers.cta')}</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
