import { describe, expect, it } from 'vitest';
import { drugsSeed } from '@/mocks/seed/clinical';
import { emptyDraft, type Diagnosis, type EncounterTemplate } from './encounter';
import { addDiagnosis, allergyConflicts, applyTemplate, canSign, makePrimary, removeDiagnosis, signBlockers } from './rules';

const penicillin = [{ name: 'Penicillin', severity: 'Severe' as const }];
const dx = (code: string): Omit<Diagnosis, 'isPrimary'> => ({ id: code, code, title: code, status: 'Confirmed' });

describe('allergy check (FR-EMR-05)', () => {
  it('matches catalog classes, generic names and free text', () => {
    expect(allergyConflicts({ drugName: 'Augmentin', drugId: 'drg-augmentin' }, penicillin, drugsSeed)).toEqual(penicillin);
    expect(allergyConflicts({ drugName: 'Amoxil' }, penicillin, drugsSeed)).toEqual(penicillin); // catalog matched by name
    expect(allergyConflicts({ drugName: 'Penicillin V' }, penicillin, drugsSeed)).toEqual(penicillin); // free text
    expect(allergyConflicts({ drugName: 'Concor', drugId: 'drg-concor' }, penicillin, drugsSeed)).toEqual([]);
    expect(allergyConflicts({ drugName: 'Septrin', drugId: 'drg-septrin' }, [{ name: 'Sulfa drugs' }], drugsSeed)).toHaveLength(1);
  });

  it('blocks signing until each conflict is acknowledged and a diagnosis is in', () => {
    const draft = { ...emptyDraft(), prescriptions: [{ id: 'rx', drugName: 'Augmentin', drugId: 'drg-augmentin', dose: '1 tablet', frequency: 'twice a day' }] };
    expect(signBlockers(draft, penicillin, drugsSeed)).toEqual({ noDiagnosis: true, allergyConflicts: 1 });
    const fixed = { ...draft, diagnoses: addDiagnosis([], dx('I10')), prescriptions: [{ ...draft.prescriptions[0], allergyOverrideReason: 'Tolerated before' }] };
    expect(canSign(fixed, penicillin, drugsSeed)).toBe(true);
  });
});

describe('diagnoses', () => {
  it('keeps exactly one primary', () => {
    let list = addDiagnosis([], dx('I10'));
    list = addDiagnosis(list, dx('E11.9'));
    list = addDiagnosis(list, dx('I10'));
    expect(list.map((d) => [d.code, d.isPrimary])).toEqual([['I10', true], ['E11.9', false]]);
    expect(makePrimary(list, 'E11.9').map((d) => d.isPrimary)).toEqual([false, true]);
    expect(removeDiagnosis(list, 'I10')).toEqual([expect.objectContaining({ code: 'E11.9', isPrimary: true })]);
  });
});

describe('templates (FR-EMR-03)', () => {
  it('fill only the empty sections', () => {
    const template: EncounterTemplate = { id: 't', specialtyId: 's', nameEn: 'T', nameAr: 'T', notes: { subjective: 'Template S', plan: 'Template P' } };
    const notes = applyTemplate({ subjective: 'Mine', objective: '', assessment: '', plan: '' }, template);
    expect(notes).toEqual({ subjective: 'Mine', objective: '', assessment: '', plan: 'Template P' });
  });
});
