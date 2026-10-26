import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, HeartPulse, Ruler, Save, Stethoscope } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useActiveBranch } from '@/features/org/hooks/active-branch';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import { useAgeLabel } from '@/features/patients/hooks/use-age-label';
import { TicketBadge } from '@/features/queue/components/TicketBadge';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { cn } from '@/shared/lib/cn';
import { formatInstant } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Field } from '@/shared/ui/Field';
import { FormAlert } from '@/shared/ui/FormAlert';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { Textarea } from '@/shared/ui/textarea';
import { VitalField } from '../components/VitalField';
import { useSaveTriageDraft, useSubmitTriage, useTriageCase } from '../hooks/use-triage';
import { bmi, bmiBand, implausibleKeys, parseVital, VITAL_LIMITS, type TriageCase, type TriageForm, type VitalKey, type Vitals } from '../model/vitals';

const VITAL_KEYS = Object.keys(VITAL_LIMITS) as VitalKey[];
const PAIN_SCORES = Array.from({ length: 11 }, (_, n) => n);
/** Autosaves this long after the last change. */
const AUTOSAVE_MS = 2000;

type Texts = Record<VitalKey, string>;

const textsFrom = (form: TriageForm | undefined): Texts =>
  Object.fromEntries(VITAL_KEYS.map((key) => [key, form?.[key] !== undefined ? String(form[key]) : ''])) as Texts;

const vitalsFrom = (texts: Texts): Vitals => Object.fromEntries(VITAL_KEYS.map((key) => [key, parseVital(texts[key])])) as Vitals;

function Card({ icon, title, aside, children, className }: { icon: ReactNode; title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card', className)}>
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-title-sm text-ink">
          <span aria-hidden="true" className="text-primary">{icon}</span>
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

function TriageWorkspace({ triageCase }: { triageCase: TriageCase }) {
  const { t } = useTranslation(['triage', 'patients', 'queue']);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { specialtyLabel } = useLookups();
  const { activeBranch } = useActiveBranch();
  const { now, today, timeZone } = useBranchClock(activeBranch);
  const ageLabel = useAgeLabel();
  const allergiesId = useId();
  const { entry, patient, draft } = triageCase;

  const [texts, setTexts] = useState<Texts>(() => textsFrom(draft?.form));
  const [complaint, setComplaint] = useState(draft?.form.chiefComplaint ?? entry.complaint ?? '');
  const [allergiesConfirmed, setAllergiesConfirmed] = useState(draft?.form.allergiesConfirmed ?? false);
  const [dirty, setDirty] = useState(false);
  const saveDraft = useSaveTriageDraft(entry.appointmentId);
  const submit = useSubmitTriage(entry.appointmentId);

  const vitals = vitalsFrom(texts);
  const form: TriageForm = { ...vitals, chiefComplaint: complaint, allergiesConfirmed };
  // Unreadable (NaN) and impossible values both count: neither can be saved
  const typos = implausibleKeys(vitals);
  const bodyMass = bmi(vitals);
  const ready = entry.stage === 'WaitingTriage';

  // Autosave a draft a moment after the nurse stops typing (U8: no lost work, no forced fields)
  const { mutate: save } = saveDraft;
  useEffect(() => {
    if (!dirty) return;
    const draftVitals = vitalsFrom(texts);
    if (implausibleKeys(draftVitals).length > 0) return;
    const timer = window.setTimeout(() => save({ ...draftVitals, chiefComplaint: complaint, allergiesConfirmed }), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [dirty, texts, complaint, allergiesConfirmed, save]);

  const change = (key: VitalKey) => (value: string) => {
    setTexts((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (typos.length > 0 || !allergiesConfirmed) return;
    try {
      await submit.mutateAsync(form);
      toast.success(t('form.sent', { ticket: entry.ticketNo, doctor: entry.doctorName }));
      navigate('/nurse');
    } catch {
      // Shown from submit.error below
    }
  };

  const savedAt = saveDraft.data?.savedAt ?? draft?.savedAt;

  return (
    <form onSubmit={(event) => void send(event)} className="space-y-5 pb-28">
      <Button asChild variant="link" className="px-0">
        <Link to="/nurse">
          <ArrowLeft aria-hidden="true" className="rtl-flip" />
          {t('form.back')}
        </Link>
      </Button>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-start gap-4">
          <TicketBadge ticket={entry.ticketNo} size="lg" />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="font-display text-headline-lg text-ink"><bdi>{patient.fullName}</bdi></h1>
            <p className="text-body-md text-muted-foreground">
              {[ageLabel(patient.dateOfBirth, today), patient.gender && t(`patients:register.genders.${patient.gender}`)].filter(Boolean).join(' · ')} ·{' '}
              <bdi dir="ltr">{patient.mrn}</bdi>
            </p>
            <StatusChip tone="warning">
              {t('form.checkedIn', {
                time: formatInstant(entry.checkedInAt, language, timeZone, { hour: 'numeric', minute: '2-digit' }),
                minutes: Math.max(0, Math.floor((now.getTime() - Date.parse(entry.checkedInAt)) / 60_000)),
              })}
            </StatusChip>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
            <Stethoscope aria-hidden="true" className="size-5 text-primary" />
            <div>
              <p className="text-caption text-muted-foreground">{t('form.doctor')}</p>
              <p className="text-label-md text-foreground">
                {entry.doctorName} · {specialtyLabel(entry.specialtyId)}
                {entry.room && ` (${nameIn(entry.room, language)})`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {patient.allergies.length === 0 && <StatusChip tone="neutral">{t('form.noAllergies')}</StatusChip>}
          {patient.allergies.map((allergy) => (
            <StatusChip key={allergy.name} tone="danger">
              <AlertTriangle aria-hidden="true" className="size-3" />
              {allergy.severity ? t('form.allergySeverity', { name: allergy.name, severity: t(`form.severity.${allergy.severity}`) }) : t('form.allergy', { name: allergy.name })}
            </StatusChip>
          ))}
          {patient.conditions.map((condition) => (
            <StatusChip key={condition} tone="info">
              <span dir="auto">{condition}</span>
            </StatusChip>
          ))}
          {patient.bloodType && <StatusChip tone="neutral">{t('form.bloodType', { type: patient.bloodType })}</StatusChip>}
        </div>
      </section>

      {!ready && <FormAlert tone="info">{t('form.alreadySent', { stage: t(`queue:stage.${entry.stage}`) })}</FormAlert>}

      <fieldset disabled={!ready} className="space-y-5">
        <legend className="sr-only">{t('form.vitalsLegend')}</legend>
        <div className="grid gap-5 lg:grid-cols-3">
          <Card icon={<HeartPulse className="size-5" />} title={t('form.bloodPressure')} className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-3">
              <VitalField name="systolic" value={texts.systolic} onChange={change('systolic')} />
              <VitalField name="diastolic" value={texts.diastolic} onChange={change('diastolic')} />
            </div>
          </Card>
          <Card icon={<Activity className="size-5" />} title={t('form.signs')} className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <VitalField name="pulse" value={texts.pulse} onChange={change('pulse')} />
              <VitalField name="temperature" value={texts.temperature} onChange={change('temperature')} />
              <VitalField name="spo2" value={texts.spo2} onChange={change('spo2')} />
              <VitalField name="respiratoryRate" value={texts.respiratoryRate} onChange={change('respiratoryRate')} />
            </div>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card icon={<Ruler className="size-5" />} title={t('form.body')} aside={<span className="text-caption text-muted-foreground">{t('form.bmiAuto')}</span>}>
            <div className="grid grid-cols-2 gap-3">
              <VitalField name="weightKg" value={texts.weightKg} onChange={change('weightKg')} />
              <VitalField name="heightCm" value={texts.heightCm} onChange={change('heightCm')} />
            </div>
            <p role="status" className="rounded-lg bg-info/10 px-3 py-2 text-body-md text-info">
              {bodyMass ? t('form.bmi', { value: bodyMass, band: t(`bmi.${bmiBand(bodyMass)}`) }) : t('form.bmiPending')}
            </p>
          </Card>

          <Card icon={<Activity className="size-5" />} title={t('form.pain')} className="lg:col-span-2">
            <div role="radiogroup" aria-label={t('form.pain')} className="grid grid-cols-6 gap-2 sm:grid-cols-11">
              {PAIN_SCORES.map((score) => {
                const selected = texts.painScore === String(score);
                return (
                  <button
                    key={score}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => change('painScore')(selected ? '' : String(score))}
                    className={cn(
                      'min-h-12 rounded-lg border text-title-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected ? 'border-ink bg-ink text-ink-foreground' : 'border-border bg-card hover:border-primary'
                    )}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
            <p className="text-body-sm text-muted-foreground">{t('form.painHint')}</p>
          </Card>
        </div>

        <Card icon={<Stethoscope className="size-5" />} title={t('form.complaint')}>
          <Field label={t('form.complaintLabel')} hint={t('form.complaintHint')}>
            {(control) => (
              <Textarea
                {...control}
                value={complaint}
                onChange={(e) => {
                  setComplaint(e.target.value);
                  setDirty(true);
                }}
                rows={3}
                maxLength={1000}
                dir="auto"
              />
            )}
          </Field>
          <div className={cn('rounded-xl border p-3', allergiesConfirmed ? 'border-success/30 bg-success/10' : 'border-warning/30 bg-warning/10')}>
            <Checkbox
              id={allergiesId}
              checked={allergiesConfirmed}
              onChange={(e) => {
                setAllergiesConfirmed(e.target.checked);
                setDirty(true);
              }}
              label={t('form.allergiesConfirm', { name: patient.fullName })}
              description={patient.allergies.length ? patient.allergies.map((a) => a.name).join(', ') : t('form.noAllergies')}
            />
          </div>
        </Card>
      </fieldset>

      {submit.isError && <FormAlert>{errorMessage(submit.error)}</FormAlert>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur ps-rail">
        <div className="flex flex-wrap items-center gap-3 px-6 py-3">
          <p role="status" className="text-body-sm text-muted-foreground">
            {saveDraft.isPending ? t('form.saving') : savedAt ? t('form.savedAt', { time: formatInstant(savedAt, language, timeZone, { hour: 'numeric', minute: '2-digit', second: '2-digit' }) }) : t('form.notSaved')}
          </p>
          {typos.length > 0 && <p className="text-body-sm font-medium text-destructive">{t('form.fixValues')}</p>}
          {ready && !allergiesConfirmed && typos.length === 0 && <p className="text-body-sm text-warning">{t('form.confirmAllergiesFirst')}</p>}
          <div className="ms-auto flex gap-2">
            <Button type="button" variant="outline" size="lg" disabled={!ready || typos.length > 0 || saveDraft.isPending} onClick={() => save(form)}>
              <Save aria-hidden="true" />
              {t('form.saveDraft')}
            </Button>
            <Button type="submit" size="lg" disabled={!ready || typos.length > 0 || !allergiesConfirmed || submit.isPending}>
              {t('form.send', { room: entry.room ? nameIn(entry.room, language) : entry.doctorName })}
              <ArrowRight aria-hidden="true" className="rtl-flip" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

/** Vitals and triage on the tablet (design nurse/02, FR-EMR-02, U8): measured values, flags, complaint, allergies. */
export default function TriagePage() {
  const { appointmentId = '' } = useParams();
  const triageCase = useTriageCase(appointmentId);
  if (triageCase.isPending) return <LoadingState />;
  if (triageCase.isError) return <ErrorState onRetry={() => void triageCase.refetch()} />;
  return <TriageWorkspace key={appointmentId} triageCase={triageCase.data} />;
}
