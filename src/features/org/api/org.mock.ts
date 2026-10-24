import { delay, type MockDb } from '@/mocks/db';
import type { OrgService } from './org.service';

export function createMockOrgService({ db, latencyMs }: { db: MockDb; latencyMs: number }): OrgService {
  return {
    async listBranches() {
      await delay(latencyMs);
      return db.branches.filter((b) => b.isActive).map((b) => ({ ...b }));
    },
  };
}
