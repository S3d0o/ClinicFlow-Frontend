import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Service } from '@/features/catalog/model/catalog';
import type { Branch } from '@/features/org/model/branch';
import { branchName } from '@/features/org/model/branch-access';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatMoney } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/Field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useDoctorSlots } from '../hooks/use-directory';
import type { DoctorProfile } from '../model/doctor';
import { bookingPath } from '../model/links';
import { BOOKING_DAYS } from '../model/slots';
import { PriceSummary } from './PriceSummary';
import { SlotPicker } from './SlotPicker';



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
 * Booking itself is the patient portal's job; this hands over the choices.
 */
export function BookingCard({ doctor, branches, services, initialBranchId, initialSlotId }: BookingCardProps) {
  const { t } = useTranslation('doctors');
  const { language } = useLanguage();
  const navigate = useNavigate();

  const doctorBranches = branches.filter((b) => doctor.branchIds.includes(b.id));
  const offered = doctor.services.filter((offer) => offer.prices.length > 0);
  const [branchId, setBranchId] = useState(
    initialBranchId && doctor.branchIds.includes(initialBranchId) ? initialBranchId : doctor.branchIds[0]
  );
  const [serviceId, setServiceId] = useState(
    () => offered.find((o) => services.find((s) => s.id === o.serviceId)?.category === 'Consultation')?.serviceId ?? offered[0]?.serviceId
  );
  const [slotId, setSlotId] = useState<string | null>(initialSlotId ?? null);
  const [payDeposit, setPayDeposit] = useState(false);

  const slots = useDoctorSlots(doctor.id, branchId ? { branchId, days: BOOKING_DAYS } : null);
  const branch = doctorBranches.find((b) => b.id === branchId);
  const offer = offered.find((o) => o.serviceId === serviceId);
  const price = offer?.prices.find((p) => p.branchId === branchId)?.price;
  const selectedSlot = slots.data?.find((s) => s.id === slotId && s.available);

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
          <Select
            value={branchId}
            onValueChange={(id) => {
              setBranchId(id);
              setSlotId(null);
            }}
          >
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

      <SlotPicker
        key={branchId}
        slots={slots.data}
        isPending={slots.isPending}
        isError={slots.isError}
        onRetry={() => void slots.refetch()}
        timeZone={branch?.timeZone}
        selectedSlotId={slotId}
        onSelect={setSlotId}
      />

      {price !== undefined && <PriceSummary price={price} depositAmount={offer?.depositAmount} payDeposit={payDeposit} onPayDepositChange={setPayDeposit} />}

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
