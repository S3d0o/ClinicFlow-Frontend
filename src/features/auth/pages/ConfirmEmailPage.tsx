import { useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { AuthCard } from '../components/AuthCard';
import { useConfirmEmail } from '../hooks/use-account-access';
import { useSession } from '../hooks/use-session';
import { homePath } from '../model/access';

/**
 * Opened from the confirmation email (`/#/confirm-email?userId=…&token=…`, API contract §8).
 * Confirms on arrival. `next` (a demo convenience) says where "Continue" goes.
 */
export default function ConfirmEmailPage() {
  const { t } = useTranslation(['auth', 'common']);
  const [params] = useSearchParams();
  const errorMessage = useErrorMessage();
  const { user } = useSession();
  const confirm = useConfirmEmail();
  const userId = params.get('userId') ?? '';
  const token = params.get('token') ?? '';
  const next = params.get('next');
  const { mutate } = confirm;
  const sent = useRef(false);

  useEffect(() => {
    // The token works once; StrictMode runs effects twice in development
    if (sent.current) return;
    sent.current = true;
    mutate({ userId, token });
  }, [mutate, userId, token]);

  if (confirm.isError) return <ErrorState description={errorMessage(confirm.error)} />;
  if (!confirm.isSuccess) return <LoadingState label={t('confirmEmail.confirming')} />;

  // Only same-app paths are followed
  const target = next?.startsWith('/') && !next.startsWith('//') ? next : user ? homePath(user) : '/sign-in';
  return (
    <AuthCard centered title={t('confirmEmail.doneTitle')} intro={t('confirmEmail.doneBody')}>
      <CheckCircle2 aria-hidden="true" className="mx-auto mb-6 size-12 text-success" />
      <Button asChild size="lg" className="w-full">
        <Link to={target} replace>
          {t('confirmEmail.continue')}
        </Link>
      </Button>
    </AuthCard>
  );
}
