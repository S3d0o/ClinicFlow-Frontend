import type { Allergy } from '@/features/profile/model/profile';
import type { Diagnosis, Drug, EncounterDraft, EncounterTemplate, PrescriptionItem, SoapNotes } from './encounter';

// Encounter rules shared by the screen and the mock (FR-EMR-03…09). Pure.

const fold = (text: string) => text.trim().toLowerCase();

/**
 * The patient's allergies a medicine conflicts with: its name, generic name or one of its catalog
 * classes names the allergen ("Penicillin" → Amoxicillin). Free-text medicines match by name only.
 */
export function allergyConflicts(item: Pick<PrescriptionItem, 'drugName' | 'drugId'>, allergies: Allergy[], catalog: Drug[]): Allergy[] {
  const drug = item.drugId ? catalog.find((d) => d.id === item.drugId) : catalog.find((d) => fold(d.name) === fold(item.drugName));
  const terms = [item.drugName, drug?.genericName, ...(drug?.classes ?? [])].filter(Boolean).map((t) => fold(t!));
  return allergies.filter((allergy) => {
    const allergen = fold(allergy.name);
    return terms.some((term) => term.includes(allergen) || allergen.includes(term));
  });
}

/** Prescriptions that conflict with an allergy and haven't been acknowledged: signing is refused. */
export const unacknowledgedConflicts = (draft: Pick<EncounterDraft, 'prescriptions'>, allergies: Allergy[], catalog: Drug[]) =>
  draft.prescriptions.filter((item) => !item.allergyOverrideReason?.trim() && allergyConflicts(item, allergies, catalog).length > 0);

/** At least one diagnosis is needed to sign (FR-EMR-04, a setting: on by default). */
export const DIAGNOSIS_REQUIRED_TO_SIGN = true;

/** What still stops the doctor from signing, in the order the screen shows it. */
export function signBlockers(draft: EncounterDraft, allergies: Allergy[], catalog: Drug[]) {
  return {
    noDiagnosis: DIAGNOSIS_REQUIRED_TO_SIGN && draft.diagnoses.filter((d) => d.status !== 'RuledOut').length === 0,
    allergyConflicts: unacknowledgedConflicts(draft, allergies, catalog).length,
  };
}

export const canSign = (draft: EncounterDraft, allergies: Allergy[], catalog: Drug[]) => {
  const blockers = signBlockers(draft, allergies, catalog);
  return !blockers.noDiagnosis && blockers.allergyConflicts === 0;
};

/** Adds a diagnosis; the first one becomes primary. The same code twice is ignored. */
export function addDiagnosis(diagnoses: Diagnosis[], next: Omit<Diagnosis, 'isPrimary'>): Diagnosis[] {
  if (diagnoses.some((d) => d.code === next.code)) return diagnoses;
  return [...diagnoses, { ...next, isPrimary: diagnoses.length === 0 }];
}

/** Makes one diagnosis primary; there is only ever one. */
export const makePrimary = (diagnoses: Diagnosis[], id: string) => diagnoses.map((d) => ({ ...d, isPrimary: d.id === id }));

/** Removes a diagnosis; if it was primary, the next one takes over. */
export function removeDiagnosis(diagnoses: Diagnosis[], id: string): Diagnosis[] {
  const rest = diagnoses.filter((d) => d.id !== id);
  if (rest.length > 0 && !rest.some((d) => d.isPrimary)) rest[0] = { ...rest[0], isPrimary: true };
  return rest;
}

/** A template fills the sections that are still empty; what the doctor wrote is never replaced. */
export function applyTemplate(notes: SoapNotes, template: EncounterTemplate): SoapNotes {
  const filled = { ...notes };
  for (const key of ['subjective', 'objective', 'assessment', 'plan'] as const) {
    if (!filled[key].trim() && template.notes[key]) filled[key] = template.notes[key]!;
  }
  return filled;
}

/** "1 tablet every morning": how the patient reads a dose in the visit summary. */
export const dosageText = (item: Pick<PrescriptionItem, 'dose' | 'frequency'>) => [item.dose, item.frequency].filter((p) => p.trim()).join(' ');

/** The follow-up window shown to the patient and the desk: the suggested day, give or take 3 days (FR-APT-11). */
export function followUpWindow(visitDate: string, days: number, addDays: (date: string, n: number) => string) {
  return { from: addDays(visitDate, Math.max(1, days - 3)), to: addDays(visitDate, days + 3) };
}
