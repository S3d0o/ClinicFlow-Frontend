import { useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronRight, Clock, KeyRound, Languages, LogOut, MessageSquare, Stethoscope, UserRound } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AddEmailForm } from '@/features/auth/components/AddEmailForm';
import { useSignOutAndLeave } from '@/features/auth/hooks/use-sign-out-and-leave';
import { fullNativeNameOf, LANGUAGES, type Language } from '@/shared/i18n/languages';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatDay, formatList } from '@/shared/lib/intl';
import { formatEgyptianPhone } from '@/shared/lib/phone';
import { cn } from '@/shared/lib/cn';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { ChoiceCard } from '@/shared/ui/ChoiceCard';
import { FormAlert } from '@/shared/ui/FormAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { ChangePasswordDialog } from '../components/ChangePasswordDialog';
import { ChangePhoneDialog } from '../components/ChangePhoneDialog';
import { useMyProfile, useUpdatePreferences } from '../hooks/use-profile';
import { channelAllowed, type NotificationChannel } from '../model/profile';

const CHANNELS: NotificationChannel[] = ['Phone', 'Email', 'Both'];

function Card({ title, icon, aside, children }: { title: string; icon: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-title-sm text-ink">
          {icon}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Profile and settings (design patient/17, FR-ACC-05, FR-ACC-06, FR-NTF-04). */
export default function ProfilePage() {
  const { t } = useTranslation(['profile', 'screens']);
  const { language, setLanguage } = useLanguage();
  const errorMessage = useErrorMessage();
  const profile = useMyProfile();
  const update = useUpdatePreferences();
  const { signOut, isPending: signingOut } = useSignOutAndLeave();
  const [dialog, setDialog] = useState<'phone' | 'password' | null>(null);

  if (profile.isPending) return <LoadingState />;
  if (profile.isError) return <ErrorState onRetry={() => void profile.refetch()} />;
  const me = profile.data;

  const chooseLanguage = (next: Language) => {
    setLanguage(next);
    update.mutate({ preferredLanguage: next }, { onSuccess: () => toast.success(t('language.saved')) });
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('screens:profile')} />

      <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <Avatar name={me.fullName} size="lg" />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p dir="auto" className="font-display text-headline-md text-ink">
              {me.fullName}
            </p>
            <StatusChip tone="success">{t('header.active')}</StatusChip>
          </div>
          <p className="text-body-sm text-muted-foreground">
            <Trans t={t} i18nKey="header.mrn" values={{ mrn: me.mrn }} components={{ num: <bdi dir="ltr" /> }} />
          </p>
          <p className="text-body-sm text-muted-foreground">{t('header.since', { date: formatDay(me.memberSince, language, { month: 'long', year: 'numeric' }) })}</p>
        </div>
      </section>

      <Card title={t('contact.title')} icon={<UserRound aria-hidden="true" className="size-4 text-primary" />}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-caption text-muted-foreground">{t('contact.phone')}</p>
            <p className="font-display text-title-sm text-ink">
              <bdi dir="ltr">{formatEgyptianPhone(me.phone)}</bdi>
            </p>
            {me.phoneVerified && (
              <p className="inline-flex items-center gap-1 text-caption text-success">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                {t('contact.verified')}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setDialog('phone')}>
            {t('contact.changePhone')}
          </Button>
        </div>
        <div className="space-y-3">
          <p className="text-caption text-muted-foreground">{t('contact.email')}</p>
          {me.email && me.emailConfirmed ? (
            <p className="flex flex-wrap items-center gap-2">
              <bdi dir="ltr" className="text-body-md text-foreground">
                {me.email}
              </bdi>
              <span className="inline-flex items-center gap-1 text-caption text-success">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                {t('contact.verified')}
              </span>
            </p>
          ) : (
            <>
              {me.email ? (
                <p className="flex flex-wrap items-center gap-2">
                  <bdi dir="ltr" className="text-body-md text-foreground">
                    {me.email}
                  </bdi>
                  <span className="inline-flex items-center gap-1 text-caption text-warning">
                    <Clock aria-hidden="true" className="size-3.5" />
                    {t('contact.notConfirmed')}
                  </span>
                </p>
              ) : (
                <p className="text-body-md italic text-muted-foreground">{t('contact.noEmail')}</p>
              )}
              <AddEmailForm pendingEmail={me.email} next="/patient/profile" />
            </>
          )}
        </div>
      </Card>

      <Card title={t('channel.title')} icon={<MessageSquare aria-hidden="true" className="size-4 text-primary" />}>
        <fieldset className="space-y-3">
          <legend className="text-body-sm text-muted-foreground">{t('channel.intro')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {CHANNELS.map((channel) => {
              const allowed = channelAllowed(channel, me.emailConfirmed);
              return (
                <label
                  key={channel}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-2 text-label-md transition-colors',
                    'has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                    allowed ? 'border-border hover:border-primary' : 'cursor-not-allowed border-border bg-muted text-muted-foreground'
                  )}
                >
                  <input
                    type="radio"
                    name="channel"
                    value={channel}
                    checked={me.notificationChannel === channel}
                    disabled={!allowed || update.isPending}
                    onChange={() => update.mutate({ notificationChannel: channel }, { onSuccess: () => toast.success(t('channel.saved')) })}
                    className="sr-only"
                  />
                  {t(`channel.${channel}`)}
                </label>
              );
            })}
          </div>
        </fieldset>
        <p className="text-body-sm text-muted-foreground">{t('channel.phoneHint')}</p>
        {!me.emailConfirmed && <p className="rounded-lg bg-info/10 p-3 text-body-sm text-info">{t('channel.needsEmail')}</p>}
        {update.isError && <FormAlert>{errorMessage(update.error)}</FormAlert>}
      </Card>

      <Card title={t('language.title')} icon={<Languages aria-hidden="true" className="size-4 text-primary" />}>
        <fieldset className="space-y-2">
          <legend className="text-body-sm text-muted-foreground">{t('language.intro')}</legend>
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((option) => (
              <ChoiceCard
                key={option}
                name="language"
                value={option}
                lang={option}
                checked={language === option}
                onChange={() => chooseLanguage(option)}
                label={fullNativeNameOf(option)}
              />
            ))}
          </div>
        </fieldset>
      </Card>

      <Card
        title={t('medical.title')}
        icon={<Stethoscope aria-hidden="true" className="size-4 text-primary" />}
        aside={<span className="rounded-md bg-muted px-2 py-0.5 text-caption text-muted-foreground">{t('medical.badge')}</span>}
      >
        <dl className="divide-y divide-border rounded-xl border border-border text-body-md">
          <div className="flex items-center justify-between gap-3 p-3">
            <dt className="text-muted-foreground">{t('medical.bloodType')}</dt>
            <dd className="font-semibold">{me.bloodType ? <bdi dir="ltr">{me.bloodType}</bdi> : t('medical.none')}</dd>
          </div>
          <div className="space-y-2 p-3">
            <dt className="text-muted-foreground">{t('medical.allergies')}</dt>
            <dd className="flex flex-wrap gap-2">
              {me.allergies.length === 0
                ? t('medical.none')
                : me.allergies.map((allergy) => (
                    <StatusChip key={allergy.name} tone={allergy.severity === 'Severe' ? 'danger' : 'neutral'}>
                      <span dir="auto">{allergy.name}</span>
                      {allergy.severity && ` (${t(`medical.severity.${allergy.severity}`)})`}
                    </StatusChip>
                  ))}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3 p-3">
            <dt className="text-muted-foreground">{t('medical.conditions')}</dt>
            <dd dir="auto" className="text-end">
              {me.conditions.length ? formatList(me.conditions, language) : t('medical.none')}
            </dd>
          </div>
        </dl>
        <p className="text-body-sm text-muted-foreground">{t('medical.note')}</p>
      </Card>

      <button
        type="button"
        onClick={() => setDialog('password')}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 text-start text-label-md text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <KeyRound aria-hidden="true" className="size-4 text-primary" />
        <span className="flex-1">{t('password.title')}</span>
        <ChevronRight aria-hidden="true" className="rtl-flip size-4 text-muted-foreground" />
      </button>
      <Button variant="outline" size="lg" className="w-full" disabled={signingOut} onClick={signOut}>
        <LogOut aria-hidden="true" className="rtl-flip" />
        {t('signOut')}
      </Button>

      {dialog === 'phone' && <ChangePhoneDialog onClose={() => setDialog(null)} />}
      {dialog === 'password' && <ChangePasswordDialog onClose={() => setDialog(null)} />}
    </div>
  );
}
