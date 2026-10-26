import type { CashDrawer, CashSession } from '../model/cash-session';
import type { Checkout, CheckoutSummary, CollectRequest, Receipt } from '../model/checkout';

/**
 * Taking payment at the desk (`GET /api/v2/appointments/{id}/amount-due`, `/invoices`, `POST /payments`;
 * `payments.collect`). Errors: `Appointment.NotFound`, `Invoice.NotDraft`, `Invoice.NothingDue`,
 * `Payment.InvalidAmount`, `Payment.NoOpenCashSession`.
 */
export interface CheckoutService {
  /** Today's checked-in visits at the branch with something left to pay. */
  listOpen(branchId: string): Promise<CheckoutSummary[]>;
  get(appointmentId: string): Promise<Checkout>;
  /** Adds a service line while the invoice is still a draft (FR-BIL-02). */
  addLine(appointmentId: string, serviceId: string): Promise<Checkout>;
  removeLine(appointmentId: string, lineId: string): Promise<Checkout>;
  /**
   * Takes a payment: issues the invoice on the first one, records the payment in the receptionist's
   * open cash session (required for cash) and returns the receipt. Sends an `Idempotency-Key`.
   */
  collect(appointmentId: string, request: CollectRequest): Promise<Receipt>;
  /** The receipt as a PDF (FR-BIL-07). */
  downloadReceipt(paymentId: string): Promise<Blob>;
}

/**
 * The receptionist's cash drawer (`/api/v2/branches/{id}/cash-sessions`, `cash_sessions.operate`).
 * Errors: `CashSession.AlreadyOpen`, `CashDrawer.InUse`, `CashSession.NotOpen`.
 */
export interface CashSessionService {
  /** The signed-in user's open session, or null (one per user, FR-BIL-09). */
  current(): Promise<CashSession | null>;
  listDrawers(branchId: string): Promise<CashDrawer[]>;
  open(request: { drawerId: string; openingFloat: number }): Promise<CashSession>;
  /** Closes with the counted cash; the session is then immutable. */
  close(sessionId: string, request: { countedAmount: number; note?: string }): Promise<CashSession>;
  /** The interim (X) or closing report as a PDF. */
  downloadReport(sessionId: string): Promise<Blob>;
}
