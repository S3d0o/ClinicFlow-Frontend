import { CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AddEmailForm } from '@/features/auth/components/AddEmailForm';
import type { CurrentUser } from '@/features/auth/model/user';
import { Button } from '@/shared/ui/button';

function VerifiedRow({ label, value, verified }: { label: string; value: string; verified: boolean }) {
  const { t } = useTranslation('recruitment');
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3">
      <div className="min-w-0">
        <p className="text-caption text-muted-foreground">{label}</p>
        <p dir="ltr" className="truncate text-start text-body-md font-medium text-foreground">
          {value}
        </p>
      </div>
      {verified ? (
        <span className="inline-flex items-center gap-1 text-label-md text-success">
          <CheckCircle2 aria-hidden="true" className="size-4" />
          {t('join.verified')}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-label-md text-warning">
          <Clock aria-hidden="true" className="size-4" />
          {t('join.notConfirmed')}
        </span>
      )}
    </div>
  );
}

/**
 * Step 1 (FR-REC-01): applying needs an account with a verified phone and a confirmed email.
 * Signed-out visitors go to sign-up or sign-in and come back here.
 */
export function AccountStep({ user }: { user: CurrentUser | null }) {
  const { t } = useTranslation('recruitment');

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-body-md text-muted-foreground">{t('join.signedOutBody')}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/sign-up" state={{ from: '/join' }}>
              {t('join.createAccount')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/sign-in" state={{ from: '/join' }}>
              {t('join.haveAccount')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const confirmed = !!user.email && user.emailConfirmed;
  return (
    <div className="space-y-4">
      <VerifiedRow label={t('join.phone')} value={user.phone} verified={user.phoneVerified} />
      {confirmed ? (
        <VerifiedRow label={t('join.email')} value={user.email!} verified />
      ) : (
        <div className="space-y-3 rounded-xl border border-border p-4">
          {user.email && <VerifiedRow label={t('join.email')} value={user.email} verified={false} />}
          <AddEmailForm pendingEmail={user.email} next="/join" />
        </div>
      )}
    </div>
  );
}
