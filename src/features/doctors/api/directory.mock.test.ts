import { describe, expect, it } from 'vitest';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';
import type { DoctorSearch } from './directory.service';

const search = (overrides: Partial<DoctorSearch> = {}): DoctorSearch => ({ page: 1, pageSize: 20, sort: 'soonest', ...overrides });

describe('mock doctor directory', () => {
  it('finds doctors by name or specialty in either language', async () => {
    const { services } = createTestBackend();
    const byName = await services.directory.searchDoctors(search({ text: 'ahmed' }));
    expect(byName.items.map((d) => d.fullName)).toEqual(['Dr. Ahmed Fathy']);

    const bySpecialty = await services.directory.searchDoctors(search({ text: 'القلب' }));
    expect(bySpecialty.items.map((d) => d.id).sort()).toEqual(['doc-ahmed', 'doc-tamer']);
  });

  it('filters by branch and specialty, and pages with a total', async () => {
    const { services } = createTestBackend();
    const atMaadi = await services.directory.searchDoctors(search({ branchId: 'br-ma' }));
    expect(atMaadi.items.every((d) => d.branchIds.includes('br-ma'))).toBe(true);

    const page = await services.directory.searchDoctors(search({ pageSize: 4, page: 3 }));
    expect(page.total).toBe(10);
    expect(page.items).toHaveLength(2);
  });

  it('prices each doctor from the price list, at the searched branch', async () => {
    const { services } = createTestBackend();
    const { items } = await services.directory.searchDoctors(search({ specialtyId: 'sp-cardio', sort: 'price' }));
    expect(items.map((d) => [d.id, d.fromPrice])).toEqual([
      ['doc-tamer', 400],
      ['doc-ahmed', 450],
    ]);
    const atSheikhZayed = await services.directory.searchDoctors(search({ specialtyId: 'sp-cardio', branchId: 'br-sz' }));
    expect(atSheikhZayed.items.map((d) => d.fromPrice)).toEqual([450]);
  });

  it("returns the profile with services, prices per branch and rating counts", async () => {
    const { services } = createTestBackend();
    const profile = await services.directory.getDoctor('doc-ahmed');
    expect(profile.services.find((s) => s.serviceId === 'svc-car-c')).toMatchObject({
      durationMinutes: 30,
      depositAmount: 100,
      prices: [
        { branchId: 'br-nc', price: 450 },
        { branchId: 'br-ma', price: 450 },
      ],
    });
    expect(Object.values(profile.ratingCounts).reduce((a, b) => a + b, 0)).toBe(profile.reviewCount);
  });

  it('offers slots only in the future and only at the asked branch', async () => {
    const { services } = createTestBackend();
    const slots = await services.directory.getSlots('doc-ahmed', { branchId: 'br-nc', from: '2026-10-24', days: 7 });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.branchId === 'br-nc' && s.startsAtUtc > '2026-10-24T05:00:00Z')).toBe(true);
  });

  it('pages reviews newest first and filters by rating', async () => {
    const { services } = createTestBackend();
    const fiveStars = await services.directory.listReviews('doc-ahmed', { page: 1, pageSize: 5, rating: 5 });
    expect(fiveStars.items.every((r) => r.rating === 5)).toBe(true);
    expect(fiveStars.items.map((r) => r.createdAt)).toEqual([...fiveStars.items.map((r) => r.createdAt)].sort().reverse());
  });

  it('hides unknown doctors', async () => {
    const { services } = createTestBackend();
    await expect(services.directory.getDoctor('doc-nobody')).rejects.toSatisfy((e) => isServiceError(e, 'Doctor.NotFound'));
  });
});
