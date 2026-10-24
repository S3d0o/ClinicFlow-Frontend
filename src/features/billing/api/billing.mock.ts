import { sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay } from '@/mocks/db';
import { notify } from '@/mocks/notifications';
import { samplePdf } from '@/mocks/sample-pdf';
import type { InvoiceRecord } from '@/mocks/seed/patient-portal';
import { ServiceError } from '@/shared/api/service-error';
import { isOpen, type PatientInvoice } from '../model/invoice';
import type { PatientBillingService } from './billing.service';

const toView = (record: InvoiceRecord): PatientInvoice => {
  const view: Partial<InvoiceRecord> = structuredClone(record);
  delete view.patientUserId;
  return view as PatientInvoice;
};

export function createMockBillingService(deps: AuthMockDeps): PatientBillingService {
  const { db, latencyMs, now, outboxDelayMs } = deps;

  const own = (invoiceId: string) => {
    const user = sessionUser(deps);
    const record = db.invoices.find((i) => i.id === invoiceId && i.patientUserId === user.id);
    if (!record) throw new ServiceError('Invoice.NotFound');
    return record;
  };

  return {
    async listMine() {
      await delay(latencyMs);
      const user = sessionUser(deps);
      return db.invoices
        .filter((i) => i.patientUserId === user.id)
        .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
        .map(toView);
    },

    async startCheckout(invoiceId) {
      await delay(latencyMs);
      const record = own(invoiceId);
      if (!isOpen(record) || record.balanceDue <= 0) throw new ServiceError('Invoice.NothingDue');
      // The demo has no Paymob: the hosted checkout "succeeds" and its webhook records the payment
      const amount = record.balanceDue;
      record.payments.push({ method: 'Online', amount, paidAt: now().toISOString() });
      record.balanceDue = 0;
      record.status = 'Paid';
      notify(db, outboxDelayMs, record.patientUserId, 'PaymentReceived', { invoice: record, amount }, now);
      return { checkoutUrl: '/patient/invoices?payment=success' };
    },

    async downloadPdf(invoiceId) {
      await delay(latencyMs);
      const invoice = own(invoiceId);
      return samplePdf(`${invoice.status === 'Paid' ? 'Receipt' : 'Invoice'} ${invoice.number}`, [
        ...invoice.lines.map((l) => `${l.description}: EGP ${l.amount.toFixed(2)}`),
        ...invoice.deductions.map((d) => `- ${d.label ?? d.kind}: EGP ${d.amount.toFixed(2)}`),
        ...invoice.payments.map((p) => `Paid (${p.method}): EGP ${p.amount.toFixed(2)}`),
        `Balance due: EGP ${invoice.balanceDue.toFixed(2)}`,
      ]);
    },
  };
}
