import { describe, expect, it } from 'vitest';
import { DEMO_CODE, DEMO_PASSWORD } from '@/mocks/seed/users';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';

const rejectsWith = (promise: Promise<unknown>, code: string) => expect(promise).rejects.toSatisfy((e) => isServiceError(e, code));

describe('visits (FR-EMR-13)', () => {
  it('lists published summaries newest first and serves the prescription PDF', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    const visits = await services.visits.listMine();
    expect(visits.map((v) => v.id)).toEqual(['visit-cardio', 'visit-dental']);
    expect(visits[0]).toMatchObject({ prescriptionCount: 2, orderCount: 2 });
    const pdf = await services.visits.downloadPrescription('visit-cardio');
    expect(pdf.type).toBe('application/pdf');
    await rejectsWith(services.visits.downloadPrescription('visit-dental'), 'Visit.NoPrescription');
  });
});

describe('invoices (FR-PAT-04, FR-BIL-06)', () => {
  it('pays an open invoice online and notifies the patient', async () => {
    const { services, db } = createTestBackend({ signedInAs: 'u-mohamed' });
    expect((await services.billing.listMine()).map((i) => [i.number, i.status, i.balanceDue])).toEqual([
      ['NC-2026-000412', 'PartiallyPaid', 350],
      ['MA-2026-000914', 'Paid', 0],
    ]);
    await services.billing.startCheckout('inv-nc-412');
    expect((await services.billing.listMine())[0]).toMatchObject({ status: 'Paid', balanceDue: 0 });
    expect(db.notifications.at(-1)).toMatchObject({ type: 'PaymentReceived', link: { kind: 'invoice' } });
    await rejectsWith(services.billing.startCheckout('inv-nc-412'), 'Invoice.NothingDue');
  });
});

describe('documents and insurance (FR-PAT-06, FR-INS-03)', () => {
  it('uploads, lists and removes a document, refusing other types', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    const uploaded = await services.documents.upload(new File(['%PDF'], 'lab.pdf', { type: 'application/pdf' }));
    expect((await services.documents.listMine())[0].id).toBe(uploaded.id);
    await services.documents.remove(uploaded.id);
    expect((await services.documents.listMine()).map((d) => d.id)).not.toContain(uploaded.id);
    await rejectsWith(services.documents.upload(new File(['x'], 'notes.docx')), 'File.TypeNotAllowed');
  });

  it('adds an insurance card that waits for the desk to verify it', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    const policy = await services.insurance.add({
      payerId: 'payer-delta', memberNo: ' DC-1 ', holderName: 'Mohamed Adel', validTo: '2027-12-31',
      cardFront: new File(['img'], 'front.jpg', { type: 'image/jpeg' }),
    });
    expect(policy).toMatchObject({ payerName: 'Delta Care (TPA)', memberNo: 'DC-1', status: 'PendingVerification', isDefault: false });
  });
});

describe('profile (FR-ACC-05, FR-NTF-04)', () => {
  it('needs a confirmed email before email reminders', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    await rejectsWith(services.profile.updatePreferences({ notificationChannel: 'Both' }), 'Profile.EmailRequired');
    expect((await services.profile.updatePreferences({ preferredLanguage: 'en' })).preferredLanguage).toBe('en');
  });

  it('changes the phone once the code sent to the new number is verified', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    await rejectsWith(services.profile.requestPhoneChange('01000000004'), 'Auth.PhoneAlreadyUsed');
    const ticket = await services.profile.requestPhoneChange('0155 666 7777');
    expect((await services.profile.confirmPhoneChange(ticket.phone, DEMO_CODE)).phone).toBe('+201556667777');
  });

  it('changes the password after checking the current one', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    await rejectsWith(services.profile.changePassword('wrong', 'Fresh#Pass9'), 'Auth.InvalidCredentials');
    await services.profile.changePassword(DEMO_PASSWORD, 'Fresh#Pass9');
    await services.auth.signOut();
    expect((await services.auth.signIn({ identifier: '01012345678', password: 'Fresh#Pass9' })).status).toBe('signed-in');
  });
});

describe('notifications', () => {
  it('pages the inbox by category, renders in the patient’s language, and marks read', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-mohamed' });
    expect(await services.notifications.unreadCount()).toBe(2);
    const billing = await services.notifications.list({ page: 1, pageSize: 10, category: 'billing' });
    expect(billing.items.map((n) => n.type)).toEqual(['InvoiceIssued', 'PaymentReceived']);
    expect(billing.items[0].title).toBe('فاتورة جديدة'); // Mohamed's preferred language is Arabic

    const [first] = (await services.notifications.list({ page: 1, pageSize: 1 })).items;
    await services.notifications.markRead(first.id);
    expect(await services.notifications.unreadCount()).toBe(1);
    await services.notifications.markAllRead();
    expect(await services.notifications.unreadCount()).toBe(0);
  });
});
