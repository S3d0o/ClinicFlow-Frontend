import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatList } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Switch } from '@/shared/ui/switch';
import type { Plan, PlanCode } from '../api/entitlements.service';
import { useDemoPlatform } from '../hooks/use-entitlements';
import { ADD_ON_MODULES, requiredBy, type ModuleCode } from '../model/modules';

interface DemoPlanSwitcherProps {
  plans: Plan[];
  current: PlanCode;
  enabled: ReadonlySet<ModuleCode>;
}

/** Demo only: the platform operator's switches, so a presentation can change the plan live. */
export function DemoPlanSwitcher({ plans, current, enabled }: DemoPlanSwitcherProps) {
  const { t } = useTranslation('entitlements');
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const { setPlan, setModule } = useDemoPlatform();
  const busy = setPlan.isPending || setModule.isPending;
  const error = setPlan.error ?? setModule.error;

  return (
    <section aria-labelledby="demo-plan" className="space-y-4 rounded-xl border border-dashed border-info/40 bg-info/5 p-5">
      <div className="space-y-1">
        <h2 id="demo-plan" className="flex items-center gap-2 font-display text-headline-md text-ink">
          <FlaskConical aria-hidden="true" className="size-5 text-info" />
          {t('demo.title')}
        </h2>
        <p className="text-body-md text-muted-foreground">{t('demo.intro')}</p>
      </div>
      {error && <FormAlert>{errorMessage(error)}</FormAlert>}
      <div className="flex flex-wrap gap-2">
        {plans.map((plan) => (
          <Button
            key={plan.code}
            variant={plan.code === current ? 'default' : 'outline'}
            disabled={busy || plan.code === current}
            aria-pressed={plan.code === current}
            onClick={() => setPlan.mutate(plan.code)}
          >
            {t('demo.usePlan', { plan: t(`plan.names.${plan.code}`) })}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-label-md text-foreground">{t('demo.addOns')}</p>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {ADD_ON_MODULES.map((module) => {
            const on = enabled.has(module);
            const neededBy = requiredBy(module, enabled);
            const locked = on && neededBy.length > 0;
            const id = `demo-module-${module}`;
            return (
              <li key={module} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
                <label htmlFor={id} className="min-w-0">
                  <span className="block text-label-md text-foreground">{t(`modules.names.${module}`)}</span>
                  {locked && (
                    <span className="block text-caption text-muted-foreground">
                      {t('demo.requiredBy', { list: formatList(neededBy.map((m) => t(`modules.names.${m}`)), language) })}
                    </span>
                  )}
                </label>
                <Switch
                  id={id}
                  checked={on}
                  disabled={busy || locked}
                  onCheckedChange={(checked) => setModule.mutate({ module, enabled: checked })}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
