import { useState, type ReactNode } from 'react';
import { ArrowLeftRight, CalendarCheck, Footprints, MonitorSmartphone, PhoneCall, Ticket } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useSession } from '@/features/auth/hooks/use-session';
import { can } from '@/features/auth/model/access';
import { SlotPicker } from '@/features/doctors/components/SlotPicker';
import { useBranchServices, useDoctorSearch, useDoctorSlots } from '@/features/doctors/hooks/use-directory';
import { BOOKING_DAYS } from '@/features/doctors/model/slots';
import { BranchRequired } from '@/features/org/components/BranchRequired';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import type { Branch } from '@/features/org/model/branch';
import { PatientBanner } from '@/features/patients/components/PatientBanner';
import { PatientPicker } from '@/features/patients/components/PatientPicker';
import { usePatient } from '@/features/patients/hooks/use-patients';
import { useQueueBoard } from '@/features/queue/hooks/use-queue';
import { isServiceError } from '@/shared/api/service-error';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { formatDay, formatMoney, formatWallClock } from '@/shared/lib/intl';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { ChoiceCard } from '@/shared/ui/ChoiceCard';
import { Field } from '@/shared/ui/Field';
import { FilterChips } from '@/shared/ui/FilterChips';
import { FormAlert } from '@/shared/ui/FormAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { Textarea } from '@/shared/ui/textarea';
import { useDeskBook, useWalkIn } from '../hooks/use-desk';

type Mode = 'phone' | 'desk' | 'walk-in';
const MODES: { value: Mode; icon: typeof PhoneCall }[] = [
  { value: 'phone', icon: PhoneCall },
  { value: 'desk', icon: MonitorSmartphone },
  { value: 'walk-in', icon: Footprints },
];

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`} className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <h2 id={`step-${n}`} className="flex items-center gap-2 text-title-sm text-ink">
        <span aria-hidden="true" className="inline-flex size-6 items-center justify-center rounded-full bg-ink text-label-sm text-ink-foreground">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

interface Choice {
  serviceId: string | null;
  doctorId: string | null;
  slotId: string | null;
}

function DeskBook({ branch }: { branch: Branch }) {
  const { t } = useTranslation(['desk', 'screens']);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { user } = useSession();
  const { specialtyLabel, serviceLabel } = useLookups();
  const { today, timeZone } = useBranchClock(branch);
  const [params, setParams] = useSearchParams();
  const patientId = params.get('patient');
  const canWalkIn = can(user, 'appointments.check_in', branch.id);
  const requested = params.get('mode') as Mode | null;
  const mode: Mode = requested === 'walk-in' && canWalkIn ? 'walk-in' : requested === 'desk' ? 'desk' : 'phone';

  const patient = usePatient(patientId);
  const services = useBranchServices(branch.id);
  const board = useQueueBoard(mode === 'walk-in' ? branch.id : null);
  const book = useDeskBook();
  const walkIn = useWalkIn();
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const [choice, setChoice] = useState<Choice>({ serviceId: null, doctorId: null, slotId: null });
  const [complaint, setComplaint] = useState('');
  const [error, setError] = useState<string | null>(null);

  const doctors = useDoctorSearch({ branchId: branch.id, serviceId: choice.serviceId ?? undefined, sort: 'soonest', page: 1, pageSize: 20 });
  const slots = useDoctorSlots(choice.doctorId ?? '', choice.doctorId && mode !== 'walk-in' ? { branchId: branch.id, days: BOOKING_DAYS } : null);

  const setParam = (key: string, value: string | null) =>
    setParams((current) => {
      if (value) current.set(key, value);
      else current.delete(key);
      return current;
    }, { replace: true });

  const serviceList = services.data ?? [];
  const specialties = [...new Set(serviceList.map((s) => s.specialtyId))];
  const shownServices = specialtyId ? serviceList.filter((s) => s.specialtyId === specialtyId) : serviceList;
  const doctorList = choice.serviceId ? (doctors.data?.items ?? []) : [];
  const doctor = doctorList.find((d) => d.id === choice.doctorId);
  const slot = slots.data?.find((s) => s.id === choice.slotId && s.available);
  const waiting = (doctorId: string) =>
    (board.data ?? []).filter((e) => e.doctorId === doctorId && (e.stage === 'WaitingTriage' || e.stage === 'ReadyForDoctor')).length;
  const ready = !!patient.data && !!choice.serviceId && !!doctor && (mode === 'walk-in' || !!slot);
  const pending = book.isPending || walkIn.isPending;

  const confirm = async () => {
    if (!patient.data || !choice.serviceId || !doctor) return;
    setError(null);
    try {
      if (mode === 'walk-in') {
        const visit = await walkIn.mutateAsync({ patientId: patient.data.id, doctorId: doctor.id, branchId: branch.id, serviceId: choice.serviceId, complaint });
        toast.success(t('book.walkInDone', { name: visit.patient.fullName, ticket: visit.queue?.ticketNo ?? '' }));
        navigate('/desk/queue');
      } else if (slot) {
        const visit = await book.mutateAsync({
          patientId: patient.data.id, doctorId: doctor.id, branchId: branch.id, serviceId: choice.serviceId, slotId: slot.id,
          source: mode === 'phone' ? 'Phone' : 'Desk',
        });
        toast.success(t('book.done', { date: formatDay(visit.date, language), time: formatWallClock(visit.startTime, language), reference: visit.reference }));
        navigate('/desk');
      }
    } catch (err) {
      setError(isServiceError(err, 'Slot.CapacityReached') ? t('book.slotTaken') : errorMessage(err));
      if (isServiceError(err, 'Slot.CapacityReached')) setChoice((c) => ({ ...c, slotId: null }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('screens:deskBook')} description={t('book.intro')} />

      {patientId && patient.isPending ? (
        <LoadingState />
      ) : patientId && patient.isError ? (
        <ErrorState onRetry={() => void patient.refetch()} />
      ) : patient.data ? (
        <PatientBanner
          patient={patient.data}
          today={today}
          action={
            <Button variant="outline" onClick={() => setParam('patient', null)}>
              <ArrowLeftRight aria-hidden="true" />
              {t('book.changePatient')}
            </Button>
          }
        />
      ) : (
        <Step n={1} title={t('book.findPatient')}>
          <PatientPicker today={today} onPick={(picked) => setParam('patient', picked.id)} />
        </Step>
      )}

      {patient.data && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <Step n={1} title={t('book.channel')}>
              <fieldset className="grid gap-2 sm:grid-cols-3">
                <legend className="sr-only">{t('book.channel')}</legend>
                {MODES.filter((m) => m.value !== 'walk-in' || canWalkIn).map(({ value, icon: Icon }) => (
                  <ChoiceCard
                    key={value}
                    name="mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => {
                      setParam('mode', value === 'phone' ? null : value);
                      setChoice((c) => ({ ...c, slotId: null }));
                    }}
                    icon={<Icon className="size-5" />}
                    label={t(`book.modes.${value}`)}
                  />
                ))}
              </fieldset>
            </Step>

            <Step n={2} title={t('book.service')}>
              {services.isPending ? (
                <LoadingState className="py-6" />
              ) : services.isError ? (
                <ErrorState onRetry={() => void services.refetch()} />
              ) : (
                <>
                  <FilterChips
                    label={t('book.specialty')}
                    options={[{ value: null, label: t('book.allSpecialties') }, ...specialties.map((id) => ({ value: id, label: specialtyLabel(id) }))]}
                    value={specialtyId}
                    onChange={setSpecialtyId}
                  />
                  <fieldset className="grid gap-2 sm:grid-cols-2">
                    <legend className="sr-only">{t('book.service')}</legend>
                    {shownServices.map((service) => (
                      <ChoiceCard
                        key={service.id}
                        name="service"
                        value={service.id}
                        checked={choice.serviceId === service.id}
                        onChange={() => setChoice({ serviceId: service.id, doctorId: null, slotId: null })}
                        label={nameIn(service, language)}
                        description={`${specialtyLabel(service.specialtyId)} · ${t('book.from', { price: formatMoney(service.fromPrice, language) })}`}
                      />
                    ))}
                  </fieldset>
                </>
              )}
            </Step>

            {choice.serviceId && (
              <Step n={3} title={t('book.doctor')}>
                {doctors.isPending ? (
                  <LoadingState className="py-6" />
                ) : doctors.isError ? (
                  <ErrorState onRetry={() => void doctors.refetch()} />
                ) : doctorList.length === 0 ? (
                  <p className="text-body-md text-muted-foreground">{t('book.noDoctors')}</p>
                ) : (
                  <fieldset className="space-y-2">
                    <legend className="sr-only">{t('book.doctor')}</legend>
                    {doctorList.map((d) => {
                      const next = d.nextSlots[0];
                      return (
                        <label
                          key={d.id}
                          className={cn(
                            'flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent',
                            'has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:checked]:ring-1 has-[:checked]:ring-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'
                          )}
                        >
                          <input
                            type="radio"
                            name="doctor"
                            value={d.id}
                            checked={choice.doctorId === d.id}
                            onChange={() => setChoice((c) => ({ ...c, doctorId: d.id, slotId: null }))}
                            className="size-5 accent-primary"
                          />
                          <Avatar name={d.fullName.replace(/^Dr\.\s*/, '')} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-label-md text-foreground">{d.fullName}</span>
                            <span className="block text-body-sm text-muted-foreground">
                              {mode === 'walk-in'
                                ? t('book.waitingNow', { count: waiting(d.id) })
                                : next
                                  ? t('book.nextSlot', { day: formatDay(next.date, language), time: formatWallClock(next.startTime, language) })
                                  : t('book.noSlots')}
                            </span>
                          </span>
                          {d.fromPrice !== null && <span className="text-title-sm tabular-nums text-ink">{formatMoney(d.fromPrice, language)}</span>}
                        </label>
                      );
                    })}
                  </fieldset>
                )}
              </Step>
            )}

            {doctor && mode !== 'walk-in' && (
              <Step n={4} title={t('book.time')}>
                <SlotPicker
                  key={`${doctor.id}-${choice.serviceId}`}
                  slots={slots.data}
                  isPending={slots.isPending}
                  isError={slots.isError}
                  onRetry={() => void slots.refetch()}
                  timeZone={timeZone}
                  selectedSlotId={choice.slotId}
                  onSelect={(slotId) => setChoice((c) => ({ ...c, slotId }))}
                />
              </Step>
            )}

            {doctor && mode === 'walk-in' && (
              <Step n={4} title={t('book.walkInDetails')}>
                <p className="rounded-lg bg-info/10 p-3 text-body-sm text-info">{t('book.walkInNote')}</p>
                <Field label={t('book.complaint')} hint={t('book.complaintHint')}>
                  {(control) => <Textarea {...control} value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={2} maxLength={300} dir="auto" />}
                </Field>
              </Step>
            )}
          </div>

          <aside aria-labelledby="summary-heading" className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5 lg:sticky lg:top-20">
            <h2 id="summary-heading" className="text-title-sm text-ink">{t('book.summary')}</h2>
            <dl className="space-y-2 text-body-md">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('book.summaryPatient')}</dt>
                <dd dir="auto" className="text-end">{patient.data.fullName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('book.summaryService')}</dt>
                <dd className="text-end">{choice.serviceId ? serviceLabel(choice.serviceId) : '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('book.summaryDoctor')}</dt>
                <dd className="text-end">{doctor?.fullName ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('book.summaryTime')}</dt>
                <dd className="text-end">
                  {mode === 'walk-in' ? t('book.now') : slot ? `${formatDay(slot.date, language)} · ${formatWallClock(slot.startTime, language)}` : '—'}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-border pt-2">
                <dt className="text-label-md">{t('book.fee')}</dt>
                <dd className="font-display text-headline-md tabular-nums text-ink">{doctor?.fromPrice != null ? formatMoney(doctor.fromPrice, language) : '—'}</dd>
              </div>
            </dl>
            <p className="text-body-sm text-muted-foreground">{t('book.payAtDesk')}</p>
            {error && <FormAlert>{error}</FormAlert>}
            <Button size="lg" className="w-full" disabled={!ready || pending} onClick={() => void confirm()}>
              {mode === 'walk-in' ? <Ticket aria-hidden="true" /> : <CalendarCheck aria-hidden="true" />}
              {mode === 'walk-in' ? t('book.confirmWalkIn') : t('book.confirm')}
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}

/** Booking on a patient's behalf or a walk-in (design front-desk/03, FR-APT-03/04). */
export default function DeskBookPage() {
  return <BranchRequired>{(branch) => <DeskBook branch={branch} />}</BranchRequired>;
}
