import { delay, type MockDeps } from '@/mocks/db';
import type { OrgService } from './org.service';

export function createMockOrgService({ db, latencyMs }: MockDeps): OrgService {
  return {
    async listBranches() {
      await delay(latencyMs);
      return db.branches.filter((b) => b.isActive).map((b) => ({ ...b }));
    },
  };
}
