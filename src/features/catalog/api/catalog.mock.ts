import { delay, type MockDeps } from '@/mocks/db';
import type { CatalogService } from './catalog.service';

export function createMockCatalogService({ db, latencyMs }: MockDeps): CatalogService {
  return {
    async listSpecialties() {
      await delay(latencyMs);
      return db.specialties.map((s) => ({ ...s }));
    },
    async listServices() {
      await delay(latencyMs);
      return db.services.map((s) => ({ ...s }));
    },
  };
}
