import type { Bilingual } from '@/shared/i18n/bilingual';
import type { Service, Specialty } from '../model/catalog';

/** Public reference data: specialties and services (`/api/v2/public/specialties`, `/public/services`). */
export interface CatalogService {
  listSpecialties(): Promise<Specialty[]>;
  /** Active services only. */
  listServices(): Promise<Service[]>;
}

/** Managing the specialty catalog (port; `/api/v2/specialties`, `specialties.manage`). Names are unique in each language. */
export interface SpecialtyAdminService {
  create(names: Bilingual): Promise<Specialty>;
  update(specialtyId: string, names: Bilingual): Promise<Specialty>;
}
