import { describe, expect, it } from 'vitest';
import type { PriceListItem } from './catalog';
import { priceBreakdown, resolvePrice } from './pricing';

const item = (overrides: Partial<PriceListItem>): PriceListItem => ({
  id: crypto.randomUUID(),
  serviceId: 'svc-consult',
  price: 300,
  validFrom: '2026-01-01',
  ...overrides,
});

const query = { serviceId: 'svc-consult', branchId: 'br-nc', doctorId: 'doc-1', date: '2026-10-24' };

describe('price resolution (FR-SVC-02)', () => {
  const items = [
    item({ price: 300 }),
    item({ branchId: 'br-nc', price: 320 }),
    item({ doctorId: 'doc-1', price: 450 }),
    item({ doctorId: 'doc-1', branchId: 'br-sz', price: 500 }),
  ];

  it('picks the most specific price that applies', () => {
    expect(resolvePrice(items, query)).toBe(450);
    expect(resolvePrice(items, { ...query, branchId: 'br-sz' })).toBe(500);
    expect(resolvePrice(items, { ...query, doctorId: 'doc-2' })).toBe(320);
    expect(resolvePrice(items, { ...query, doctorId: 'doc-2', branchId: 'br-ma' })).toBe(300);
  });

  it('ignores prices outside their dates and uses the newest of equal ones', () => {
    const history = [
      item({ price: 250, validTo: '2026-06-30' }),
      item({ price: 300, validFrom: '2026-07-01' }),
      item({ price: 350, validFrom: '2026-12-01' }),
    ];
    expect(resolvePrice(history, { ...query, date: '2026-03-01' })).toBe(250);
    expect(resolvePrice(history, query)).toBe(300);
    expect(resolvePrice(history, { ...query, date: '2026-12-05' })).toBe(350);
  });

  it('returns null when the service has no price', () => {
    expect(resolvePrice(items, { ...query, serviceId: 'svc-other' })).toBeNull();
  });
});

describe('price breakdown (U4)', () => {
  it('splits the price into a deposit paid now and the rest at the desk', () => {
    expect(priceBreakdown(450, 100, true)).toEqual({ price: 450, paidNow: 100, payAtDesk: 350 });
    expect(priceBreakdown(450, 100, false)).toEqual({ price: 450, paidNow: 0, payAtDesk: 450 });
    expect(priceBreakdown(450, undefined, true)).toEqual({ price: 450, paidNow: 0, payAtDesk: 450 });
  });
});
