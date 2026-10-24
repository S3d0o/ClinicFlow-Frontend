import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { priceBreakdown } from '@/features/catalog/model/pricing';
import type { Service } from '@/features/catalog/model/catalog';
import type { Branch } from '@/features/org/model/branch';
import { branchName } from '@/features/org/model/branch-access';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatDay, formatMoney, formatWallClock } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Field } from '@/shared/ui/Field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { useDayLabel } from '../hooks/use-day-label';
import { useDoctorSlots } from '../hooks/use-directory';
import type { DoctorProfile } from '../model/doctor';
import { bookingPath } from '../model/links';
import { slotDays, slotsByPeriod } from '../model/slots';

const BOOKING_DAYS = 14;

interface BookingCardProps {
  doctor: DoctorProfile;
  branches: Branch[];
  services: Service[];
  /** A branch and slot picked before arriving (from a search result). */
  initialBranchId?: string;
  initialSlotId?: string;
}

/**
 * Pick a branch, service, day and time, see the price split before going on (FR-PAT-02, U4).
 * Booking itself is the patient portal's job (phase 2); this hands over the choices.
 */
export function BookingCard({ doctor, branches, services, initialBranchId, initialSlotId }: BookingCardProps) {
  const { t } = useTranslation('doctors');
  const { language } = useLanguage();
  const navigate = useNavigate();
  const dayLabel = useDayLabel();

  const doctorBranches = branches.filter((b) => doctor.branchIds.includes(b.id));
  const offered = doctor.services.filter((offer) => offer.prices.length > 0);
  const [branchId, setBranchId] = useState(
    initialBranchId && doctor.branchIds.includes(initialBranchId) ? initialBranchId : doctor.branchIds[0]
  );
  const [serviceId, setServiceId] = useState(
    () => offered.find((o) => services.find((s) => s.id === o.serviceId)?.category === 'Consultation')?.serviceId ?? offered[0]?.serviceId
  );
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(initialSlotId ?? null);
  const [payDeposit, setPayDeposit] = useState(false);

  const slots = useDoctorSlots(doctor.id, branchId ? { branchId, days: BOOKING_DAYS } : null);
  const branch = doctorBranches.find((b) => b.id === branchId);
  const offer = offered.find((o) => o.serviceId === serviceId);
  const price = offer?.prices.find((p) => p.branchId === branchId)?.price;

  const days = slotDays(slots.data ?? []);
  const selectedSlot = slots.data?.find((s) => s.id === slotId && s.available);
  const date = pickedDate ?? selectedSlot?.date ?? days.find((d) => d.hasFree)?.date ?? null;
  const breakdown = price !== undefined ? priceBreakdown(price, offer?.depositAmount, payDeposit) : null;

  const chooseBranch = (id: string) => {
    setBranchId(id);
    setPickedDate(null);
    setSlotId(null);
  };

  return (
    <section aria-labelledby="booking-title" className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
      <header className="space-y-1 border-b border-border pb-4">
        <h2 id="booking-title" className="font-display text-headline-md text-ink">
          {t('booking.title')}
        </h2>
        <p className="text-body-sm text-muted-foreground">{t('booking.intro')}</p>
      </header>

      <Field label={t('booking.branch')}>
        {(control) => (
          <Select value={branchId} onValueChange={chooseBranch}>
            <SelectTrigger id={control.id} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {doctorBranches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {branchName(b, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <Field label={t('booking.service')}>
        {(control) => (
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger id={control.id} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {offered.map((o) => {
                const service = services.find((s) => s.id === o.serviceId);
                const at = o.prices.find((p) => p.branchId === branchId)?.price;
                return (
                  <SelectItem key={o.serviceId} value={o.serviceId}>
                    {service ? nameIn(service, language) : o.serviceId}
                    {at !== undefined && ` · ${formatMoney(at, language)}`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </Field>

      {slots.isPending ? (
        <LoadingState className="py-6" />
      ) : slots.isError ? (
        <ErrorState className="py-6" onRetry={() => void slots.refetch()} />
      ) : days.length === 0 ? (
        <p className="rounded-lg bg-muted px-3 py-4 text-center text-body-sm text-muted-foreground">{t('booking.noDays')}</p>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-label-md text-foreground">{t('booking.day')}</legend>
            <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {days.map((day) => {
                const active = day.date === date;
                return (
                  <button
                    key={day.date}
                    type="button"
                    aria-pressed={active}
                    disabled={!day.hasFree}
                    onClick={() => {
                      setPickedDate(day.date);
                      setSlotId(null);
                    }}
                    className={cn(
                      'flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-lg border px-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40',
                      active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'
                    )}
                  >
                    <span className={cn('text-caption', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{dayLabel(day.date, branch?.timeZone)}</span>
                    <span className="font-display text-title-sm">{formatDay(day.date, language, { day: 'numeric', month: 'short' })}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {date && (
            <fieldset className="space-y-3">
              <legend className="mb-1 text-label-md text-foreground">{t('booking.time')}</legend>
              {slotsByPeriod(slots.data, date).map((group) => (
                <div key={group.period} className="space-y-2">
                  <p className="text-caption text-muted-foreground">{t(`booking.${group.period}`)}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.slots.map((slot) => {
                      const active = slot.id === selectedSlot?.id;
                      const time = formatWallClock(slot.startTime, language);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          aria-pressed={active}
                          disabled={!slot.available}
                          aria-label={slot.available ? undefined : `${time}, ${t('booking.taken')}`}
                          onClick={() => setSlotId(slot.id)}
                          className={cn(
                            'min-h-10 rounded-lg border text-label-md tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active && 'border-primary bg-primary text-primary-foreground',
                            !active && slot.available && 'border-border bg-card hover:border-primary hover:text-primary',
                            !slot.available && 'cursor-not-allowed border-border bg-muted text-muted-foreground line-through'
                          )}
                        >
                          <bdi dir="ltr">{time}</bdi>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </fieldset>
          )}
        </>
      )}

      {breakdown && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-4 text-body-md">
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('booking.price')}</span>
            <span className="font-display text-headline-md text-ink">{formatMoney(breakdown.price, language)}</span>
          </p>
          {offer?.depositAmount ? (
            <>
              <Checkbox
                id="booking-deposit"
                checked={payDeposit}
                onChange={(e) => setPayDeposit(e.target.checked)}
                label={t('booking.deposit', { amount: formatMoney(offer.depositAmount, language) })}
                description={t('booking.depositHint')}
              />
              {payDeposit && (
                <p className="flex items-center justify-between text-body-sm">
                  <span className="text-muted-foreground">{t('booking.payNow')}</span>
                  <span className="font-semibold">{formatMoney(breakdown.paidNow, language)}</span>
                </p>
              )}
            </>
          ) : null}
          <p className="flex items-center justify-between border-t border-border pt-3 text-body-sm">
            <span className="text-muted-foreground">{t('booking.payAtDesk')}</span>
            <span className="font-semibold">{formatMoney(breakdown.payAtDesk, language)}</span>
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full"
          disabled={!selectedSlot || !serviceId}
          onClick={() => selectedSlot && serviceId && navigate(bookingPath(doctor.id, { branchId, serviceId, slotId: selectedSlot.id, deposit: payDeposit }))}
        >
          {t('booking.continue')}
        </Button>
        {!selectedSlot && <p className="text-center text-body-sm text-muted-foreground">{t('booking.chooseTime')}</p>}
        <p className="flex items-start justify-center gap-1.5 text-center text-body-sm text-muted-foreground">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
          {t('booking.cancelNote')}
        </p>
      </div>
    </section>
  );
}
