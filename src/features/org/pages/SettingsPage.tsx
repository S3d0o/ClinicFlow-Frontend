import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { SettingsSectionCard } from '../components/SettingsSectionCard';
import { useOrganizationProfile, useOrganizationSettings, useSaveProfile } from '../hooks/use-org-admin';
import { SETTINGS_SECTIONS, profileSchema, type OrganizationProfile, type SettingsSection } from '../model/organization';

const PROFILE_FIELDS: { key: keyof OrganizationProfile; dir: 'ltr' | 'rtl' | 'auto'; type?: string }[] = [
  { key: 'legalName', dir: 'auto' },
  { key: 'brandNameEn', dir: 'ltr' },
  { key: 'brandNameAr', dir: 'rtl' },
  { key: 'taxNumber', dir: 'ltr' },
  { key: 'commercialRegistration', dir: 'ltr' },
  { key: 'phone', dir: 'ltr', type: 'tel' },
  { key: 'email', dir: 'ltr', type: 'email' },
];

/** The organization profile shown on invoices and receipts (FR-ORG-01). */
function ProfileForm({ profile }: { profile: OrganizationProfile }) {
  const { t } = useTranslation(['orgAdmin', 'common']);
  const validation = useValidationMessage();
  const errorMessage = useErrorMessage();
  const save = useSaveProfile();
  const form = useForm<OrganizationProfile>({ resolver: zodResolver(profileSchema), defaultValues: profile });
  const { errors } = form.formState;

  useEffect(() => form.reset(profile), [profile, form]);

  const submit = form.handleSubmit((values) => save.mutate(values, { onSuccess: () => toast.success(t('profile.saved')) }));

  return (
    <section aria-labelledby="org-profile" className="rounded-xl border border-border bg-card shadow-card">
      <div className="space-y-1 border-b border-border p-5">
        <h2 id="org-profile" className="font-display text-headline-md text-ink">
          {t('profile.title')}
        </h2>
        <p className="text-body-sm text-muted-foreground">{t('profile.hint')}</p>
      </div>
      <form noValidate onSubmit={(event) => void submit(event)}>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {save.error && <FormAlert className="sm:col-span-2">{errorMessage(save.error)}</FormAlert>}
          {PROFILE_FIELDS.map(({ key, dir, type }) => (
            <Field key={key} label={t(`profile.fields.${key}`)} error={validation(errors[key]?.message, { max: 150 })} required>
              {(control) => <Input {...control} {...form.register(key)} dir={dir} type={type} />}
            </Field>
          ))}
        </div>
        <div className="flex justify-end border-t border-border p-4">
          <Button type="submit" disabled={save.isPending}>
            {t('profile.save')}
          </Button>
        </div>
      </form>
    </section>
  );
}

/** The organization profile and the clinic's rules (FR-ORG-01, FR-ORG-05; design admin/06). */
export default function SettingsPage() {
  const { t } = useTranslation(['orgAdmin', 'screens']);
  const profile = useOrganizationProfile();
  const settings = useOrganizationSettings();

  if (profile.isPending || settings.isPending) return <LoadingState />;
  if (profile.isError || settings.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void profile.refetch();
          void settings.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('screens:settings')} description={t('settings.description')} />
      <p className="flex gap-2 rounded-xl border border-info/30 bg-info/10 p-3 text-body-sm text-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
        {t('settings.audited')}
      </p>
      <ProfileForm profile={profile.data} />
      <div className="grid gap-6 xl:grid-cols-2">
        {(Object.keys(SETTINGS_SECTIONS) as SettingsSection[]).map((section) => (
          <SettingsSectionCard key={`${section}-${settings.dataUpdatedAt}`} section={section} settings={settings.data} />
        ))}
      </div>
    </div>
  );
}
