import { describe, expect, it } from 'vitest';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';

const rejectsWith = (promise: Promise<unknown>, code: string) => expect(promise).rejects.toSatisfy((e) => isServiceError(e, code));

const AHMED = 'u-ahmed';
const TODAY = '2026-10-24'; // TEST_NOW: Saturday 08:00 in Cairo
const I10 = { id: 'dx-1', code: 'I10', title: 'Essential (primary) hypertension', status: 'Confirmed' as const };

describe('the encounter (FR-EMR-01…10)', () => {
  it('saves drafts with a version, refuses a stale save, and needs a diagnosis to sign', async () => {
    const { services } = createTestBackend({ signedInAs: AHMED });
    const encounter = await services.encounters.get('apt-d-a3'); // in the room now
    expect(encounter).toMatchObject({ status: 'Draft', rowVersion: 1, patient: { fullName: 'Nadia Soliman' }, visit: { stage: 'WithDoctor', room: { nameEn: 'Room 204' } } });
    expect(encounter.triage?.form).toMatchObject({ systolic: 128, chiefComplaint: 'Palpitations at night' });

    const draft = { ...encounter, notes: { ...encounter.notes, assessment: 'Benign palpitations' } };
    const saved = await services.encounters.saveDraft('apt-d-a3', draft, 1);
    expect(saved).toMatchObject({ rowVersion: 2, notes: { assessment: 'Benign palpitations' } });
    await rejectsWith(services.encounters.saveDraft('apt-d-a3', draft, 1), 'Concurrency.Conflict');
    await rejectsWith(services.encounters.sign('apt-d-a3', 2), 'Encounter.DiagnosisRequired');
  });

  it('keeps other doctors out', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-laila' });
    await rejectsWith(services.encounters.get('apt-d-a3'), 'Access.OutOfScope');
  });

  it('refuses an unacknowledged allergy conflict, then signs, completes the visit and publishes the summary', async () => {
    const { services, db } = createTestBackend({ signedInAs: AHMED });
    // Finish the patient in the room, then call Mohamed (allergic to penicillin) in
    const inRoom = await services.encounters.saveDraft('apt-d-a3', { ...(await services.encounters.get('apt-d-a3')), diagnoses: [{ ...I10, isPrimary: true }] }, 1);
    await services.encounters.sign('apt-d-a3', inRoom.rowVersion);
    await services.queueBoard.call('apt-today'); // the visit's own doctor may call (§13.17)

    const mohamed = await services.encounters.get('apt-today');
    const augmentin = { id: 'rx-1', drugId: 'drg-augmentin', drugName: 'Augmentin', strength: '1 g', dose: '1 tablet', frequency: 'twice a day', durationDays: 7 };
    let saved = await services.encounters.saveDraft('apt-today', {
      ...mohamed, diagnoses: [{ ...I10, isPrimary: true }], prescriptions: [augmentin], patientInstructions: 'Rest.\nDrink water.', followUpInDays: 14,
    }, mohamed.rowVersion);
    await rejectsWith(services.encounters.sign('apt-today', saved.rowVersion), 'Prescription.AllergyConflict');

    saved = await services.encounters.saveDraft('apt-today', { ...saved, prescriptions: [{ ...augmentin, allergyOverrideReason: 'Tolerated before; patient informed' }] }, saved.rowVersion);
    const signed = await services.encounters.sign('apt-today', saved.rowVersion);
    expect(signed).toMatchObject({ status: 'Signed', signedByName: 'Dr. Ahmed Fathy', visit: { status: 'Completed' } });
    await rejectsWith(services.encounters.saveDraft('apt-today', saved, signed.rowVersion), 'Encounter.AlreadySigned');

    const visit = db.visits.find((v) => v.appointmentId === 'apt-today')!;
    expect(visit).toMatchObject({ diagnoses: ['Essential (primary) hypertension'], instructions: ['Rest.', 'Drink water.'], prescriptions: [{ drug: 'Augmentin', dosage: '1 tablet twice a day' }] });
    expect(visit.followUp).toEqual({ from: '2026-11-04', to: '2026-11-10', serviceId: 'svc-car-f' });
    expect(db.notifications.at(-1)).toMatchObject({ userId: 'u-mohamed', type: 'PrescriptionReady' });
  });

  it('adds addenda to signed notes only, and completes a visit to sign later', async () => {
    const { services } = createTestBackend({ signedInAs: AHMED });
    await rejectsWith(services.encounters.addAddendum('apt-d-a3', 'Correction'), 'Encounter.InvalidStatusTransition');
    const withNote = await services.encounters.addAddendum('apt-d-a1', ' Dose corrected to 10 mg. ');
    expect(withNote.addenda).toEqual([expect.objectContaining({ text: 'Dose corrected to 10 mg.', authorName: 'Dr. Ahmed Fathy' })]);

    await services.encounters.completeVisit('apt-d-a3');
    expect((await services.doctorDay.unsigned()).map((u) => u.appointmentId)).toEqual(['apt-y-hassan', 'apt-d-a2', 'apt-d-a3']);
  });

  it('searches ICD-10 by code or words and the drug catalog by name', async () => {
    const { services } = createTestBackend({ signedInAs: AHMED });
    expect((await services.encounters.searchIcd10('i10'))[0].code).toBe('I10');
    expect((await services.encounters.searchIcd10('chest pain')).map((c) => c.code)).toEqual(['R07.4', 'R07.89']);
    expect((await services.encounters.searchDrugs('amox')).map((d) => d.name)).toEqual(['Amoxil', 'Amoxil syrup', 'Augmentin']);
    expect((await services.encounters.listTemplates('sp-cardio')).map((t) => t.id)).toEqual(['tpl-chest-pain', 'tpl-htn']);
  });
});

describe("the doctor's day and schedule (FR-SCH-01, FR-SCH-06)", () => {
  it("lists today's visits with their triage and today's shifts", async () => {
    const { services } = createTestBackend({ signedInAs: 'u-laila' });
    const day = await services.doctorDay.myDay(TODAY);
    expect(day.visits.map((v) => v.patient.fullName)).toContain('Tamer Zaki');
    expect(day.visits.find((v) => v.id === 'apt-d-l2')).toMatchObject({ status: 'InProgress', triage: { recordedByName: 'Sara Ibrahim' } });
    expect(day.shifts).toEqual([expect.objectContaining({ branchId: 'br-nc', startTime: '09:00', endTime: '15:00', slotsTotal: 18 })]);
    await rejectsWith(createTestBackend({ signedInAs: 'u-mona' }).services.doctorDay.myDay(TODAY), 'Doctor.ProfileNotFound');
  });

  it('shows the week, previews and requests leave, and cancels it before it starts', async () => {
    const { services } = createTestBackend({ signedInAs: AHMED });
    const week = await services.schedule.myWeek(TODAY);
    expect(week.minutes).toBe(5 * 270);
    expect(week.days[1].shifts).toEqual([expect.objectContaining({ date: '2026-10-25', branchId: 'br-nc', startTime: '09:30', room: expect.objectContaining({ nameEn: 'Room 204' }) })]);
    expect((await services.schedule.listMyLeave()).map((l) => l.status)).toEqual(['Requested', 'Approved']);

    expect(await services.schedule.previewLeave({ fromDate: '2026-10-25', toDate: '2026-10-25' })).toEqual({ affected: 0, byBranch: [], shifts: 1 });
    await rejectsWith(services.schedule.requestLeave({ fromDate: '2026-10-20', toDate: '2026-10-21', reason: 'x' }), 'Leave.InPast');
    await rejectsWith(services.schedule.requestLeave({ fromDate: '2026-11-06', toDate: '2026-11-06', reason: 'x' }), 'Leave.Overlaps');
    await rejectsWith(services.schedule.requestLeave({ fromDate: '2026-10-25', toDate: '2026-10-25', startTime: '12:00', reason: 'x' }), 'Leave.InvalidRange');

    const leave = await services.schedule.requestLeave({ fromDate: '2026-10-25', toDate: '2026-10-25', startTime: '09:30', endTime: '11:00', reason: ' Dentist ' });
    expect(leave).toMatchObject({ status: 'Requested', reason: 'Dentist', affectedAppointments: 0 });
    expect((await services.schedule.cancelLeave(leave.id)).status).toBe('Cancelled');
    await rejectsWith(services.schedule.cancelLeave(leave.id), 'Leave.InvalidStatusTransition');
  });

  it('blocks the slots an approved leave covers', async () => {
    const { services, db } = createTestBackend({ signedInAs: AHMED });
    const free = async () => (await services.directory.getSlots('doc-ahmed', { branchId: 'br-nc', from: '2026-10-25', days: 1 })).filter((s) => s.available).length;
    expect(await free()).toBeGreaterThan(0);
    db.leaveRequests.push({ ...db.leaveRequests[0], id: 'lv-test', fromDate: '2026-10-25', toDate: '2026-10-25', status: 'Approved' });
    expect(await free()).toBe(0);
  });
});

describe("a patient's history (FR-EMR-12)", () => {
  it('shows visits, vitals and medicines across the branches in scope', async () => {
    const { services } = createTestBackend({ signedInAs: AHMED });
    const history = await services.history.get('pat-000412', { period: 'all' });
    expect(history.patient).toMatchObject({ fullName: 'Mohamed Adel', bloodType: 'O+', insurance: { payerName: 'Nile Health Insurance' } });
    expect(history.vitals.map((v) => [v.systolic, v.weightKg])).toEqual([[142, 84], [150, 82]]);
    expect(history.encounters.map((e) => [e.appointmentId, e.status, e.inProgress])).toEqual([
      ['apt-today', 'Draft', true],
      ['apt-cardio-consult', 'Signed', false],
      ['apt-dental-cleaning', 'Signed', false],
    ]);
    expect(history.prescriptions.find((p) => p.drugName === 'Concor')).toMatchObject({ active: true, doctorName: 'Dr. Ahmed Fathy' });
    expect((await services.history.get('pat-000412', { period: 'all', branchId: 'br-ma' })).encounters.map((e) => e.appointmentId)).toEqual(['apt-dental-cleaning']);
    expect((await services.history.downloadSummary('pat-000412')).type).toBe('application/pdf');
  });

  it('leaves out branches outside the scope, and refuses staff without encounters.view', async () => {
    const nurse = createTestBackend({ signedInAs: 'u-sara' }).services; // Nasr City only
    expect((await nurse.history.get('pat-000412', { period: 'all' })).encounters.map((e) => e.appointmentId)).not.toContain('apt-dental-cleaning');
    await rejectsWith(createTestBackend({ signedInAs: 'u-mona' }).services.history.get('pat-000412', { period: 'all' }), 'Access.OutOfScope');
    await rejectsWith(createTestBackend({ signedInAs: AHMED }).services.history.get('pat-missing', { period: 'all' }), 'Patient.NotFound');
  });
});
