import { useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { CopyButton } from '@/shared/ui/CopyButton';
import { FormAlert } from '@/shared/ui/FormAlert';
import { OtpInput } from '@/shared/ui/OtpInput';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { QrCode } from '../components/QrCode';
import { useSession } from '../hooks/use-session';
import { useConfirmMfaEnrollment, useMfaEnrollment } from '../hooks/use-staff-access';
import { homePath, needsMfaSetup } from '../model/access';

function SetupStep({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-label-md text-primary-foreground">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <h2 className="font-display text-title-sm text-ink">{title}</h2>
        {children}
      </div>
    </li>
  );
}

const downloadText = (fileName: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Authenticator setup, required before staff can open anything else (FR-STF-07): scan the key, save
 * the recovery codes, then prove it works with a code from the app.
 */
export default function MfaSetupPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { user } = useSession();
  const errorMessage = useErrorMessage();
  const needed = needsMfaSetup(user);
  const enrollment = useMfaEnrollment(needed);
  const confirm = useConfirmMfaEnrollment();
  const [code, setCode] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patients, and staff who already set it up, have nothing to do here
  if (!needed) return <Navigate to={homePath(user)} replace />;
  if (enrollment.isPending) return <LoadingState />;
  if (enrollment.isError) return <ErrorState onRetry={() => void enrollment.refetch()} />;

  const { secret, otpauthUri, recoveryCodes } = enrollment.data;
  const account = user!.email ?? user!.phone;
  const codesText = recoveryCodes.join('\n');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (code.length !== 6) return setError(t('common:validation.code'));
    if (!saved) return setError(t('mfaSetup.savedRequired'));
    setError(null);
    confirm.mutate(code, {
      onSuccess: () => toast.success(t('mfaSetup.done')),
      onError: (err) => {
        setError(errorMessage(err));
        setCode('');
      },
    });
  };

  return (
    <div data-layout="wide" className="space-y-6">
      <header className="space-y-2">
        <p className="eyebrow">{t('mfaSetup.eyebrow')}</p>
        <h1 className="font-display text-headline-lg text-ink sm:text-headline-xl">{t('mfaSetup.title')}</h1>
        <p className="max-w-2xl text-body-md text-muted-foreground">{t('mfaSetup.intro')}</p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <ol className="space-y-7">
            <SetupStep n={1} title={t('mfaSetup.step1Title')}>
              <p className="text-body-md text-muted-foreground">{t('mfaSetup.step1Body')}</p>
            </SetupStep>

            <SetupStep n={2} title={t('mfaSetup.step2Title')}>
              <p className="text-body-md text-muted-foreground">{t('mfaSetup.step2Body')}</p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <QrCode value={otpauthUri} label={t('mfaSetup.qrAlt')} />
                <div className="min-w-0 space-y-2">
                  <p className="text-body-sm text-muted-foreground">{t('mfaSetup.manualKey')}</p>
                  <code dir="ltr" className="block break-all rounded-lg border border-border bg-muted px-3 py-2 font-mono text-body-md tracking-wider text-foreground">
                    {secret.match(/.{1,4}/g)?.join(' ')}
                  </code>
                  <CopyButton text={secret} label={t('mfaSetup.copyKey')} />
                </div>
              </div>
            </SetupStep>

            <SetupStep n={3} title={t('mfaSetup.step3Title')}>
              <OtpInput value={code} onChange={(value) => { setCode(value); setError(null); }} invalid={!!error && code.length > 0} disabled={confirm.isPending} />
            </SetupStep>
          </ol>
        </section>

        <div className="space-y-4">
          <section aria-labelledby="recovery-title" className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 id="recovery-title" className="font-display text-title-sm text-ink">
              {t('mfaSetup.recoveryTitle')}
            </h2>
            <p className="flex gap-2 rounded-lg border border-warning/25 bg-warning/10 p-3 text-body-sm text-warning">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {t('mfaSetup.recoveryWarning')}
            </p>
            <ol dir="ltr" className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border border-border bg-muted/50 p-3 font-mono text-body-md">
              {recoveryCodes.map((recoveryCode, index) => (
                <li key={recoveryCode} className="flex gap-2">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  {recoveryCode}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadText('clinicflow-recovery-codes.txt', `${t('mfaSetup.recoveryFileTitle', { account })}\n\n${codesText}\n`)}
              >
                <Download aria-hidden="true" />
                {t('mfaSetup.downloadCodes')}
              </Button>
              <CopyButton text={codesText} label={t('mfaSetup.copyCodes')} />
            </div>
            <Checkbox id="codes-saved" checked={saved} onChange={(e) => setSaved(e.target.checked)} label={t('mfaSetup.savedConfirm')} />
          </section>

          {error && <FormAlert>{error}</FormAlert>}
          <Button type="submit" size="lg" className="w-full" disabled={confirm.isPending}>
            {t('mfaSetup.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
