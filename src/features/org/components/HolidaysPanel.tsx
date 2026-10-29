import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarX, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage, useValidationMessage } from '@/shared/i18n/use-messages';
import { formatDay } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { useAddHoliday, useHolidays, useRemoveHoliday } from '../hooks/use-org-admin';
import { holidaySchema, type HolidayValues } from '../model/branch-admin';

/** Closures of a branch or of every branch, single days or ranges, yearly or once (FR-ORG-03). */
export function HolidaysPanel({ branchId, today }: { branchId: string; today: string }) {
  const { t } = useTranslation(['orgAdmin', 'common']);
  const { language } = useLanguage();
  const validation = useValidationMessage();
  const errorMessage = useErrorMessage();
  const holidays = useHolidays(branchId);
  const add = useAddHoliday();
  const remove = useRemoveHoliday();
  const [adding, setAdding] = useState(false);
  const empty: HolidayValues = { nameEn: '', nameAr: '', from: today, to: today, recursYearly: false, allBranches: false };
  const form = useForm<HolidayValues>({ resolver: zodResolver(holidaySchema), defaultValues: empty });
  const { errors } = form.formState;

  if (holidays.isPending) return <LoadingState />;
  if (holidays.isError) return <ErrorState onRetry={() => void holidays.refetch()} />;

  const open = (next: boolean) => {
    if (next) {
      form.reset(empty);
      add.reset();
    }
    setAdding(next);
  };

  const submit = form.handleSubmit(({ allBranches, ...values }) =>
    add.mutate(
      { ...values, branchId: allBranches ? null : branchId },
      {
        onSuccess: ({ affectedAppointments }) => {
          toast.success(affectedAppointments > 0 ? t('holidays.addedAffecting', { count: affectedAppointments }) : t('holidays.added'));
          setAdding(false);
        },
      }
    )
  );

  const sorted = [...holidays.data].sort((a, b) => a.from.slice(5).localeCompare(b.from.slice(5)));
  const dateOf = (date: string, yearly: boolean) => formatDay(date, language, yearly ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => open(true)}>
          <Plus aria-hidden="true" />
          {t('holidays.add')}
        </Button>
      </div>
      {remove.error && <FormAlert>{errorMessage(remove.error)}</FormAlert>}
      {sorted.length === 0 ? (
        <EmptyState icon={<CalendarX />} title={t('holidays.emptyTitle')} description={t('holidays.emptyBody')} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {sorted.map((holiday) => (
            <li key={holiday.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="space-y-1.5">
                <p className="text-label-md text-foreground">{nameIn(holiday, language)}</p>
                <p className="text-body-sm text-muted-foreground">
                  {holiday.from === holiday.to
                    ? dateOf(holiday.from, holiday.recursYearly)
                    : t('holidays.range', { from: dateOf(holiday.from, holiday.recursYearly), to: dateOf(holiday.to, holiday.recursYearly) })}
                </p>
                <span className="flex flex-wrap gap-1.5">
                  {holiday.recursYearly && <StatusChip tone="info">{t('holidays.yearly')}</StatusChip>}
                  <StatusChip tone="neutral">{t(holiday.branchId ? 'holidays.thisBranch' : 'holidays.everyBranch')}</StatusChip>
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('holidays.remove', { name: nameIn(holiday, language) })}
                disabled={remove.isPending}
                onClick={() => remove.mutate(holiday.id)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={adding} onOpenChange={open}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('holidays.addTitle')}</DialogTitle>
          </DialogHeader>
          <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
            {add.error && <FormAlert>{errorMessage(add.error)}</FormAlert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('holidays.nameEn')} error={validation(errors.nameEn?.message, { max: 80 })} required>
                {(control) => <Input {...control} {...form.register('nameEn')} dir="ltr" />}
              </Field>
              <Field label={t('holidays.nameAr')} error={validation(errors.nameAr?.message, { max: 80 })} required>
                {(control) => <Input {...control} {...form.register('nameAr')} dir="rtl" />}
              </Field>
              <Field label={t('holidays.from')} error={validation(errors.from?.message)} required>
                {(control) => <Input {...control} {...form.register('from')} type="date" />}
              </Field>
              <Field label={t('holidays.to')} error={validation(errors.to?.message)} required>
                {(control) => <Input {...control} {...form.register('to')} type="date" />}
              </Field>
            </div>
            <Checkbox id="holiday-yearly" label={t('holidays.yearlyLabel')} {...form.register('recursYearly')} />
            <Checkbox id="holiday-all" label={t('holidays.allBranchesLabel')} {...form.register('allBranches')} />
            <p className="text-body-sm text-muted-foreground">{t('holidays.effect')}</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => open(false)}>
                {t('common:actions.cancel')}
              </Button>
              <Button type="submit" disabled={add.isPending}>
                {t('holidays.addConfirm')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
