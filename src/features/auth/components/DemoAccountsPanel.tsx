import { ArrowRight, MailPlus, MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Avatar } from '@/shared/ui/Avatar';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { useDemoAccounts, useDemoSignIn } from '../hooks/use-demo-accounts';

/**
 * One-click sign-in as any sample account. Renders nothing when the backend has no demo accounts.
 * Signing in updates the session; the route guard then moves the user on.
 */
export function DemoAccountsPanel() {
  const { t } = useTranslation();
  const demo = useDemoAccounts();
  const signIn = useDemoSignIn();

  if (!demo.available) return null;
  if (demo.isPending) return <LoadingState />;
  if (demo.isError) return <ErrorState onRetry={() => void demo.refetch()} />;

  return (
    <section aria-labelledby="demo-accounts" className="space-y-4">
      <div className="space-y-1">
        <h2 id="demo-accounts" className="font-display text-title-sm text-ink">
          {t('demo.title')}
        </h2>
        <p className="text-body-md text-muted-foreground">{t('demo.intro')}</p>
        <p className="text-body-sm text-muted-foreground">
          <Trans
            t={t}
            i18nKey="demo.password"
            values={{ password: demo.data.password, code: demo.data.code }}
            components={{ value: <bdi dir="ltr" className="font-semibold text-foreground" /> }}
          />
        </p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {demo.data.accounts.map((account) => (
          <li key={account.userId}>
            <button
              type="button"
              disabled={signIn.isPending}
              onClick={() => signIn.mutate(account.userId)}
              aria-label={t('demo.signInAs', { name: account.fullName })}
              className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:opacity-60"
            >
              <Avatar name={account.fullName} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label-md text-foreground">{account.fullName}</span>
                <span className="block truncate text-caption text-muted-foreground">
                  {t(`roles.${account.roleLabel}`)} · <span dir="ltr">{account.identifier}</span>
                </span>
              </span>
              <ArrowRight aria-hidden="true" className="rtl-flip size-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      {demo.data.invitationPath && (
        <Link to={demo.data.invitationPath} className="flex items-center gap-2 text-label-md text-primary hover:underline">
          <MailPlus aria-hidden="true" className="size-4" />
          {t('demo.invitation')}
        </Link>
      )}
      {demo.data.reminderPath && (
        <Link to={demo.data.reminderPath} className="flex items-center gap-2 text-label-md text-primary hover:underline">
          <MessageSquareText aria-hidden="true" className="size-4" />
          {t('demo.reminder')}
        </Link>
      )}
    </section>
  );
}
