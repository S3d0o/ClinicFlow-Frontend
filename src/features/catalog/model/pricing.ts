import type { PriceListItem } from './catalog';

export interface PriceQuery {
  serviceId: string;
  branchId: string;
  doctorId: string;
  /** The visit date, branch-local "yyyy-MM-dd". */
  date: string;
}

// Most specific first (FR-SVC-02): doctor at the branch, doctor, branch, organization.
const specificity = (item: PriceListItem, q: PriceQuery): number => {
  if (item.doctorId && item.doctorId !== q.doctorId) return -1;
  if (item.branchId && item.branchId !== q.branchId) return -1;
  return (item.doctorId ? 2 : 0) + (item.branchId ? 1 : 0);
};

const isValidOn = (item: PriceListItem, date: string) => item.validFrom <= date && (!item.validTo || date <= item.validTo);

/** The price of a service for a doctor at a branch on a date, or `null` when nothing applies. */
export function resolvePrice(items: readonly PriceListItem[], query: PriceQuery): number | null {
  let best: { item: PriceListItem; rank: number } | null = null;
  for (const item of items) {
    if (item.serviceId !== query.serviceId || !isValidOn(item, query.date)) continue;
    const rank = specificity(item, query);
    if (rank < 0) continue;
    // Same specificity: the item that started most recently replaces older ones
    if (!best || rank > best.rank || (rank === best.rank && item.validFrom > best.item.validFrom)) best = { item, rank };
  }
  return best?.item.price ?? null;
}

/** What the patient pays now and at the desk (UX_NOTES U4). */
export function priceBreakdown(price: number, deposit: number | undefined, payDeposit: boolean) {
  const paidNow = payDeposit && deposit ? Math.min(deposit, price) : 0;
  return { price, paidNow, payAtDesk: price - paidNow };
}
