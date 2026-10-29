import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { WEEK_FROM_SATURDAY, formatWeekday } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { Switch } from '@/shared/ui/switch';
import { useBranchHours, useSaveHours } from '../hooks/use-org-admin';
import { hoursProblem, type DayHours } from '../model/branch-admin';

const DEFAULT_RANGE = { from: '09:00', to: '17:00' };

/** A branch's opening hours per weekday, in one or more periods (FR-ORG-03). Slots are never made outside them. */
export function HoursEditor({ branchId }: { branchId: string }) {
  const hours = useBranchHours(branchId);
  if (hours.isPending) return <LoadingState />;
  if (hours.isError) return <ErrorState onRetry={() => void hours.refetch()} />;
  // Remounted when the saved hours change, so the form starts from them
  return <HoursForm key={hours.dataUpdatedAt} branchId={branchId} saved={hours.data} />;
}

function HoursForm({ branchId, saved }: { branchId: string; saved: DayHours[] }) {
  const { t } = useTranslation(['orgAdmin', 'common']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const save = useSaveHours();
  const [days, setDays] = useState<DayHours[]>(() =>
    WEEK_FROM_SATURDAY.map((weekday) => saved.find((d) => d.weekday === weekday) ?? { weekday, ranges: [] })
  );

  const update = (weekday: number, ranges: DayHours['ranges']) => setDays((all) => all.map((d) => (d.weekday === weekday ? { ...d, ranges } : d)));
  const invalid = days.some((d) => hoursProblem(d));

  return (
    <div className="space-y-4">
      {save.error && <FormAlert>{errorMessage(save.error)}</FormAlert>}
      <ul className="divide-y divide-border rounded-xl border border-border">
        {days.map((day) => {
          const name = formatWeekday(day.weekday, language);
          const open = day.ranges.length > 0;
          const problem = hoursProblem(day);
          return (
            <li key={day.weekday} className="grid gap-3 p-3 sm:grid-cols-[9rem_auto_1fr] sm:items-start">
              <span className="pt-2 text-label-md text-foreground">{name}</span>
              <label className="flex items-center gap-2 pt-1.5 text-body-sm">
                <Switch
                  checked={open}
                  aria-label={t('hours.openOn', { day: name })}
                  onCheckedChange={(checked) => update(day.weekday, checked ? [DEFAULT_RANGE] : [])}
                />
                <span className={cn(open ? 'text-foreground' : 'text-muted-foreground')}>{t(open ? 'hours.open' : 'hours.closed')}</span>
              </label>
              {open && (
                <div className="space-y-2">
                  {day.ranges.map((range, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="time"
                        aria-label={t('hours.from', { day: name })}
                        value={range.from}
                        onChange={(e) => update(day.weekday, day.ranges.map((r, i) => (i === index ? { ...r, from: e.target.value } : r)))}
                        className="w-32"
                      />
                      <span aria-hidden="true" className="text-muted-foreground">
                        –
                      </span>
                      <Input
                        type="time"
                        aria-label={t('hours.to', { day: name })}
                        value={range.to}
                        onChange={(e) => update(day.weekday, day.ranges.map((r, i) => (i === index ? { ...r, to: e.target.value } : r)))}
                        className="w-32"
                      />
                      {day.ranges.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('hours.removePeriod')}
                          onClick={() => update(day.weekday, day.ranges.filter((_, i) => i !== index))}
                        >
                          <X aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {day.ranges.length < 3 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                      onClick={() => update(day.weekday, [...day.ranges, { from: day.ranges.at(-1)?.to ?? '09:00', to: '22:00' }])}
                    >
                      <Plus aria-hidden="true" />
                      {t('hours.addPeriod')}
                    </Button>
                  )}
                  {problem && <p className="text-body-sm text-destructive">{t(`hours.errors.${problem}`)}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex justify-end">
        <Button
          disabled={invalid || save.isPending}
          onClick={() => save.mutate({ branchId, hours: days }, { onSuccess: () => toast.success(t('hours.saved')) })}
        >
          {t('hours.save')}
        </Button>
      </div>
    </div>
  );
}
