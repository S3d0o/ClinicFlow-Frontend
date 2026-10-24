import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, ClipboardCheck } from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSpecialties } from '@/features/catalog/hooks/use-catalog';
import { useSession } from '@/features/auth/hooks/use-session';
import { useBranches } from '@/features/org/hooks/use-branches';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { todayIn } from '@/shared/lib/branch-time';
import { formatDay } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { LoadingState } from '@/shared/ui/states';
import { Stepper } from '@/shared/ui/Stepper';
import { AccountStep } from '../components/AccountStep';
import { DocumentsStep, PracticeStep, ReviewStep } from '../components/ApplicationFormSteps';
import { useApply, useMyApplication } from '../hooks/use-application';
import { applicationSchema, STEP_FIELDS, type ApplicationValues } from '../model/application.schema';
import { isOpen } from '../model/stages';

const STEPS = ['account', 'practice', 'documents', 'review'] as const;

function ProcessAside() {
  const { t } = useTranslation('recruitment');
  return (
    <aside className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-title-sm text-ink">
        <ClipboardCheck aria-hidden="true" className="size-5 text-primary" />
        {t('join.processTitle')}
      </h2>
      <ol className="space-y-3">
        {(['process1', 'process2', 'process3'] as const).map((key, index) => (
          <li key={key} className="flex gap-3 text-body-md">
            <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-label-sm text-primary">
              {index + 1}
            </span>
            <span className="text-foreground">{t(`join.${key}`)}</span>
          </li>
        ))}
      </ol>
      <p className="rounded-lg bg-info/10 p-3 text-body-sm text-info">{t('join.processNote')}</p>
    </aside>
  );
}

/** "Join as a doctor" (FR-REC-01): account, practice details, documents, review. Replaces V1's doctor sign-up. */
export default function JoinPage() {
  const { t } = useTranslation(['recruitment', 'screens', 'common']);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { user } = useSession();
  const mine = useMyApplication(!!user);
  const { data: specialties = [] } = useSpecialties();
  const { data: branches = [] } = useBranches();
  const apply = useApply();
  const [step, setStep] = useState(0);

  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      specialtyId: '',
      licenseNo: '',
      yearsOfExperience: Number.NaN,
      preferredBranchId: '',
      cv: null,
      coverLetterMode: 'text',
      coverLetterText: '',
      coverLetter: null,
    },
  });

  if (user && mine.isPending) return <LoadingState className="min-h-[50vh]" />;

  const latest = mine.data;
  const today = todayIn('Africa/Cairo');
  const blocked = latest && (isOpen(latest.status) || (latest.canReapplyFrom && latest.canReapplyFrom > today));
  const accountReady = !!user && user.phoneVerified && !!user.email && user.emailConfirmed;

  const next = async () => {
    const current = STEPS[step];
    if (current === 'practice' || current === 'documents') {
      if (!(await form.trigger([...STEP_FIELDS[current]]))) return;
    }
    setStep((s) => s + 1);
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      await apply.mutateAsync({
        specialtyId: values.specialtyId,
        licenseNo: values.licenseNo,
        yearsOfExperience: values.yearsOfExperience,
        preferredBranchId: values.preferredBranchId || undefined,
        cv: values.cv!,
        coverLetter: values.coverLetterMode === 'file' ? (values.coverLetter ?? undefined) : undefined,
        coverLetterText: values.coverLetterMode === 'text' ? values.coverLetterText : undefined,
      });
      toast.success(t('join.submitted'));
      navigate('/my-application');
    } catch {
      // Shown from apply.error below
    }
  });

  const header = (
    <header className="space-y-3">
      <p className="inline-flex items-center gap-2 rounded-full border border-highlight/25 bg-highlight/10 px-3 py-1 text-label-sm uppercase tracking-[0.06em] text-highlight-strong">
        {t('join.eyebrow')}
      </p>
      <h1 className="font-display text-headline-xl text-ink sm:text-display-md">{t('join.title')}</h1>
      <p className="max-w-3xl text-body-lg text-muted-foreground">{t('join.intro')}</p>
    </header>
  );

  if (blocked) {
    const open = isOpen(latest.status);
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        {header}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-headline-md text-ink">{open ? t('join.alreadyTitle') : t('join.cooldownTitle')}</h2>
          <p className="text-body-md text-muted-foreground">
            {open ? t('join.alreadyBody') : t('join.cooldownBody', { date: formatDay(latest.canReapplyFrom!, language, { day: 'numeric', month: 'long', year: 'numeric' }) })}
          </p>
          <Button asChild>
            <Link to="/my-application">{t('join.viewApplication')}</Link>
          </Button>
        </section>
      </div>
    );
  }

  const titles = { account: t('join.accountTitle'), practice: t('join.practiceTitle'), documents: t('join.documentsTitle'), review: t('join.reviewTitle') };
  const current = STEPS[step];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {header}
      <Stepper
        current={step}
        steps={STEPS.map((key) => ({ label: t(`join.steps.${key}`), description: t(`join.steps.${key}Hint`) }))}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <FormProvider {...form}>
          <form onSubmit={submit} noValidate className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <header className="space-y-1 border-b border-border pb-4">
              <h2 className="font-display text-headline-md text-ink">
                {step + 1}. {titles[current]}
              </h2>
              {current === 'account' && <p className="text-body-md text-muted-foreground">{t('join.accountIntro')}</p>}
              {current === 'review' && <p className="text-body-md text-muted-foreground">{t('join.reviewIntro')}</p>}
            </header>

            {current === 'account' && <AccountStep user={user} />}
            {current === 'practice' && <PracticeStep specialties={specialties} branches={branches} />}
            {current === 'documents' && <DocumentsStep />}
            {current === 'review' && <ReviewStep specialties={specialties} branches={branches} onEdit={setStep} />}

            {apply.isError && current === 'review' && <FormAlert>{errorMessage(apply.error)}</FormAlert>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft aria-hidden="true" className="rtl-flip" />
                  {t('join.back')}
                </Button>
              ) : (
                <span />
              )}
              {current === 'review' ? (
                <Button type="submit" size="lg" disabled={apply.isPending}>
                  {t('join.submit')}
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={() => void next()} disabled={current === 'account' && !accountReady}>
                  {t('join.continue')}
                  <ArrowRight aria-hidden="true" className="rtl-flip" />
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
        <ProcessAside />
      </div>
    </div>
  );
}
