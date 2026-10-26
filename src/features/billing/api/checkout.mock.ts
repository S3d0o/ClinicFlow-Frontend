import { requirePermission, sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { priceOf } from '@/mocks/booking';
import { delay } from '@/mocks/db';
import {
  amounts,
  chargeLines,
  findPatient,
  invoiceOf,
  nextInvoiceNumber,
  nextReceiptNo,
  openSessionOf,
  patientIdentity,
  serviceName,
  todayAt,
  toDeskAppointment,
} from '@/mocks/front-desk';
import { notify } from '@/mocks/notifications';
import { samplePdf } from '@/mocks/sample-pdf';
import type { CashSessionRecord } from '@/mocks/seed/front-desk';
import type { AppointmentRecord, InvoiceRecord } from '@/mocks/seed/patient-portal';
import { ServiceError } from '@/shared/api/service-error';
import { needsVarianceApproval, varianceOf, type CashSession } from '../model/cash-session';
import { changeDue, DESK_METHODS, type Checkout } from '../model/checkout';
import type { CashSessionService, CheckoutService } from './checkout.service';

const CHECKED_IN = new Set(['CheckedIn', 'InProgress', 'Completed']);
const toCents = (amount: number) => Math.round(amount * 100);

export function createMockCheckoutService(deps: AuthMockDeps): CheckoutService {
  const { db, latencyMs, now, outboxDelayMs } = deps;

  /** A checked-in visit at a branch where the user takes payments. */
  const visit = (appointmentId: string, permission: 'payments.collect' | 'invoices.create' = 'payments.collect') => {
    const record = db.appointments.find((a) => a.id === appointmentId);
    if (!record) throw new ServiceError('Appointment.NotFound');
    const user = requirePermission(deps, permission, record.branchId);
    if (!CHECKED_IN.has(record.status)) throw new ServiceError('Appointment.InvalidStatusTransition');
    return { record, user };
  };

  const view = (record: AppointmentRecord): Checkout => {
    const { subtotal, depositPaid, paidSoFar, due } = amounts(db, record);
    const invoice = invoiceOf(db, record.id);
    const lines = chargeLines(record);
    const patient = findPatient(db, record.patientId);
    const policy = patient?.userId ? db.policies.find((p) => p.patientUserId === patient.userId && p.isDefault && p.status === 'Verified') : undefined;
    const offered = db.doctors.find((d) => d.id === record.doctorId)?.services.map((s) => s.serviceId) ?? [];
    return structuredClone({
      appointment: toDeskAppointment(db, record),
      lines,
      subtotal,
      depositPaid,
      paidSoFar,
      due,
      invoice: invoice && { id: invoice.id, number: invoice.number, status: invoice.status as 'Issued' | 'PartiallyPaid' | 'Paid' },
      addableServiceIds: offered.filter((id) => !lines.some((line) => line.serviceId === id)),
      insurance: policy && { payerName: policy.payerName, coveragePercent: policy.coveragePercent },
    });
  };

  /** The first payment issues the invoice with the next number (FR-BIL-01, FR-BIL-10). */
  const issueInvoice = (record: AppointmentRecord): InvoiceRecord => {
    const patient = findPatient(db, record.patientId)!;
    const { language } = patientIdentity(db, patient);
    const { subtotal, depositPaid } = amounts(db, record);
    const number = nextInvoiceNumber(db, record.branchId, now());
    const invoice: InvoiceRecord = {
      id: `inv-${crypto.randomUUID()}`,
      number,
      patientId: record.patientId,
      patientUserId: patient.userId,
      appointmentId: record.id,
      branchId: record.branchId,
      doctorName: record.doctorName,
      issuedAt: now().toISOString(),
      status: 'Issued',
      lines: chargeLines(record).map((line) => ({ description: serviceName(db, line.serviceId, language), amount: line.total })),
      total: subtotal,
      deductions: depositPaid ? [{ kind: 'Deposit', amount: depositPaid }] : [],
      payments: [],
      balanceDue: subtotal - depositPaid,
    };
    db.invoices.push(invoice);
    notify(db, outboxDelayMs, patient.userId, 'InvoiceIssued', { invoice, appointment: record }, now);
    return invoice;
  };

  return {
    async listOpen(branchId) {
      await delay(latencyMs);
      requirePermission(deps, 'payments.collect', branchId);
      const today = todayAt(db, branchId, now());
      return db.appointments
        .filter((a) => a.branchId === branchId && a.date === today && CHECKED_IN.has(a.status) && amounts(db, a).due > 0)
        .sort((a, b) => Number(b.status === 'Completed') - Number(a.status === 'Completed') || (a.checkedInAt ?? '').localeCompare(b.checkedInAt ?? ''))
        .map((a) => toDeskAppointment(db, a));
    },

    async get(appointmentId) {
      await delay(latencyMs);
      return view(visit(appointmentId).record);
    },

    async addLine(appointmentId, serviceId) {
      await delay(latencyMs);
      const { record } = visit(appointmentId, 'invoices.create');
      if (invoiceOf(db, record.id)) throw new ServiceError('Invoice.NotDraft');
      const offered = db.doctors.find((d) => d.id === record.doctorId)?.services.some((s) => s.serviceId === serviceId);
      if (!offered) throw new ServiceError('Service.NotFound');
      record.extraLines = [
        ...(record.extraLines ?? []),
        { id: `line-${crypto.randomUUID()}`, serviceId, quantity: 1, unitPrice: priceOf(db, serviceId, record.branchId, record.doctorId, record.date) },
      ];
      return view(record);
    },

    async removeLine(appointmentId, lineId) {
      await delay(latencyMs);
      const { record } = visit(appointmentId, 'invoices.create');
      if (invoiceOf(db, record.id)) throw new ServiceError('Invoice.NotDraft');
      record.extraLines = (record.extraLines ?? []).filter((line) => line.id !== lineId);
      return view(record);
    },

    async collect(appointmentId, { method, amount, tendered, reference }) {
      await delay(latencyMs);
      const { record, user } = visit(appointmentId);
      if (!DESK_METHODS.includes(method)) throw new ServiceError('Payment.InvalidAmount');
      const { due } = amounts(db, record);
      if (due <= 0) throw new ServiceError('Invoice.NothingDue');
      if (toCents(amount) <= 0 || toCents(amount) > toCents(due)) throw new ServiceError('Payment.InvalidAmount');
      if (method === 'Cash' && tendered !== undefined && toCents(tendered) < toCents(amount)) throw new ServiceError('Payment.InvalidAmount');
      // Cash needs the receptionist's open session at this branch; other methods are recorded in it when there is one
      const session = openSessionOf(db, user.id);
      const sessionHere = session?.branchId === record.branchId ? session : undefined;
      if (method === 'Cash' && !sessionHere) throw new ServiceError('Payment.NoOpenCashSession');

      const invoice = invoiceOf(db, record.id) ?? issueInvoice(record);
      const paidAt = now().toISOString();
      const payment = {
        id: `pay-${crypto.randomUUID()}`,
        receiptNo: nextReceiptNo(db),
        kind: 'Payment' as const,
        branchId: record.branchId,
        patientId: record.patientId,
        appointmentId: record.id,
        invoiceId: invoice.id,
        serviceId: record.serviceId,
        method,
        amount,
        reference: reference?.trim() || undefined,
        cashSessionId: sessionHere?.id,
        receivedBy: user.id,
        receivedAt: paidAt,
      };
      db.payments.push(payment);
      const remaining = amounts(db, record).due;
      invoice.payments.push({ method, amount, paidAt });
      invoice.balanceDue = remaining;
      invoice.status = remaining > 0 ? 'PartiallyPaid' : 'Paid';
      notify(db, outboxDelayMs, record.patientUserId, 'PaymentReceived', { invoice, amount }, now);

      return {
        paymentId: payment.id,
        receiptNo: payment.receiptNo,
        invoiceNumber: invoice.number,
        method,
        amount,
        change: method === 'Cash' && tendered !== undefined ? changeDue(tendered, amount) : 0,
        paidAt,
        remaining,
      };
    },

    async downloadReceipt(paymentId) {
      await delay(latencyMs);
      const payment = db.payments.find((p) => p.id === paymentId);
      if (!payment) throw new ServiceError('Payment.NotFound');
      requirePermission(deps, 'payments.collect', payment.branchId);
      const invoice = db.invoices.find((i) => i.id === payment.invoiceId);
      const patient = findPatient(db, payment.patientId);
      return samplePdf(`Receipt ${payment.receiptNo}`, [
        `Invoice: ${invoice?.number ?? '-'}`,
        `Patient: ${patient?.mrn ?? ''}`,
        `Paid (${payment.method}): EGP ${payment.amount.toFixed(2)}`,
        `Balance due: EGP ${(invoice?.balanceDue ?? 0).toFixed(2)}`,
      ]);
    },
  };
}

export function createMockCashSessionService(deps: AuthMockDeps): CashSessionService {
  const { db, latencyMs, now } = deps;

  const toView = (session: CashSessionRecord): CashSession => {
    const drawer = db.drawers.find((d) => d.id === session.drawerId)!;
    const taken = db.payments.filter((p) => p.cashSessionId === session.id).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
    const cash = taken.filter((p) => p.method === 'Cash');
    const cashIn = cash.filter((p) => p.amount > 0).reduce((sum, p) => sum + p.amount, 0);
    const cashOut = -cash.filter((p) => p.amount < 0).reduce((sum, p) => sum + p.amount, 0);
    const expectedCash = session.expectedAmount ?? session.openingFloat + cashIn - cashOut;
    return structuredClone({
      id: session.id,
      branchId: session.branchId,
      drawer: { ...drawer },
      openedAt: session.openedAt,
      openedByName: db.users.find((u) => u.id === session.openedBy)?.fullName ?? '',
      openingFloat: session.openingFloat,
      status: session.status,
      cashIn,
      cashOut,
      expectedCash,
      byMethod: DESK_METHODS.map((method) => {
        const payments = taken.filter((p) => p.method === method && p.kind === 'Payment');
        return { method, amount: payments.reduce((sum, p) => sum + p.amount, 0), count: payments.length };
      }),
      transactions: taken.map((p) => {
        const patient = findPatient(db, p.patientId);
        return {
          id: p.id,
          receiptNo: p.receiptNo,
          at: p.receivedAt,
          kind: p.kind,
          patientName: patient ? patientIdentity(db, patient).fullName : '',
          serviceId: p.serviceId,
          method: p.method,
          amount: p.amount,
        };
      }),
      closedAt: session.closedAt,
      countedAmount: session.countedAmount,
      variance: session.variance,
      needsApproval: session.variance !== undefined ? needsVarianceApproval(session.variance) : undefined,
      note: session.note,
    });
  };

  return {
    async current() {
      await delay(latencyMs);
      const session = openSessionOf(db, sessionUser(deps).id);
      return session ? toView(session) : null;
    },

    async listDrawers(branchId) {
      await delay(latencyMs);
      requirePermission(deps, 'cash_sessions.operate', branchId);
      return db.drawers
        .filter((d) => d.branchId === branchId)
        .map((d) => {
          const open = db.cashSessions.find((s) => s.drawerId === d.id && s.status === 'Open');
          return { ...d, inUseBy: open && db.users.find((u) => u.id === open.openedBy)?.fullName };
        });
    },

    async open({ drawerId, openingFloat }) {
      await delay(latencyMs);
      const drawer = db.drawers.find((d) => d.id === drawerId);
      if (!drawer) throw new ServiceError('CashDrawer.NotFound');
      const user = requirePermission(deps, 'cash_sessions.operate', drawer.branchId);
      if (openSessionOf(db, user.id)) throw new ServiceError('CashSession.AlreadyOpen');
      if (db.cashSessions.some((s) => s.drawerId === drawerId && s.status === 'Open')) throw new ServiceError('CashDrawer.InUse');
      if (!(openingFloat >= 0)) throw new ServiceError('Payment.InvalidAmount');
      const session: CashSessionRecord = {
        id: `cs-${crypto.randomUUID()}`,
        branchId: drawer.branchId,
        drawerId,
        openedBy: user.id,
        openedAt: now().toISOString(),
        openingFloat,
        status: 'Open',
      };
      db.cashSessions.push(session);
      return toView(session);
    },

    async close(sessionId, { countedAmount, note }) {
      await delay(latencyMs);
      const user = sessionUser(deps);
      const session = db.cashSessions.find((s) => s.id === sessionId && s.openedBy === user.id);
      if (!session || session.status !== 'Open') throw new ServiceError('CashSession.NotOpen');
      if (!(countedAmount >= 0)) throw new ServiceError('Payment.InvalidAmount');
      const expected = toView(session).expectedCash;
      // Closed sessions are immutable; a variance above the threshold waits for a manager (phase 5 approvals)
      Object.assign(session, {
        status: 'Closed',
        closedAt: now().toISOString(),
        countedAmount,
        expectedAmount: expected,
        variance: varianceOf(countedAmount, expected),
        note: note?.trim() || undefined,
      });
      return toView(session);
    },

    async downloadReport(sessionId) {
      await delay(latencyMs);
      const session = db.cashSessions.find((s) => s.id === sessionId);
      if (!session) throw new ServiceError('CashSession.NotOpen');
      const view = toView(session);
      return samplePdf(`${view.status === 'Open' ? 'Interim (X) report' : 'Closing report'}: ${view.drawer.nameEn}`, [
        `Opened by ${view.openedByName}`,
        `Opening float: EGP ${view.openingFloat.toFixed(2)}`,
        ...view.byMethod.map((m) => `${m.method}: EGP ${m.amount.toFixed(2)} (${m.count})`),
        `Cash refunds: EGP ${view.cashOut.toFixed(2)}`,
        `Expected cash: EGP ${view.expectedCash.toFixed(2)}`,
        ...(view.countedAmount !== undefined ? [`Counted: EGP ${view.countedAmount.toFixed(2)}`, `Variance: EGP ${(view.variance ?? 0).toFixed(2)}`] : []),
      ]);
    },
  };
}
