import { useState, type FormEvent } from 'react';
import { CalendarClock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { SlotPicker } from '@/features/doctors/components/SlotPicker';
import { useDoctorSlots } from '@/features/doctors/hooks/use-directory';
import { BOOKING_DAYS } from '@/features/doctors/model/slots';
import { isServiceError } from '@/shared/api/service-error';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { Textarea } from '@/shared/ui/textarea';
import { useCancelAppointment, useRescheduleAppointment } from '../hooks/use-appointments';
import type { Appointment, CancellationReasonCode } from '../model/appointment';

const REASONS: CancellationReasonCode[] = ['ScheduleConflict', 'FeelingBetter', 'BookedElsewhere', 'CostOrInsurance', 'Other'];

/** Pick a new time with the doctor at the same branch (FR-APT-05); the deposit moves with it. */
export function RescheduleForm({ appointment, timeZone, onDone }: { appointment: Appointment; timeZone: string; onDone: () => void }) {
  const { t } = useTranslation('appointments');
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const slots = useDoctorSlots(appointment.doctorId, { branchId: appointment.branchId, days: BOOKING_DAYS });
  const reschedule = useRescheduleAppointment(appointment.id);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    if (!slotId) return;
    setError(null);
    reschedule.mutate(slotId, {
      onSuccess: (moved) => {
        toast.success(t('details.rescheduled'));
        onDone();
        navigate(`/patient/appointments/${moved.id}`, { replace: true });
      },
      onError: (err) => {
        setError(isServiceError(err, 'Slot.CapacityReached') ? t('book.slotTaken') : errorMessage(err));
        setSlotId(null);
      },
    });
  };

  // The visit's own slot is shown as taken; it frees up once the move is saved
  return (
    <div className="space-y-4">
      {appointment.depositPaid && <p className="rounded-lg bg-info/10 p-3 text-body-sm text-info">{t('details.depositMoves')}</p>}
      {error && <FormAlert>{error}</FormAlert>}
      <SlotPicker
        slots={slots.data}
        isPending={slots.isPending}
        isError={slots.isError}
        onRetry={() => void slots.refetch()}
        timeZone={timeZone}
        selectedSlotId={slotId}
        onSelect={setSlotId}
      />
      <Button className="w-full" disabled={!slotId || reschedule.isPending} onClick={confirm}>
        <CalendarClock aria-hidden="true" />
        {t('details.confirmReschedule')}
      </Button>
    </div>
  );
}

/** Cancel with a reason code and an optional note (FR-APT-06). */
export function CancelForm({ appointment, onDone }: { appointment: Appointment; onDone: () => void }) {
  const { t } = useTranslation('appointments');
  const errorMessage = useErrorMessage();
  const cancel = useCancelAppointment(appointment.id);
  const [reason, setReason] = useState<CancellationReasonCode>('ScheduleConflict');
  const [note, setNote] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    cancel.mutate(
      { reason, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t('details.cancelled'));
          onDone();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {cancel.isError && <FormAlert>{errorMessage(cancel.error)}</FormAlert>}
      <fieldset className="space-y-1">
        <legend className="mb-2 text-label-md text-foreground">{t('details.cancelReason')}</legend>
        {REASONS.map((code) => (
          <label key={code} className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-accent')}>
            <input type="radio" name="reason" value={code} checked={reason === code} onChange={() => setReason(code)} className="size-4 accent-primary" />
            <span className="text-body-md">{t(`reasons.${code}`)}</span>
          </label>
        ))}
      </fieldset>
      <Field label={t('details.cancelNote')}>
        {(control) => <Textarea {...control} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} rows={2} />}
      </Field>
      <Button type="submit" variant="destructive" className="w-full" disabled={cancel.isPending}>
        <XCircle aria-hidden="true" />
        {t('details.cancelConfirm')}
      </Button>
    </form>
  );
}
