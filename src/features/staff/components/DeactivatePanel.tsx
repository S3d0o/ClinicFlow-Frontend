import { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Input } from '@/shared/ui/input';
import { useDeactivateStaff } from '../hooks/use-staff';
import type { StaffMember } from '../model/staff';

interface DeactivatePanelProps {
  member: StaffMember;
  onDone: () => void;
}

/**
 * Ends a member's access now or on a date (FR-STF-04; design admin/03). A doctor's booked visits are
 * counted, since they need another doctor.
 */
export function DeactivatePanel({ member, onDone }: DeactivatePanelProps) {
  const { t } = useTranslation(['staff', 'common']);
  const errorMessage = useErrorMessage();
  const deactivate = useDeactivateStaff();
  // The clinic's calendar (subscriptions and access are organization-wide)
  const { today } = useBranchClock(null);
  const [when, setWhen] = useState<'now' | 'date'>('now');
  const [endDate, setEndDate] = useState(today);

  const confirm = () =>
    deactivate.mutate({ staffId: member.id, endDate: when === 'date' ? endDate : undefined }, { onSuccess: onDone });

  return (
    <section aria-labelledby="deactivate-title" className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/[0.04] p-5">
      <div className="flex gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="space-y-1">
          <h2 id="deactivate-title" className="font-display text-headline-md text-ink">
            {t('deactivate.title', { name: member.fullName })}
          </h2>
          <p className="text-body-md text-muted-foreground">{t('deactivate.body')}</p>
        </div>
      </div>
      {deactivate.error && <FormAlert>{errorMessage(deactivate.error)}</FormAlert>}
      <fieldset className="space-y-3 rounded-xl border border-border bg-card p-4">
        <legend className="sr-only">{t('deactivate.when')}</legend>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="radio" name="deactivate-when" checked={when === 'now'} onChange={() => setWhen('now')} className="mt-1 size-4 accent-primary" />
          <span>
            <span className="block text-label-md text-foreground">{t('deactivate.now')}</span>
            <span className="block text-body-sm text-muted-foreground">{t('deactivate.nowHint')}</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="radio" name="deactivate-when" checked={when === 'date'} onChange={() => setWhen('date')} className="mt-1 size-4 accent-primary" />
          <span className="space-y-2">
            <span className="block text-label-md text-foreground">{t('deactivate.onDate')}</span>
            <span className="block text-body-sm text-muted-foreground">{t('deactivate.onDateHint')}</span>
          </span>
        </label>
        {when === 'date' && (
          <div className="ps-7">
            <label htmlFor="deactivate-date" className="sr-only">
              {t('deactivate.endDate')}
            </label>
            <Input id="deactivate-date" type="date" min={today} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-48" />
          </div>
        )}
      </fieldset>
      {member.upcomingAppointments > 0 && (
        <p className="flex gap-2 rounded-xl border border-info/30 bg-info/10 p-3 text-body-sm text-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
          {t('deactivate.upcoming', { count: member.upcomingAppointments })}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>
          {t('common:actions.cancel')}
        </Button>
        <Button variant="destructive" disabled={deactivate.isPending || (when === 'date' && !endDate)} onClick={confirm}>
          {t('deactivate.confirm')}
        </Button>
      </div>
    </section>
  );
}
