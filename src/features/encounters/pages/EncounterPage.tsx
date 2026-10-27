import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Megaphone, PenLine, RefreshCw, Save } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useLookups } from '@/features/appointments/hooks/use-lookups';
import { useSession } from '@/features/auth/hooks/use-session';
import { can } from '@/features/auth/model/access';
import { useBranchClock } from '@/features/org/hooks/use-branch-clock';
import { useCallPatient } from '@/features/queue/hooks/use-queue';
import { isServiceError } from '@/shared/api/service-error';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { utcToWallClock } from '@/shared/lib/branch-time';
import { formatInstant } from '@/shared/lib/intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { AddendaPanel } from '../components/AddendaPanel';
import { DiagnosisPanel } from '../components/DiagnosisPanel';
import { EncounterHeader } from '../components/EncounterHeader';
import { OrdersPanel } from '../components/OrdersPanel';
import { PlanPanel } from '../components/PlanPanel';
import { PrescriptionPanel } from '../components/PrescriptionPanel';
import { SoapNotes } from '../components/SoapNotes';
import { useCompleteVisit, useDrugCatalog, useEncounter, useSaveEncounter, useSignEncounter } from '../hooks/use-encounter';
import { draftOf, type Drug, type Encounter, type EncounterDraft } from '../model/encounter';
import { applyTemplate, signBlockers } from '../model/rules';

/** Autosaves this long after the last change (FR-EMR-03). */
const AUTOSAVE_MS = 2000;

interface WorkspaceProps {
  encounter: Encounter;
  catalog: Drug[];
  /** Reads the encounter again (after a call, or to take another tab's changes). */
  reload: () => Promise<Encounter | undefined>;
}

function EncounterWorkspace({ encounter, catalog, reload }: WorkspaceProps) {
  const { t } = useTranslation('encounters');
  const { language } = useLanguage();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const { user } = useSession();
  const { branch } = useLookups();
  const { now, today, timeZone } = useBranchClock(branch(encounter.visit.branchId));
  const id = encounter.appointmentId;
  const save = useSaveEncounter(id);
  const sign = useSignEncounter(id);
  const complete = useCompleteVisit(id);
  const call = useCallPatient();

  const [draft, setDraft] = useState<EncounterDraft>(() => draftOf(encounter));
  // What the server last accepted, to tell unsaved edits apart
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(draftOf(encounter)));
  const [triedToSign, setTriedToSign] = useState(false);

  const readOnly = encounter.status !== 'Draft';
  const dirty = !readOnly && JSON.stringify(draft) !== savedJson;
  const conflict = [save.error, sign.error].some((e) => isServiceError(e, 'Concurrency.Conflict'));
  const busy = save.isPending || sign.isPending || complete.isPending;
  const blockers = signBlockers(draft, encounter.patient.allergies, catalog);
  const signable = !blockers.noDiagnosis && blockers.allergyConflicts === 0;
  const visitOpen = encounter.visit.status === 'InProgress';
  const canSignHere = can(user, 'encounters.sign', encounter.visit.branchId) && (visitOpen || encounter.visit.status === 'Completed');
  const visitDate = utcToWallClock(new Date(encounter.visit.startsAtUtc), timeZone).date;
  const time = (iso: string) => formatInstant(iso, language, timeZone, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const update = (patch: Partial<EncounterDraft>) => setDraft((current) => ({ ...current, ...patch }));

  // Autosave a moment after the doctor stops typing; one save at a time, so the version stays in step
  const { mutate } = save;
  const rowVersion = encounter.rowVersion;
  const pending = save.isPending;
  useEffect(() => {
    if (!dirty || conflict || pending) return;
    const snapshot = draft;
    const timer = window.setTimeout(
      () => mutate({ draft: snapshot, rowVersion }, { onSuccess: () => setSavedJson(JSON.stringify(snapshot)) }),
      AUTOSAVE_MS
    );
    return () => window.clearTimeout(timer);
  }, [dirty, conflict, pending, draft, rowVersion, mutate]);

  /** Saves unsaved edits first, so signing or completing works on what's on screen. */
  const saveNow = async () => {
    if (!dirty) return encounter.rowVersion;
    const snapshot = draft;
    const saved = await save.mutateAsync({ draft: snapshot, rowVersion: encounter.rowVersion });
    setSavedJson(JSON.stringify(snapshot));
    return saved.rowVersion;
  };

  const signNow = async () => {
    setTriedToSign(true);
    if (!signable) return;
    try {
      await sign.mutateAsync(await saveNow());
      toast.success(t('actions.signed', { name: encounter.patient.fullName }));
      navigate('/doctor');
    } catch {
      // Shown from the errors below
    }
  };

  const completeNow = async () => {
    try {
      await saveNow();
      await complete.mutateAsync(undefined);
      toast.success(t('actions.completed', { name: encounter.patient.fullName }));
      navigate('/doctor');
    } catch {
      // Shown from the errors below
    }
  };

  const takeLatest = async () => {
    const latest = await reload();
    if (!latest) return;
    setDraft(draftOf(latest));
    setSavedJson(JSON.stringify(draftOf(latest)));
    save.reset();
    sign.reset();
  };

  const callIn = () =>
    call.mutate(id, {
      onSuccess: () => {
        toast.success(t('actions.called', { name: encounter.patient.fullName }));
        void reload();
      },
      onError: (error) => toast.error(errorMessage(error)),
    });

  const actionError = [sign.error, complete.error, save.error].find((e) => e && !isServiceError(e, 'Concurrency.Conflict'));
  const room = encounter.visit.room ? nameIn(encounter.visit.room, language) : undefined;

  return (
    <div className="space-y-5">
      <Button asChild variant="link" className="px-0">
        <Link to="/doctor">
          <ArrowLeft aria-hidden="true" className="rtl-flip" />
          {t('back')}
        </Link>
      </Button>

      <EncounterHeader
        encounter={encounter}
        now={now}
        today={today}
        timeZone={timeZone}
        actions={
          encounter.visit.status === 'CheckedIn' && encounter.visit.stage === 'ReadyForDoctor' && (
            <Button variant="strong" onClick={callIn} disabled={call.isPending}>
              <Megaphone aria-hidden="true" className="rtl-flip" />
              {room ? t('actions.callTo', { room }) : t('actions.call')}
            </Button>
          )
        }
      />

      {encounter.status === 'Signed' && (
        <FormAlert tone="success">
          {t('signedBanner', { name: encounter.signedByName, time: encounter.signedAt ? formatInstant(encounter.signedAt, language, timeZone, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '' })}
        </FormAlert>
      )}
      {encounter.visit.status === 'CheckedIn' && <FormAlert tone="info">{t('notStarted')}</FormAlert>}
      {encounter.status === 'Draft' && encounter.visit.status === 'Completed' && <FormAlert tone="info">{t('signLater')}</FormAlert>}
      {conflict && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="flex-1 text-body-md text-destructive">{t('conflict')}</p>
          <Button variant="outline" onClick={() => void takeLatest()}>
            <RefreshCw aria-hidden="true" />
            {t('reload')}
          </Button>
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <SoapNotes
            notes={draft.notes}
            specialtyId={encounter.visit.specialtyId}
            readOnly={readOnly}
            onChange={(notes) => update({ notes })}
            onTemplate={(template) => update({ notes: applyTemplate(draft.notes, template) })}
          />
          <DiagnosisPanel diagnoses={draft.diagnoses} readOnly={readOnly} missing={triedToSign && blockers.noDiagnosis} onChange={(diagnoses) => update({ diagnoses })} />
        </div>
        <div className="space-y-5">
          {readOnly && <AddendaPanel encounter={encounter} canAddend={can(user, 'encounters.addend', encounter.visit.branchId)} timeZone={timeZone} />}
          <PrescriptionPanel
            items={draft.prescriptions}
            allergies={encounter.patient.allergies}
            catalog={catalog}
            readOnly={readOnly}
            onChange={(prescriptions) => update({ prescriptions })}
          />
          <OrdersPanel orders={draft.orders} readOnly={readOnly} onChange={(orders) => update({ orders })} />
          <PlanPanel
            instructions={draft.patientInstructions}
            followUpInDays={draft.followUpInDays}
            visitDate={visitDate}
            readOnly={readOnly}
            onInstructions={(patientInstructions) => update({ patientInstructions })}
            onFollowUp={(followUpInDays) => update({ followUpInDays })}
          />
        </div>
      </div>

      {!readOnly && (
        <div className="sticky bottom-0 z-20 -mx-4 -mb-6 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {actionError && <FormAlert className="mb-3">{errorMessage(actionError)}</FormAlert>}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-0.5">
              <p role="status" className="text-body-sm text-muted-foreground">
                {save.isPending ? t('saving') : dirty ? t('unsaved') : encounter.savedAt ? t('savedAt', { time: time(encounter.savedAt) }) : t('notSaved')}
              </p>
              {(blockers.noDiagnosis || blockers.allergyConflicts > 0) && (
                <p className={triedToSign ? 'text-body-sm font-medium text-destructive' : 'text-body-sm text-muted-foreground'}>
                  {[blockers.noDiagnosis && t('blockers.diagnosis'), blockers.allergyConflicts > 0 && t('blockers.allergy', { count: blockers.allergyConflicts })].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <div className="ms-auto flex flex-wrap gap-2">
              <Button variant="outline" disabled={!dirty || busy || conflict} onClick={() => void saveNow().catch(() => undefined)}>
                <Save aria-hidden="true" />
                {t('actions.save')}
              </Button>
              {visitOpen && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={busy || conflict}>
                      <ClipboardCheck aria-hidden="true" />
                      {t('actions.complete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('actions.completeTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('actions.completeBody')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('actions.keepWriting')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void completeNow()}>{t('actions.completeConfirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {canSignHere && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="lg"
                      variant="strong"
                      disabled={busy || conflict}
                      onClick={(event) => {
                        // Say what's missing instead of opening the confirmation
                        if (!signable) {
                          event.preventDefault();
                          setTriedToSign(true);
                        }
                      }}
                    >
                      <PenLine aria-hidden="true" />
                      {visitOpen ? t('actions.signComplete') : t('actions.sign')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('actions.signTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('actions.signBody')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('actions.keepWriting')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void signNow()}>
                        <CheckCircle2 aria-hidden="true" />
                        {t('actions.signConfirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** The encounter workspace (design doctor/02, FR-EMR-01…10, 05 §4.2): notes, diagnoses, prescription, orders, plan, sign. */
export default function EncounterPage() {
  const { appointmentId = '' } = useParams();
  const errorMessage = useErrorMessage();
  const encounter = useEncounter(appointmentId);
  const catalog = useDrugCatalog();
  if (encounter.isPending || catalog.isPending) return <LoadingState />;
  if (encounter.isError) return <ErrorState description={errorMessage(encounter.error)} onRetry={() => void encounter.refetch()} />;
  if (catalog.isError) return <ErrorState onRetry={() => void catalog.refetch()} />;
  return (
    <EncounterWorkspace
      key={appointmentId}
      encounter={encounter.data}
      catalog={catalog.data}
      reload={async () => (await encounter.refetch()).data}
    />
  );
}
