import { describe, expect, it } from 'vitest';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';

const rejectsWith = (promise: Promise<unknown>, code: string) => expect(promise).rejects.toSatisfy((e) => isServiceError(e, code));

const NC = 'br-nc';
const TODAY = '2026-10-24'; // TEST_NOW: Saturday 08:00 in Cairo
const MINUTE = 60_000;
const RECEPTIONIST = 'u-mona';
const NURSE = 'u-sara';

describe('patients (FR-FD-01, FR-FD-02)', () => {
  it('finds patients by name in any Arabic spelling, partial phone, MRN and date of birth', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    const names = async (q: string) => (await services.patients.search(q)).map((p) => p.fullName);
    expect(await names('احمد ابراهيم')).toEqual(['أحمد إبراهيم']);
    expect(await names('فاطمه')).toEqual(['فاطمة حسن']);
    expect(await names('010 1234 5678')).toEqual(['Mohamed Adel', 'Mona Adel']);
    expect(await names('412')).toEqual(['Mohamed Adel']);
    expect(await names('1987-10-03')).toEqual(['أحمد إبراهيم']);
    expect(await names('mona adel')).toEqual(['Mona Adel']);
  });

  it('filters by balance and insurance', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    const [mohamed] = await services.patients.search('Mohamed', 'balance');
    expect(mohamed).toMatchObject({ balanceDue: 350, hasPortalAccount: true, insurance: { payerName: 'Nile Health Insurance', status: 'Verified' } });
    expect(await services.patients.search('Mona Adel', 'insured')).toEqual([]);
  });

  it('warns about the same phone or the same name and birth date, and registers with the next MRN', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    expect((await services.patients.findDuplicates({ phone: '01012345678' })).map((p) => p.fullName)).toEqual(['Mohamed Adel', 'Mona Adel']);
    expect(await services.patients.findDuplicates({ fullName: 'hazem  mostafa', dateOfBirth: '1979-03-02' })).toHaveLength(1);
    expect(await services.patients.findDuplicates({ fullName: 'Hazem Mostafa', dateOfBirth: '1980-01-01' })).toEqual([]);

    const created = await services.patients.register({ fullName: ' Laila Samir ', phone: '0109 999 8888', gender: 'Female', dateOfBirth: '1993-04-02' });
    expect(created).toMatchObject({ mrn: 'MRN-000413', fullName: 'Laila Samir', phone: '+201099998888', hasPortalAccount: false, balanceDue: 0 });
    expect((await services.patients.get(created.id)).id).toBe(created.id);
    await rejectsWith(services.patients.get('pat-missing'), 'Patient.NotFound');
  });
});

describe('the desk day (FR-FD-03, FR-APT-03/04/07)', () => {
  it('lists the branch day and keeps other branches out of scope', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    const day = await services.desk.listDay(NC, TODAY);
    expect(day.length).toBeGreaterThanOrEqual(20);
    expect(day.find((a) => a.id === 'apt-today')).toMatchObject({ patient: { fullName: 'Mohamed Adel', mrn: 'MRN-000412' }, queue: { ticketNo: 'A-14' } });
    expect(day.find((a) => a.id === 'apt-d-a2')).toMatchObject({ status: 'Completed', amountDue: 200, invoiced: false });
    await rejectsWith(services.desk.listDay('br-ma', TODAY), 'Access.OutOfScope');
  });

  it('checks in from an hour before the visit, with the next ticket at the end of the triage line', async () => {
    const { services, advance } = createTestBackend({ signedInAs: RECEPTIONIST });
    await rejectsWith(services.desk.checkIn('apt-d-a7'), 'Appointment.CheckInWindowClosed'); // starts in 70 minutes
    advance(10 * MINUTE);
    const view = await services.desk.getCheckIn('apt-d-a7');
    expect(view.charges).toEqual({ price: 450, depositPaid: 100, due: 350 });
    const checkedIn = await services.desk.checkIn('apt-d-a7');
    expect(checkedIn).toMatchObject({ status: 'CheckedIn', queue: { ticketNo: 'A-17', stage: 'WaitingTriage' } });
    const entry = (await services.queueBoard.board(NC)).find((e) => e.appointmentId === 'apt-d-a7');
    expect(entry?.position).toBe(4);
    await rejectsWith(services.desk.checkIn('apt-d-a7'), 'Appointment.InvalidStatusTransition');
  });

  it('marks a no-show only after the grace period', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    expect((await services.desk.markNoShow('apt-d-a8')).status).toBe('NoShow'); // 25 minutes late
    await rejectsWith(services.desk.markNoShow('apt-d-l5'), 'Appointment.NoShowTooEarly'); // starts in 20 minutes
  });

  it('books on behalf over the phone, and takes walk-ins up to the cap', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    const slots = await services.directory.getSlots('doc-laila', { branchId: NC, days: 7 });
    const slot = slots.find((s) => s.available)!;
    const booked = await services.desk.book({ patientId: 'pat-000118', doctorId: 'doc-laila', branchId: NC, serviceId: 'svc-ped-c', slotId: slot.id, source: 'Phone' });
    expect(booked).toMatchObject({ status: 'Confirmed', source: 'Phone', price: 350, patient: { fullName: 'Layla Hany' } });
    await rejectsWith(
      services.desk.book({ patientId: 'pat-000119', doctorId: 'doc-laila', branchId: NC, serviceId: 'svc-ped-c', slotId: slot.id, source: 'Desk' }),
      'Slot.CapacityReached'
    );

    // Dr. Laila's first slot is at 09:00, more than 30 minutes away: walk-ins join unslotted
    const walkIn = await services.desk.walkIn({ patientId: 'pat-000119', doctorId: 'doc-laila', branchId: NC, serviceId: 'svc-ped-c', complaint: ' Cough ' });
    expect(walkIn).toMatchObject({ status: 'CheckedIn', source: 'WalkIn', startTime: '08:00', queue: { stage: 'WaitingTriage' } });
    for (const patientId of ['pat-000114', 'pat-000104', 'pat-000105']) {
      await services.desk.walkIn({ patientId, doctorId: 'doc-laila', branchId: NC, serviceId: 'svc-ped-f' });
    }
    await rejectsWith(services.desk.walkIn({ patientId: 'pat-000110', doctorId: 'doc-laila', branchId: NC, serviceId: 'svc-ped-f' }), 'Appointment.WalkInCapReached');
  });
});

describe('the queue (FR-FD-04/05/06)', () => {
  it('calls the next patient in when the doctor is free, never two at once', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    const called = await services.queueBoard.call('apt-d-h2');
    expect(called).toMatchObject({ stage: 'WithDoctor', room: { nameEn: 'Room 203' } });
    expect((await services.desk.listDay(NC, TODAY)).find((a) => a.id === 'apt-d-h2')?.status).toBe('InProgress');
    await rejectsWith(services.queueBoard.call('apt-d-a4'), 'Appointment.DoctorBusy');
    await rejectsWith(services.queueBoard.call('apt-d-l3'), 'Appointment.InvalidStatusTransition'); // not triaged yet
  });

  it('moves a patient to the front with a reason and tells the patient’s phone', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    const updates: number[] = [];
    const stop = services.queue.watch('apt-today', (status) => updates.push(status.position));
    await rejectsWith(services.queueBoard.moveToFront('apt-today', '  '), 'Queue.ReasonRequired');
    const moved = await services.queueBoard.moveToFront('apt-today', 'Chest pain while waiting');
    stop();
    expect(moved).toMatchObject({ position: 1, priorityReason: 'Chest pain while waiting' });
    expect(updates).toEqual([3, 1]);
  });

  it('shows tickets and rooms on the waiting-room screen without names', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    const display = await services.queueBoard.display(NC);
    const ahmed = display.rooms.find((r) => r.doctorId === 'doc-ahmed')!;
    expect(ahmed).toMatchObject({ nowServing: 'A-05', next: ['A-08', 'A-09'], waitingCount: 3, room: { nameEn: 'Room 204' } });
    expect(JSON.stringify(display)).not.toContain('Mohamed');
  });

  it('notifies subscribers of the branch only', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    let changes = 0;
    const stop = services.queueBoard.subscribe(NC, () => changes++);
    await services.queueBoard.call('apt-d-h2');
    stop();
    await services.queueBoard.moveToFront('apt-d-l4', 'Fever');
    expect(changes).toBe(1);
  });
});

describe('triage (FR-EMR-02)', () => {
  it('keeps a draft, refuses impossible values and unconfirmed allergies, then sends the patient to the doctor', async () => {
    const { services } = createTestBackend({ signedInAs: NURSE });
    const triageCase = await services.triage.get('apt-d-l4');
    expect(triageCase.patient).toMatchObject({ fullName: 'Tamer Zaki', allergies: [{ name: 'Amoxicillin' }] });

    await services.triage.saveDraft('apt-d-l4', { temperature: 38.4, allergiesConfirmed: false });
    expect((await services.triage.get('apt-d-l4')).draft?.form.temperature).toBe(38.4);

    await rejectsWith(services.triage.submit('apt-d-l4', { temperature: 384, allergiesConfirmed: true }), 'Vitals.OutOfRange');
    await rejectsWith(services.triage.submit('apt-d-l4', { temperature: 38.4, allergiesConfirmed: false }), 'Triage.AllergiesNotConfirmed');
    const entry = await services.triage.submit('apt-d-l4', { temperature: 38.4, pulse: 120, chiefComplaint: ' Fever ', allergiesConfirmed: true });
    expect(entry).toMatchObject({ stage: 'ReadyForDoctor', position: 1, complaint: 'Fever', vitals: { pulse: 120 } });
    await rejectsWith(services.triage.submit('apt-d-l4', { allergiesConfirmed: true }), 'Appointment.InvalidStatusTransition');
  });
});

describe('checkout (FR-BIL-01/02/05/10/14)', () => {
  it('adds a service, takes cash with change, issues the next invoice number and locks the lines', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    expect((await services.checkout.listOpen(NC)).map((a) => a.id)).toEqual(expect.arrayContaining(['apt-d-a2', 'apt-d-h1']));

    const checkout = await services.checkout.addLine('apt-d-a2', 'svc-car-ecg');
    expect(checkout).toMatchObject({ subtotal: 350, due: 350, invoice: undefined });
    expect(checkout.lines.map((l) => [l.serviceId, l.total, l.booked])).toEqual([['svc-car-f', 200, true], ['svc-car-ecg', 150, false]]);

    const receipt = await services.checkout.collect('apt-d-a2', { method: 'Cash', amount: 350, tendered: 400 });
    expect(receipt).toMatchObject({ invoiceNumber: 'NC-2026-000415', change: 50, remaining: 0, receiptNo: 'RC-10013' });
    await rejectsWith(services.checkout.addLine('apt-d-a2', 'svc-car-echo'), 'Invoice.NotDraft');
    await rejectsWith(services.checkout.collect('apt-d-a2', { method: 'Card', amount: 10 }), 'Invoice.NothingDue');
    expect((await services.checkout.listOpen(NC)).map((a) => a.id)).not.toContain('apt-d-a2');
    expect((await services.checkout.downloadReceipt(receipt.paymentId)).type).toBe('application/pdf');
  });

  it('takes part of the amount by card and refuses more than is due', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    await rejectsWith(services.checkout.collect('apt-d-h1', { method: 'Card', amount: 200 }), 'Payment.InvalidAmount');
    const receipt = await services.checkout.collect('apt-d-h1', { method: 'Card', amount: 100, reference: 'POS-77' });
    expect(receipt.remaining).toBe(75);
    expect((await services.checkout.get('apt-d-h1')).invoice?.status).toBe('PartiallyPaid');
  });

  it('needs an open cash session for cash', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-hala' }); // a manager takes payments but has no drawer
    await rejectsWith(services.checkout.collect('apt-d-h1', { method: 'Cash', amount: 175 }), 'Payment.NoOpenCashSession');
    expect((await services.checkout.collect('apt-d-h1', { method: 'Card', amount: 175 })).remaining).toBe(0);
  });
});

describe('cash sessions (FR-BIL-09)', () => {
  it('sums the drawer, closes with the counted cash and opens a new session', async () => {
    const { services } = createTestBackend({ signedInAs: RECEPTIONIST });
    const session = (await services.cashSessions.current())!;
    expect(session).toMatchObject({ openingFloat: 500, cashIn: 600, cashOut: 150, expectedCash: 950, drawer: { nameEn: 'Desk 1' } });
    expect(session.byMethod.find((m) => m.method === 'Card')).toEqual({ method: 'Card', amount: 100, count: 1 });
    expect(session.transactions[0].kind).toBe('Refund');

    await rejectsWith(services.cashSessions.open({ drawerId: 'drw-nc-2', openingFloat: 300 }), 'CashSession.AlreadyOpen');
    const closed = await services.cashSessions.close(session.id, { countedAmount: 880, note: 'Short' });
    expect(closed).toMatchObject({ status: 'Closed', variance: -70, needsApproval: true });
    expect(await services.cashSessions.current()).toBeNull();
    await rejectsWith(services.cashSessions.close(session.id, { countedAmount: 880 }), 'CashSession.NotOpen');

    const reopened = await services.cashSessions.open({ drawerId: 'drw-nc-1', openingFloat: 300 });
    expect(reopened).toMatchObject({ expectedCash: 300, transactions: [] });
    expect((await services.cashSessions.listDrawers(NC)).find((d) => d.id === 'drw-nc-1')?.inUseBy).toBe('Mona Samir');
  });
});
