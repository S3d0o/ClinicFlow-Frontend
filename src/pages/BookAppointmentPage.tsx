import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, addDays, isToday, isTomorrow, parseISO } from 'date-fns';
import { doctorsApi, appointmentsApi } from '@/api';
import type { DoctorDetails, Slot } from '@/types';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { formatFee, formatTime, formatTimeRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Page, PageHeader } from '@/components/layout/Page';
import { EmptyState, LoadingState } from '@/components/states';
import { UserAvatar } from '@/components/UserAvatar';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

// Slots are generated only for the next 14 days (API contract §5.2 #11)
const BOOKING_WINDOW_DAYS = 14;

// Booking errors after which the slot list is out of date
const STALE_SLOT_ERRORS = new Set([
  'Appointment.SlotNotAvailable',
  'Appointment.SlotAlreadyBooked',
  'Appointment.SlotInPast',
  'Appointment.SlotNotFound',
]);

const REASON_MAX_LENGTH = 500;

// Group slots by part of the day for easier scanning
const periods = [
  { label: 'Morning', test: (h: number) => h < 12 },
  { label: 'Afternoon', test: (h: number) => h >= 12 && h < 17 },
  { label: 'Evening', test: (h: number) => h >= 17 },
];

function Step({ number, title, children, aside }: { number: number; title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-3">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{number}</span>
          <span>{title}</span>
        </CardTitle>
        {aside}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function BookAppointmentPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);
  const slotsRequestId = useRef(0);

  const datesPerPage = 7;
  const today = new Date();

  useEffect(() => {
    if (!doctorId) return;
    doctorsApi
      .getById(Number(doctorId))
      .then((res) => setDoctor(res.data))
      .catch(() => toast.error('Failed to load doctor details'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const fetchSlots = useCallback(async (date: Date) => {
    if (!doctorId) return;
    // Ignore responses that arrive after a newer request (fast date switching)
    const requestId = ++slotsRequestId.current;
    setSlotsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await doctorsApi.getSlots(Number(doctorId), dateStr);
      if (requestId === slotsRequestId.current) setSlots(res.data);
    } catch (err) {
      if (requestId !== slotsRequestId.current) return;
      setSlots([]);
      toast.error(getApiErrorMessage(err, 'Failed to load available slots'));
    } finally {
      if (requestId === slotsRequestId.current) setSlotsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const visibleDates = Array.from({ length: datesPerPage }, (_, i) =>
    addDays(today, dateOffset + i)
  );

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    // A slot belongs to one date; keep the selection from pointing at another day
    setSelectedSlot(null);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    try {
      await appointmentsApi.book({
        slotId: selectedSlot.id,
        reasonForVisit: reason.trim() || undefined,
      });
      toast.success('Appointment booked', { description: 'You’ll find it under your appointments.' });
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to book appointment'));
      const code = getApiErrorCode(err);
      if (code && STALE_SLOT_ERRORS.has(code)) {
        setSelectedSlot(null);
        fetchSlots(selectedDate);
      }
    } finally {
      setBookingLoading(false);
      setShowConfirm(false);
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tmrw';
    return format(date, 'EEE');
  };

  if (loading) {
    return <LoadingState label="Loading booking…" className="min-h-[60vh]" />;
  }

  if (!doctor) {
    return (
      <Page width="narrow">
        <EmptyState
          icon={Stethoscope}
          title="Doctor not found"
          description="We couldn’t load this doctor. They may no longer be available."
          action={<Button asChild variant="outline"><Link to="/doctors">Browse doctors</Link></Button>}
        />
      </Page>
    );
  }

  const groupedSlots = periods
    .map((p) => ({ label: p.label, slots: slots.filter((s) => p.test(Number(s.startTime.split(':')[0]))) }))
    .filter((g) => g.slots.length > 0);

  const lastPage = dateOffset + datesPerPage >= BOOKING_WINDOW_DAYS;
  const rangeLabel = `${format(visibleDates[0], 'MMM d')} – ${format(visibleDates[visibleDates.length - 1], 'MMM d')}`;

  const summary = (
    <Card className="lg:sticky lg:top-24">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <UserAvatar name={doctor.fullName} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{doctor.fullName}</p>
            <p className="text-sm text-muted-foreground">{doctor.specialtyName}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5 sm:pt-5">
        <dl className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="flex items-center gap-2 text-muted-foreground"><Calendar className="size-4" aria-hidden="true" />Date</dt>
            <dd className="text-right font-medium">{selectedSlot ? format(parseISO(selectedSlot.date), 'EEE, MMM d') : '—'}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" aria-hidden="true" />Time</dt>
            <dd className="text-right font-medium">{selectedSlot ? formatTimeRange(selectedSlot.startTime, selectedSlot.endTime) : '—'}</dd>
          </div>
          {doctor.clinicCity && (
            <div className="flex items-start justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" aria-hidden="true" />Clinic</dt>
              <dd className="text-right font-medium">{doctor.clinicCity}</dd>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 border-t pt-3">
            <dt className="text-muted-foreground">Consultation fee</dt>
            <dd className="font-semibold tabular-nums">{formatFee(doctor.consultationFee)}</dd>
          </div>
        </dl>
        <Button size="lg" className="w-full" disabled={!selectedSlot} onClick={() => setShowConfirm(true)}>
          {selectedSlot ? 'Review & confirm' : 'Select a time to continue'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">You can cancel up to 2 hours before the start time.</p>
      </CardContent>
    </Card>
  );

  return (
    <Page width="wide">
      <PageHeader
        back={{ to: `/doctors/${doctor.id}`, label: 'Back to profile' }}
        eyebrow="Book an appointment"
        title={doctor.fullName}
        description={`${doctor.specialtyName}${doctor.clinicCity ? ` · ${doctor.clinicCity}` : ''}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-6">
          <Step
            number={1}
            title="Choose a date"
            aside={
              <div className="flex items-center gap-1">
                <span className="mr-1 hidden text-sm text-muted-foreground sm:inline">{rangeLabel}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setDateOffset((o) => Math.max(0, o - datesPerPage))}
                  disabled={dateOffset === 0}
                  aria-label="Previous week"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setDateOffset((o) => o + datesPerPage)}
                  disabled={lastPage}
                  aria-label="Next week"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            }
          >
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="group" aria-label="Dates">
              {visibleDates.map((date) => {
                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => !isPast && selectDate(date)}
                    disabled={isPast}
                    aria-pressed={isSelected}
                    aria-label={format(date, 'EEEE, MMMM d')}
                    className={cn(
                      'flex flex-col items-center rounded-lg border px-1 py-2.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : isPast
                        ? 'cursor-not-allowed border-transparent text-muted-foreground/50'
                        : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary/60'
                    )}
                  >
                    <span className={cn('text-[10px] font-medium uppercase sm:text-[11px] sm:tracking-wide', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                      {getDateLabel(date)}
                    </span>
                    <span className="mt-0.5 text-lg font-semibold leading-tight tabular-nums">{format(date, 'd')}</span>
                  </button>
                );
              })}
            </div>
          </Step>

          <Step number={2} title={`Choose a time · ${format(selectedDate, 'EEEE, MMM d')}`}>
            <div aria-live="polite" aria-busy={slotsLoading}>
              {slotsLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Spinner className="text-primary" /> Loading available times…
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-10 text-center">
                  <Clock className="mx-auto mb-3 size-6 text-muted-foreground/60" aria-hidden="true" />
                  <p className="text-sm font-medium">No open times on this day</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try another date{lastPage ? '' : ' or the next week'}.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedSlots.map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5" role="group" aria-label={`${group.label} times`}>
                        {group.slots.map((slot) => {
                          const isSelected = selectedSlot?.id === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              aria-pressed={isSelected}
                              aria-label={formatTimeRange(slot.startTime, slot.endTime)}
                              className={cn(
                                'h-10 rounded-md border text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                  : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary/60'
                              )}
                            >
                              {formatTime(slot.startTime)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Step>

          <Step number={3} title="Reason for visit">
            <Label htmlFor="visit-reason" className="sr-only">Reason for visit (optional)</Label>
            <Textarea
              id="visit-reason"
              placeholder="Optional — e.g. annual check-up, follow-up on test results…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={REASON_MAX_LENGTH}
              rows={3}
              aria-describedby="visit-reason-hint"
            />
            <p id="visit-reason-hint" className="mt-1.5 flex justify-between text-xs text-muted-foreground">
              <span>Shared with your doctor before the visit.</span>
              <span className="tabular-nums">{reason.length}/{REASON_MAX_LENGTH}</span>
            </p>
          </Step>
        </div>

        <aside aria-label="Booking summary">{summary}</aside>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm your appointment</DialogTitle>
            <DialogDescription>Please check the details below. Your booking is confirmed as soon as you continue.</DialogDescription>
          </DialogHeader>
          <dl className="divide-y rounded-lg border text-sm">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-muted-foreground">Doctor</dt>
              <dd className="text-right font-medium">{doctor.fullName}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-muted-foreground">Date</dt>
              <dd className="text-right font-medium">{selectedSlot && format(parseISO(selectedSlot.date), 'EEEE, MMMM d, yyyy')}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-muted-foreground">Time</dt>
              <dd className="text-right font-medium">{selectedSlot && formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-muted-foreground">Fee</dt>
              <dd className="text-right font-medium tabular-nums">{formatFee(doctor.consultationFee)}</dd>
            </div>
            {reason.trim() && (
              <div className="px-4 py-3">
                <dt className="text-muted-foreground">Reason</dt>
                <dd className="mt-1 break-words">{reason}</dd>
              </div>
            )}
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={bookingLoading}>
              Go back
            </Button>
            <Button onClick={handleBook} disabled={bookingLoading}>
              {bookingLoading && <Spinner aria-hidden="true" />}
              {bookingLoading ? 'Booking…' : 'Confirm booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
