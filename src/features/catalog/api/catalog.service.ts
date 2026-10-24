import type { Service, Specialty } from '../model/catalog';

/** Public reference data: specialties and services (`/api/v2/public/specialties`, `/public/services`). */
export interface CatalogService {
  listSpecialties(): Promise<Specialty[]>;
  /** Active services only. */
  listServices(): Promise<Service[]>;
}
