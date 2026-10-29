import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { cn } from '@/shared/lib/cn';
import { formatList } from '@/shared/lib/intl';
import { StatusChip } from '@/shared/ui/StatusChip';
import { MODULE_REQUIRES, isCoreModule, type ModuleCode } from '../model/modules';

interface ModuleListProps {
  modules: readonly ModuleCode[];
  enabled: ReadonlySet<ModuleCode>;
  /** Add-ons switched on beyond the plan. */
  extras?: ReadonlySet<ModuleCode>;
}

/** One card per module: its name, what it does, whether it's on, and what it needs. */
export function ModuleList({ modules, enabled, extras }: ModuleListProps) {
  const { t } = useTranslation('entitlements');
  const { language } = useLanguage();
  const names = (codes: readonly ModuleCode[]) => formatList(codes.map((code) => t(`modules.names.${code}`)), language);

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {modules.map((module) => {
        const on = enabled.has(module);
        const needs = isCoreModule(module) ? [] : (MODULE_REQUIRES[module] ?? []);
        return (
          <li
            key={module}
            className={cn('flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-card', !on && 'bg-muted/40')}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={cn('text-title-sm', on ? 'text-ink' : 'text-muted-foreground')}>{t(`modules.names.${module}`)}</p>
              <StatusChip tone={on ? 'success' : 'neutral'}>{t(on ? 'modules.on' : 'modules.off')}</StatusChip>
            </div>
            <p className="text-body-sm text-muted-foreground">{t(`modules.descriptions.${module}`)}</p>
            {(extras?.has(module) || needs.length > 0) && (
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                {extras?.has(module) && <StatusChip tone="highlight">{t('modules.extra')}</StatusChip>}
                {needs.length > 0 && <span className="text-caption text-muted-foreground">{t('modules.needs', { list: names(needs) })}</span>}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
