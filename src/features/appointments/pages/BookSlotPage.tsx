import { useState } from 'react';
import { CreditCard, MapPin, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PriceSummary } from '@/features/doctors/components/PriceSummary';
import { RatingBadge } from '@/features/doctors/components/RatingBadge';
import { SlotPicker } from '@/features/doctors/components/SlotPicker';
import { useDoctor, useDoctorSlots } from '@/features/doctors/hooks/use-directory';
import { BOOKING_DAYS } from '@/features/doctors/model/slots';
import { isServiceError } from '@/shared/api/service-error';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { FormAlert } from '@/shared/ui/FormAlert';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { BookingSteps } from '../components/BookingSteps';
import { useBookAppointment, usePayDeposit } from '../hooks/use-appointments';
import { useLookups } from '../hooks/use-lookups';
import { CHANGE_WINDOW_HOURS } from '../model/policy';

/**
 * Booking step 2 (FR-APT-02): a time, the price split with the optional deposit (U4, FR-APT-08) and
 * consent (FR-PAT-08). Booking is confirmed at once; with a deposit the patient goes on to Paymob.
 */
export default function BookSlotPage() {
  const { t } = useTranslation(['appointments', 'doctors', 'common']);
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { doctorId = '' } = useParams();
  const [params] = useSearchParams();
  const doctor = useDoctor(doctorId);
  const { branch, branchLabel, specialtyLabel, serviceLabel } = useLookups();
  const book = useBookAppointment();
  const payDeposit = usePayDeposit();

  const profile = doctor.data;
  const branchId = params.get('branch') && profile?.branchIds.includes(params.get('branch')!) ? params.get('branch')! : profile?.branchIds[0];
  const offer = profile?.services.find((s) => s.serviceId === params.get('service')) ?? profile?.services[0];
  const price = offer?.prices.find((p) => p.branchId === branchId)?.price;
  const slots = useDoctorSlots(doctorId, branchId ? { branchId, days: BOOKING_DAYS } : null);

  const [slotId, setSlotId] = useState<string | null>(params.get('slot'));
  const [withDeposit, setWithDeposit] = useState(params.get('deposit') === '1');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState(false);

  if (doctor.isPending) return <LoadingState />;
  if (doctor.isError || !profile || !branchId || !offer) return <ErrorState onRetry={() => void doctor.refetch()} />;

  const selected = slots.data?.find((s) => s.id === slotId && s.available);

  const confirm = async () => {
    if (!selected) return;
    if (!accepted) return setTermsError(true);
    setError(null);
    try {
      const appointment = await book.mutateAsync({ doctorId, branchId, serviceId: offer.serviceId, slotId: selected.id, acceptTerms: true });
      if (withDeposit && appointment.depositAmount) payDeposit.mutate(appointment.id);
      else navigate(`/patient/booked/${appointment.id}`, { replace: true });
    } catch (err) {
      if (isServiceError(err, 'Slot.CapacityReached')) {
        setError(t('book.slotTaken'));
        setSlotId(null);
        void slots.refetch();
      } else setError(errorMessage(err));
    }
  };

  return (
    <div className="space-y-5 pb-28 md:pb-0">
      <BookingSteps step={2} backTo={`/patient/book?branch=${branchId}&service=${offer.serviceId}`} />

      <section className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <Avatar name={profile.fullName} size="lg" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <h2 className="font-display text-title-sm text-ink">{profile.fullName}</h2>
          <p className="text-body-sm text-primary">{specialtyLabel(profile.specialtyId)}</p>
          {profile.reviewCount > 0 && <RatingBadge rating={profile.rating} count={profile.reviewCount} />}
          <p className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="size-4" />
            {branchLabel(branchId)} · {serviceLabel(offer.serviceId)}
          </p>
        </div>
      </section>

      <section aria-labelledby="time-title" className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 id="time-title" className="font-display text-title-sm text-ink">
          {t('book.dateTime')}
        </h2>
        {error && <FormAlert>{error}</FormAlert>}
        <SlotPicker
          slots={slots.data}
          isPending={slots.isPending}
          isError={slots.isError}
          onRetry={() => void slots.refetch()}
          timeZone={branch(branchId)?.timeZone}
          selectedSlotId={slotId}
          onSelect={setSlotId}
        />
      </section>

      {price !== undefined && (
        <section aria-labelledby="payment-title" className="space-y-3">
          <h2 id="payment-title" className="font-display text-title-sm text-ink">
            {t('book.payment')}
          </h2>
          <PriceSummary price={price} depositAmount={offer.depositAmount} payDeposit={withDeposit} onPayDepositChange={setWithDeposit} />
        </section>
      )}

      <section className="flex gap-3 rounded-2xl border border-info/25 bg-info/10 p-4 text-info">
        <CreditCard aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="text-label-md">{t('book.insuranceTitle')}</p>
          <p className="text-body-sm">{t('book.insuranceBody')}</p>
        </div>
      </section>

      <Checkbox
        id="booking-terms"
        checked={accepted}
        onChange={(e) => {
          setAccepted(e.target.checked);
          setTermsError(false);
        }}
        label={t('book.terms', { hours: CHANGE_WINDOW_HOURS })}
        error={termsError ? t('book.termsRequired') : undefined}
      />

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card/95 p-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <Button size="lg" className="w-full" disabled={!selected || book.isPending || payDeposit.isPending} onClick={() => void confirm()}>
          {t('book.confirm')}
        </Button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-caption text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="size-3.5 text-success" />
          {selected ? t('doctors:booking.cancelNote') : t('book.chooseTime')}
        </p>
      </div>
    </div>
  );
}
