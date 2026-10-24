import { Lock, Phone, Timer } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { branchName } from '@/features/org/model/branch-access';
import { useBranches } from '@/features/org/hooks/use-branches';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { formatSeconds, useCountdown } from '@/shared/lib/use-countdown';
import { Button } from '@/shared/ui/button';
import { AuthCard } from '../components/AuthCard';

/**
 * Too many wrong passwords or codes (V1 lockout, FR-ACC-02). Counts down to `?until=` and keeps the
 * branches' phone numbers in reach (UX_NOTES U10).
 */
export default function LockedPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const until = params.get('until');
  const secondsLeft = useCountdown(until && !Number.isNaN(Date.parse(until)) ? until : null);
  const { data: branches = [] } = useBranches();

  return (
    <AuthCard
      centered
      eyebrow={t('locked.badge')}
      title={t('locked.title')}
      intro={t('locked.intro')}
      after={
        branches.length > 0 && (
          <section aria-labelledby="locked-contact" className="rounded-2xl border border-border bg-card p-5">
            <h2 id="locked-contact" className="mb-3 font-display text-title-sm text-ink">
              {t('locked.contactTitle')}
            </h2>
            <ul className="space-y-1">
              {branches.map((branch) => (
                <li key={branch.id}>
                  <a href={`tel:${branch.phone}`} className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-accent">
                    <Phone aria-hidden="true" className="size-4 text-primary" />
                    <span className="flex-1 text-body-md text-foreground">{t('locked.call', { branch: branchName(branch, language) })}</span>
                    <bdi dir="ltr" className="text-body-md font-medium tabular-nums text-foreground">
                      {formatEgyptianPhone(branch.phone)}
                    </bdi>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      }
    >
      <div className="space-y-5">
        <span aria-hidden="true" className="mx-auto flex size-16 items-center justify-center rounded-full bg-highlight/10 text-highlight-strong">
          <Lock className="size-7" />
        </span>
        <div role="timer" aria-live="off" className="flex items-center justify-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
          {secondsLeft > 0 ? (
            <>
              <Timer aria-hidden="true" className="size-5 text-muted-foreground" />
              <span className="font-display text-headline-md tabular-nums text-ink">{formatSeconds(secondsLeft)}</span>
              <span className="text-body-sm text-muted-foreground">{t('locked.remaining')}</span>
            </>
          ) : (
            <span className="text-body-md font-medium text-success">{t('locked.ready')}</span>
          )}
        </div>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/sign-in">{t('locked.back')}</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
