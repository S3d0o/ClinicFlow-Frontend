import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { formatInstant, formatList, formatNumber } from '@/shared/lib/intl';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatTile } from '@/shared/ui/StatTile';
import { StatusChip, type Tone } from '@/shared/ui/StatusChip';
import type { SubscriptionStatus } from '../api/entitlements.service';
import { DemoPlanSwitcher } from '../components/DemoPlanSwitcher';
import { ModuleList } from '../components/ModuleList';
import { useDemoPlatform, usePlans, useSubscription } from '../hooks/use-entitlements';
import { ADD_ON_MODULES, CORE_MODULES } from '../model/modules';

const STATUS_TONE: Record<SubscriptionStatus, Tone> = { Trial: 'info', Active: 'success', PastDue: 'warning', Lapsed: 'danger' };

// The organization's own calendar (ADR 0008 subscriptions are per organization, not per branch)
const ORGANIZATION_ZONE = 'Africa/Cairo';

/** The clinic's plan, its limits and usage, and every module with its state (ADR 0008; release R1). */
export default function SubscriptionPage() {
  const { t } = useTranslation(['entitlements', 'screens']);
  const { language } = useLanguage();
  const subscription = useSubscription();
  const plans = usePlans();
  const demo = useDemoPlatform();

  if (subscription.isPending || plans.isPending) return <LoadingState />;
  if (subscription.isError || plans.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void subscription.refetch();
          void plans.refetch();
        }}
      />
    );
  }

  const sub = subscription.data;
  const enabled = new Set(sub.modules);
  const extras = new Set(sub.overrides.filter((o) => o.enabled).map((o) => o.module));
  const periodEnd = formatInstant(sub.currentPeriodEnd, language, ORGANIZATION_ZONE, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <PageHeader title={t('screens:subscription')} description={t('description')} />

      <section aria-labelledby="current-plan" className="space-y-2 rounded-xl border border-border bg-card p-5 shadow-card">
        <p className="eyebrow">{t('plan.title')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="current-plan" className="font-display text-headline-lg text-ink">
            {t(`plan.names.${sub.planCode}`)}
          </h2>
          <StatusChip tone={STATUS_TONE[sub.status]}>{t(`plan.status.${sub.status}`)}</StatusChip>
        </div>
        <p className="text-body-md text-muted-foreground">{t('plan.renews', { date: periodEnd })}</p>
      </section>

      <section aria-labelledby="usage" className="space-y-3">
        <h2 id="usage" className="font-display text-headline-md text-ink">
          {t('usage.title')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {sub.usage.map((usage) => {
            const over = usage.used > usage.included;
            return (
              <StatTile
                key={usage.key}
                label={t(`usage.${usage.key}`)}
                value={formatNumber(usage.used, language)}
                hint={
                  <>
                    {t('usage.of', { included: formatNumber(usage.included, language) })}
                    {over && <span className="mt-1 block text-warning">{t('usage.over')}</span>}
                  </>
                }
                className={cn(over && 'border-warning/40')}
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="core-modules" className="space-y-3">
        <div className="space-y-1">
          <h2 id="core-modules" className="font-display text-headline-md text-ink">
            {t('modules.core')}
          </h2>
          <p className="text-body-md text-muted-foreground">{t('modules.coreHint')}</p>
        </div>
        <ModuleList modules={CORE_MODULES} enabled={enabled} />
      </section>

      <section aria-labelledby="add-ons" className="space-y-3">
        <div className="space-y-1">
          <h2 id="add-ons" className="font-display text-headline-md text-ink">
            {t('modules.addOns')}
          </h2>
          <p className="text-body-md text-muted-foreground">{t('modules.addOnsHint')}</p>
        </div>
        <ModuleList modules={ADD_ON_MODULES} enabled={enabled} extras={extras} />
      </section>

      <section aria-labelledby="plans" className="space-y-3">
        <h2 id="plans" className="font-display text-headline-md text-ink">
          {t('compare.title')}
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {plans.data.map((plan) => {
            const current = plan.code === sub.planCode;
            return (
              <li
                key={plan.code}
                aria-current={current ? 'true' : undefined}
                className={cn(
                  'space-y-3 rounded-xl border bg-card p-5 shadow-card',
                  current ? 'border-primary ring-1 ring-primary' : 'border-border'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-headline-md text-ink">{t(`plan.names.${plan.code}`)}</h3>
                  {current && <StatusChip tone="primary">{t('compare.current')}</StatusChip>}
                </div>
                <div className="space-y-1">
                  <p className="text-label-md text-muted-foreground">{t('compare.includes')}</p>
                  {plan.modules.length === 0 ? (
                    <p className="text-body-md text-foreground">{t('compare.coreOnly')}</p>
                  ) : (
                    <ul className="space-y-1">
                      {plan.modules.map((module) => (
                        <li key={module} className="flex items-center gap-2 text-body-md text-foreground">
                          <Check aria-hidden="true" className="size-4 text-success" />
                          {t(`modules.names.${module}`)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-label-md text-muted-foreground">{t('compare.limits')}</p>
                  <p className="text-body-md text-foreground">
                    {formatList(
                      [
                        `${t('usage.branches')}: ${formatNumber(plan.limits.branches, language)}`,
                        `${t('usage.doctors')}: ${formatNumber(plan.limits.doctors, language)}`,
                        `${t('usage.phoneMessagesPerMonth')}: ${formatNumber(plan.limits.phoneMessagesPerMonth, language)}`,
                      ],
                      language
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {demo.available && <DemoPlanSwitcher plans={plans.data} current={sub.planCode} enabled={enabled} />}
    </div>
  );
}
