import { resolvePrice } from '@/features/catalog/model/pricing';
import { delay, type MockDeps } from '@/mocks/db';
import type { DoctorSeed } from '@/mocks/seed/doctors';
import { slotsAt, timeZoneOf } from '@/mocks/slot-availability';
import { ServiceError } from '@/shared/api/service-error';
import { addDays, todayIn } from '@/shared/lib/branch-time';
import type { DoctorProfile, DoctorSummary, Slot } from '../model/doctor';
import type { BranchService, DirectoryService, DoctorSearch } from './directory.service';

const NEXT_SLOTS = 3;
const SEARCH_DAYS = 14; // V1 books up to 14 days ahead

export function createMockDirectoryService({ db, latencyMs, now }: MockDeps): DirectoryService {
  const branchIdsOf = (doctor: DoctorSeed) => [...new Set(doctor.schedule.map((s) => s.branchId))];
  const today = () => todayIn('Africa/Cairo', now());

  /** Slots at one branch or all of the doctor's branches, each in its own branch's zone. */
  const slotsOf = (doctor: DoctorSeed, from: string, days: number, branchId?: string): Slot[] =>
    (branchId ? [branchId] : branchIdsOf(doctor))
      .flatMap((id) => slotsAt(db, doctor.id, id, from, days, now()))
      .sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc));

  const consultationOf = (doctor: DoctorSeed) =>
    doctor.services.map((s) => db.services.find((svc) => svc.id === s.serviceId)).find((svc) => svc?.category === 'Consultation');

  const priceAt = (doctor: DoctorSeed, serviceId: string, branchId: string) =>
    resolvePrice(db.priceList, { serviceId, branchId, doctorId: doctor.id, date: todayIn(timeZoneOf(db, branchId), now()) });

  const reviewsOf = (doctorId: string) => db.reviews.filter((r) => r.doctorId === doctorId);

  function summarize(doctor: DoctorSeed, branchId?: string, serviceId?: string): DoctorSummary {
    const user = db.users.find((u) => u.id === doctor.userId)!;
    const reviews = reviewsOf(doctor.id);
    const priced = serviceId ?? consultationOf(doctor)?.id;
    const prices = priced
      ? (branchId ? [branchId] : branchIdsOf(doctor)).map((id) => priceAt(doctor, priced, id)).filter((p) => p !== null)
      : [];
    return {
      id: doctor.id,
      fullName: user.fullName,
      specialtyId: doctor.specialtyId,
      branchIds: branchIdsOf(doctor),
      languages: doctor.languages,
      yearsOfExperience: doctor.yearsOfExperience,
      rating: reviews.length ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : 0,
      reviewCount: reviews.length,
      fromPrice: prices.length ? Math.min(...prices) : null,
      nextSlots: slotsOf(doctor, today(), SEARCH_DAYS, branchId).filter((s) => s.available).slice(0, NEXT_SLOTS),
    };
  }

  function matches(doctor: DoctorSeed, search: DoctorSearch): boolean {
    if (!doctor.isPublic) return false;
    if (search.branchId && !branchIdsOf(doctor).includes(search.branchId)) return false;
    if (search.specialtyId && doctor.specialtyId !== search.specialtyId) return false;
    if (search.serviceId && !doctor.services.some((s) => s.serviceId === search.serviceId)) return false;
    if (search.language && !doctor.languages.includes(search.language)) return false;
    if (search.text?.trim()) {
      const text = search.text.trim().toLowerCase();
      const name = db.users.find((u) => u.id === doctor.userId)?.fullName.toLowerCase() ?? '';
      const specialty = db.specialties.find((s) => s.id === doctor.specialtyId);
      const haystack = [name, name.replace(/^dr\.?\s*/, ''), specialty?.nameEn.toLowerCase(), specialty?.nameAr];
      if (!haystack.some((h) => h?.includes(text))) return false;
    }
    if (search.availability) {
      const days = search.availability === 'week' ? 7 : 1;
      const from = search.availability === 'tomorrow' ? addDays(today(), 1) : today();
      if (!slotsOf(doctor, from, days, search.branchId).some((s) => s.available)) return false;
    }
    return true;
  }

  const compare: Record<DoctorSearch['sort'], (a: DoctorSummary, b: DoctorSummary) => number> = {
    soonest: (a, b) => (a.nextSlots[0]?.startsAtUtc ?? '~').localeCompare(b.nextSlots[0]?.startsAtUtc ?? '~'),
    rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
    price: (a, b) => (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity),
  };

  const publicDoctor = (doctorId: string) => {
    const doctor = db.doctors.find((d) => d.id === doctorId && d.isPublic);
    if (!doctor) throw new ServiceError('Doctor.NotFound');
    return doctor;
  };

  return {
    async searchDoctors(search) {
      await delay(latencyMs);
      const results = db.doctors
        .filter((d) => matches(d, search))
        .map((d) => summarize(d, search.branchId, search.serviceId))
        .sort(compare[search.sort]);
      const start = (search.page - 1) * search.pageSize;
      return { items: results.slice(start, start + search.pageSize), total: results.length };
    },

    async getDoctor(doctorId) {
      await delay(latencyMs);
      const doctor = publicDoctor(doctorId);
      const ratingCounts: DoctorProfile['ratingCounts'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const review of reviewsOf(doctor.id)) ratingCounts[review.rating as 1 | 2 | 3 | 4 | 5] += 1;

      return {
        ...summarize(doctor),
        licenseNo: doctor.licenseNo,
        bioEn: doctor.bioEn,
        bioAr: doctor.bioAr,
        schedule: doctor.schedule.map((s) => ({ ...s })),
        ratingCounts,
        services: doctor.services.flatMap(({ serviceId, durationMinutes }) => {
          const service = db.services.find((s) => s.id === serviceId);
          if (!service) return [];
          return [{
            serviceId,
            durationMinutes: durationMinutes ?? service.defaultDurationMinutes,
            depositAmount: service.optionalDepositAmount || undefined,
            prices: branchIdsOf(doctor).flatMap((branchId) => {
              const price = priceAt(doctor, serviceId, branchId);
              return price === null ? [] : [{ branchId, price }];
            }),
          }];
        }),
      };
    },

    async getSlots(doctorId, { branchId, from, days }) {
      await delay(latencyMs);
      return slotsOf(publicDoctor(doctorId), from ?? todayIn(timeZoneOf(db, branchId), now()), days, branchId);
    },

    async listReviews(doctorId, { page, pageSize, rating }) {
      await delay(latencyMs);
      publicDoctor(doctorId);
      const reviews = reviewsOf(doctorId)
        .filter((r) => rating === undefined || r.rating === rating)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const start = (page - 1) * pageSize;
      const items = reviews
        .slice(start, start + pageSize)
        .map((r) => ({ id: r.id, authorName: r.authorName, rating: r.rating, comment: r.comment, createdAt: r.createdAt }));
      return { items, total: reviews.length };
    },

    async listBranchServices(branchId) {
      await delay(latencyMs);
      const atBranch = db.doctors.filter((d) => d.isPublic && branchIdsOf(d).includes(branchId));
      return db.services.flatMap((service): BranchService[] => {
        const offering = atBranch.filter((d) => d.services.some((s) => s.serviceId === service.id));
        const prices = offering.map((d) => priceAt(d, service.id, branchId)).filter((p) => p !== null);
        return prices.length ? [{ ...service, fromPrice: Math.min(...prices), doctorCount: offering.length }] : [];
      });
    },
  };
}
