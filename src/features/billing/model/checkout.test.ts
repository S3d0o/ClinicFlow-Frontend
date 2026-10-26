import { describe, expect, it } from 'vitest';
import { countTotal, needsVarianceApproval, varianceOf } from './cash-session';
import { changeDue, quickAmounts } from './checkout';

describe('cash at the checkout', () => {
  it('gives change to the piaster and never negative', () => {
    expect(changeDue(400, 350)).toBe(50);
    expect(changeDue(100.3, 100.1)).toBe(0.2);
    expect(changeDue(300, 350)).toBe(0);
  });

  it('offers the exact amount and the next round totals', () => {
    expect(quickAmounts(350)).toEqual([350, 400, 500]);
    expect(quickAmounts(200)).toEqual([200, 250, 300]);
    expect(quickAmounts(0)).toEqual([]);
  });
});

describe('closing the drawer', () => {
  it('counts banknotes and measures the variance', () => {
    expect(countTotal({ 200: 3, 50: 1, 5: 2 })).toBe(660);
    expect(varianceOf(940, 950)).toBe(-10);
    expect(needsVarianceApproval(-10)).toBe(false);
    expect(needsVarianceApproval(-70)).toBe(true);
  });
});
