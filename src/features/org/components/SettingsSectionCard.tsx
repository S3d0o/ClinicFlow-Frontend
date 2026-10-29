import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatNumber } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { useSaveSettings } from '../hooks/use-org-admin';
import { DEFAULT_SETTINGS, SETTINGS_SECTIONS, SETTING_BOUNDS, type NumberSettingKey, type OrganizationSettings, type SettingsSection } from '../model/organization';

interface SettingsSectionCardProps {
  section: SettingsSection;
  settings: OrganizationSettings;
}

type Draft = Record<string, string | boolean>;

/**
 * One group of clinic rules, each with its default and bounds, saved together (FR-ORG-05). The parent
 * remounts it (`key`) when the saved settings change, so the draft starts from them.
 */
export function SettingsSectionCard({ section, settings }: SettingsSectionCardProps) {
  const { t } = useTranslation(['orgAdmin', 'common']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const save = useSaveSettings();
  const keys = SETTINGS_SECTIONS[section] as readonly (keyof OrganizationSettings)[];
  const toDraft = () => Object.fromEntries(keys.map((key) => [key, typeof settings[key] === 'boolean' ? settings[key] : String(settings[key])])) as Draft;
  const [draft, setDraft] = useState<Draft>(toDraft);

  const problemOf = (key: keyof OrganizationSettings) => {
    const bounds = SETTING_BOUNDS[key];
    const value = draft[key];
    if (!bounds || typeof value === 'boolean') return undefined;
    const number = Number(value);
    return value.trim() === '' || !Number.isInteger(number) || number < bounds.min || number > bounds.max
      ? t('common:validation.wholeNumber', { min: bounds.min, max: bounds.max })
      : undefined;
  };
  const invalid = keys.some((key) => problemOf(key));

  const submit = () => {
    const changes = Object.fromEntries(keys.map((key) => [key, typeof draft[key] === 'boolean' ? draft[key] : Number(draft[key])]));
    save.mutate(changes as Partial<OrganizationSettings>, { onSuccess: () => toast.success(t('settings.saved')) });
  };

  return (
    <section aria-labelledby={`settings-${section}`} className="flex flex-col rounded-xl border border-border bg-card shadow-card">
      <div className="border-b border-border p-5">
        <h2 id={`settings-${section}`} className="font-display text-headline-md text-ink">
          {t(`settings.sections.${section}`)}
        </h2>
      </div>
      <div className="flex-1 space-y-5 p-5">
        {save.error && <FormAlert>{errorMessage(save.error)}</FormAlert>}
        {keys.map((key) => {
          const id = `setting-${key}`;
          const fallback = DEFAULT_SETTINGS[key];
          const defaultText =
            typeof fallback === 'boolean' ? t(fallback ? 'settings.on' : 'settings.off') : `${formatNumber(fallback, language)} ${t(`settings.fields.${key as NumberSettingKey}.unit`)}`;
          const value = draft[key];
          const problem = problemOf(key);
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <label htmlFor={id} className="text-label-md text-foreground">
                  {t(`settings.fields.${key}.label`)}
                </label>
                <span className="shrink-0 text-caption text-muted-foreground">{t('settings.default', { value: defaultText })}</span>
              </div>
              <p id={`${id}-hint`} className="text-body-sm text-muted-foreground">
                {t(`settings.fields.${key}.hint`)}
              </p>
              {typeof value === 'boolean' ? (
                <Switch id={id} aria-describedby={`${id}-hint`} checked={value} onCheckedChange={(checked) => setDraft((d) => ({ ...d, [key]: checked }))} />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    dir="ltr"
                    value={value}
                    aria-describedby={problem ? `${id}-error` : `${id}-hint`}
                    aria-invalid={problem ? true : undefined}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    className="w-36"
                  />
                  <span className="text-body-sm text-muted-foreground">{t(`settings.fields.${key as NumberSettingKey}.unit`)}</span>
                </div>
              )}
              {problem && (
                <p id={`${id}-error`} className="text-body-sm text-destructive">
                  {problem}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end border-t border-border p-4">
        <Button disabled={invalid || save.isPending} onClick={submit}>
          {t('settings.save')}
        </Button>
      </div>
    </section>
  );
}
