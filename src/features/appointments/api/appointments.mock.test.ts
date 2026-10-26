import { describe, expect, it } from 'vitest';
import { DEMO_REMINDER_TOKEN } from '@/mocks/seed/patient-portal';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';
import type { QueueStatus } from '../model/appointment';

const rejectsWith = (promise: Promise<unknown>, code: string) => expect(promise).rejects.toSatisfy((e) => isServiceError(e, code));

/** The first free slot of Dr. Ahmed at Nasr City. */
async function freeSlot(services: ReturnType<typeof createTestBackend>['services']) {
  const slots = await services.directory.getSlots('doc-ahmed', { branchId: 'br-nc', days: 14 });
  return slots.find((s) => s.available)!;
}

describe("patient's appointments", () => {
  it('lists the patient’s own appointments', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    const mine = await services.appointments.listMine();
    expect(mine.map((a) => a.id)).toContain('apt-today');
    expect(mine.find((a) => a.id === 'apt-today')?.queue).toMatchObject({ ticketNo: 'A-14', position: 3 });
  });

  it('books a confirmed appointment priced from the price list, and takes the slot', async () => {
    const { services, db } = createTestBackend({ signedInAs: 'u-mohamed' });
    const slot = await freeSlot(services);
    const booked = await services.appointments.book({ doctorId: 'doc-ahmed', branchId: 'br-nc', serviceId: 'svc-car-c', slotId: slot.id, acceptTerms: true });

    expect(booked).toMatchObject({ status: 'Confirmed', price: 450, depositAmount: 100, depositPaid: false, date: slot.date, startTime: slot.startTime });
    expect(Date.parse(booked.changeableUntil)).toBe(Date.parse(slot.startsAtUtc) - 2 * 3_600_000);
    expect((await freeSlot(services)).id).not.toBe(slot.id);
    expect(db.notifications.at(-1)).toMatchObject({ type: 'AppointmentConfirmed', link: { kind: 'appointment', id: booked.id } });
  });

  it('refuses a taken slot and a booking without consent', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    const slot = await freeSlot(services);
    const request = { doctorId: 'doc-ahmed', branchId: 'br-nc', serviceId: 'svc-car-c', slotId: slot.id };
    await rejectsWith(services.appointments.book({ ...request, acceptTerms: false }), 'Consent.Required');
    await services.appointments.book({ ...request, acceptTerms: true });
    await rejectsWith(services.appointments.book({ ...request, acceptTerms: true }), 'Slot.CapacityReached');
  });

  it('reschedules into a new appointment linked to the old one, keeping a paid deposit', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    await services.appointments.startDepositCheckout('apt-eyes');
    const slots = await services.directory.getSlots('doc-omar-h', { branchId: 'br-nc', days: 14 });
    const target = slots.find((s) => s.available && s.date !== '2026-10-29')!;

    const moved = await services.appointments.reschedule('apt-eyes', target.id);
    expect(moved).toMatchObject({ status: 'Confirmed', rescheduledFromId: 'apt-eyes', depositPaid: true, startTime: target.startTime });
    expect(await services.appointments.getMine('apt-eyes')).toMatchObject({ status: 'Rescheduled', rescheduledToId: moved.id });
  });

  it('cancels with a reason, but not after the change window', async () => {
    const { services, advance } = createTestBackend({ signedInAs: 'u-mohamed' });
    const cancelled = await services.appointments.cancel('apt-dental-checkup', { reason: 'FeelingBetter' });
    expect(cancelled).toMatchObject({ status: 'Cancelled', cancelledBy: 'Patient', cancellationReason: 'FeelingBetter' });

    advance(5 * 86_400_000 + 12 * 3_600_000); // to within 2 hours of the eye exam
    await rejectsWith(services.appointments.cancel('apt-eyes', { reason: 'Other' }), 'Appointment.CancellationWindowExpired');
  });

  it('takes the optional deposit once, only where the service offers one (§13.7)', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    expect(await services.appointments.startDepositCheckout('apt-eyes')).toEqual({ checkoutUrl: '/patient/appointments/apt-eyes?payment=success' });
    expect((await services.appointments.getMine('apt-eyes')).depositPaid).toBe(true);
    await rejectsWith(services.appointments.startDepositCheckout('apt-eyes'), 'Deposit.AlreadyPaid');
    await rejectsWith(services.appointments.startDepositCheckout('apt-dental-checkup'), 'Deposit.NotOffered');
  });

  it('tells an unknown slot from a started one, and a service the doctor doesn’t offer (§13.7)', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    const book = (slotId: string, serviceId = 'svc-car-c') =>
      services.appointments.book({ doctorId: 'doc-ahmed', branchId: 'br-nc', serviceId, slotId, acceptTerms: true });
    await rejectsWith(book('doc-ahmed|br-nc|2026-10-24|04:00'), 'Appointment.SlotInPast');
    await rejectsWith(book('no-such-slot'), 'Appointment.SlotNotFound');
    await rejectsWith(book((await freeSlot(services)).id, 'svc-ped-c'), 'Booking.ServiceNotOffered');
  });

  it('accepts one review per completed visit', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    await services.appointments.submitReview('apt-cardio-consult', { rating: 5, comment: 'Very clear.' });
    await rejectsWith(services.appointments.submitReview('apt-cardio-consult', { rating: 4 }), 'Appointment.ReviewAlreadyExists');
    await rejectsWith(services.appointments.submitReview('apt-eyes', { rating: 4 }), 'Appointment.ReviewNotAllowed');
  });

  it("hides other patients' appointments", async () => {
    const { services } = createTestBackend({ signedInAs: 'u-nour' });
    await rejectsWith(services.appointments.getMine('apt-today'), 'Appointment.NotFound');
  });
});

describe('reminder link (FR-APT-10)', () => {
  it('shows the visit without signing in, and confirms attendance', async () => {
    const { services } = createTestBackend();
    expect(await services.reminders.get(DEMO_REMINDER_TOKEN)).toMatchObject({ appointmentId: 'apt-eyes', attendanceConfirmed: false });
    expect((await services.reminders.confirm(DEMO_REMINDER_TOKEN)).attendanceConfirmed).toBe(true);
  });

  it('cancels from the link and refuses unknown links', async () => {
    const { services } = createTestBackend();
    expect((await services.reminders.cancel(DEMO_REMINDER_TOKEN)).status).toBe('Cancelled');
    await rejectsWith(services.reminders.get('nope'), 'Reminder.LinkInvalid');
  });
});

describe('live queue', () => {
  it('sends the current place at once', () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    const updates: QueueStatus[] = [];
    const stop = services.queue.watch('apt-today', (status) => updates.push(status));
    stop();
    expect(updates).toEqual([expect.objectContaining({ ticketNo: 'A-14', stage: 'ReadyForDoctor', position: 3 })]);
  });
});
