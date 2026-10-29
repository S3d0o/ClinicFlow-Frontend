import { requirePermission, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay } from '@/mocks/db';
import { ServiceError } from '@/shared/api/service-error';
import type { Bilingual } from '@/shared/i18n/bilingual';
import type { SpecialtyAdminService } from './catalog.service';

export function createMockSpecialtyAdminService(deps: AuthMockDeps): SpecialtyAdminService {
  const { db, latencyMs } = deps;

  const clean = ({ nameEn, nameAr }: Bilingual): Bilingual => ({ nameEn: nameEn.trim(), nameAr: nameAr.trim() });
  const checkUnique = ({ nameEn, nameAr }: Bilingual, exceptId?: string) => {
    const taken = db.specialties.some(
      (s) => s.id !== exceptId && (s.nameEn.toLowerCase() === nameEn.toLowerCase() || s.nameAr === nameAr)
    );
    if (taken) throw new ServiceError('Specialty.NameTaken');
  };

  return {
    async create(names) {
      await delay(latencyMs);
      requirePermission(deps, 'specialties.manage');
      const value = clean(names);
      checkUnique(value);
      const specialty = { id: `sp-${crypto.randomUUID().slice(0, 8)}`, ...value };
      db.specialties.push(specialty);
      return { ...specialty };
    },

    async update(specialtyId, names) {
      await delay(latencyMs);
      requirePermission(deps, 'specialties.manage');
      const specialty = db.specialties.find((s) => s.id === specialtyId);
      if (!specialty) throw new ServiceError('Specialty.NotFound');
      const value = clean(names);
      checkUnique(value, specialtyId);
      Object.assign(specialty, value);
      return { ...specialty };
    },
  };
}
