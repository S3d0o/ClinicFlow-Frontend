import { CalendarDays, MapPin } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSpecialties } from '@/features/catalog/hooks/use-catalog';
import { branchName } from '@/features/org/model/branch-access';
import { useBranches } from '@/features/org/hooks/use-branches';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatInstant } from '@/shared/lib/intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip, type Tone } from '@/shared/ui/StatusChip';
import { ApplicationHistory } from '../components/ApplicationHistory';
import { ApplicationSnapshot } from '../components/ApplicationSnapshot';
import { ApplicationTracker } from '../components/ApplicationTracker';
import { StageCard } from '../components/StageCard';
import { useMyApplication, useWithdrawApplication } from '../hooks/use-application';
import type { ApplicationStatus } from '../model/application';
import { canWithdraw, trackerSteps } from '../model/stages';

const STATUS_TONE: Record<ApplicationStatus, Tone> = {
  Applied: 'info',
  Interview: 'warning',
  Accepted: 'success',
  Rejected: 'danger',
  Withdrawn: 'neutral',
};

/** The applicant's home (02 §8, FR-REC-06): stage, interview details, history, withdraw. */
export default function MyApplicationPage() {
  const { t } = useTranslation(['recruitment', 'common']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const mine = useMyApplication();
  const withdraw = useWithdrawApplication();
  const { data: branches = [] } = useBranches();
  const { data: specialties = [] } = useSpecialties();

  if (mine.isPending) return <LoadingState className="min-h-[50vh]" />;
  if (mine.isError) return <ErrorState className="min-h-[50vh]" onRetry={() => void mine.refetch()} />;
  if (!mine.data) return <Navigate to="/join" replace />;

  const application = mine.data;
  const specialty = specialties.find((s) => s.id === application.specialtyId);
  const preferred = branches.find((b) => b.id === application.preferredBranchId);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="eyebrow">
            <Trans t={t} i18nKey="mine.reference" values={{ reference: application.reference }} components={{ num: <bdi dir="ltr" /> }} />
          </p>
          <h1 className="font-display text-headline-lg text-ink sm:text-headline-xl">
            {t('mine.title', { specialty: specialty ? nameIn(specialty, language) : '' })}
          </h1>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4" />
              {t('mine.submittedOn', { date: formatInstant(application.submittedAt, language, 'Africa/Cairo', { day: 'numeric', month: 'long', year: 'numeric' }) })}
            </span>
            {preferred && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4" />
                {t('mine.preferredBranch', { branch: branchName(preferred, language) })}
              </span>
            )}
          </p>
        </div>
        <StatusChip tone={STATUS_TONE[application.status]} className="text-label-md">
          {t(`status.${application.status}`)}
        </StatusChip>
      </header>

      <ApplicationTracker steps={trackerSteps(application)} />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <StageCard application={application} branches={branches} />
          <ApplicationHistory history={application.history} />
        </div>
        <div className="space-y-4">
          <ApplicationSnapshot application={application} specialty={specialty} />
          {canWithdraw(application.status) && (
            <section className="space-y-2 rounded-2xl border border-border bg-card p-5 text-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive-outline" className="w-full">
                    {t('mine.withdraw')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('mine.withdrawConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('mine.withdrawConfirmBody')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        withdraw.mutate(undefined, {
                          onSuccess: () => toast.success(t('mine.withdrawn')),
                          onError: (err) => toast.error(errorMessage(err)),
                        })
                      }
                    >
                      {t('mine.withdrawConfirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-body-sm text-muted-foreground">{t('mine.withdrawHint')}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
