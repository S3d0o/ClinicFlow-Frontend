import { requirePermission, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay, type MockDb } from '@/mocks/db';
import { ServiceError } from '@/shared/api/service-error';
import { effectiveModules, requiredBy } from '../model/modules';
import type { DemoPlatformService, EntitlementsService } from './entitlements.service';

const planOf = (db: MockDb) => db.plans.find((p) => p.code === db.subscription.planCode)!;

const enabledIn = (db: MockDb) => effectiveModules(planOf(db).modules, db.subscription.overrides);

export function createMockEntitlementsService(deps: AuthMockDeps): EntitlementsService {
  const { db, latencyMs } = deps;
  return {
    async getEnabledModules() {
      await delay(latencyMs);
      return [...enabledIn(db)];
    },

    async getSubscription() {
      await delay(latencyMs);
      requirePermission(deps, 'org.settings.manage');
      const { planCode, status, currentPeriodEnd, overrides, phoneMessagesThisMonth } = db.subscription;
      const { limits } = planOf(db);
      return {
        planCode,
        status,
        currentPeriodEnd,
        modules: [...enabledIn(db)],
        overrides: overrides.map((o) => ({ ...o })),
        usage: [
          { key: 'branches', included: limits.branches, used: db.branches.filter((b) => b.isActive).length },
          { key: 'doctors', included: limits.doctors, used: db.doctors.length },
          { key: 'phoneMessagesPerMonth', included: limits.phoneMessagesPerMonth, used: phoneMessagesThisMonth },
        ],
      };
    },

    async listPlans() {
      await delay(latencyMs);
      return db.plans.map((p) => ({ ...p, modules: [...p.modules], limits: { ...p.limits } }));
    },
  };
}

export function createMockDemoPlatformService({ db, latencyMs }: AuthMockDeps): DemoPlatformService {
  return {
    async setPlan(code) {
      await delay(latencyMs);
      db.subscription.planCode = code;
      // An extra that the new plan already includes is no longer an extra
      const included = new Set(planOf(db).modules);
      db.subscription.overrides = db.subscription.overrides.filter((o) => o.enabled !== included.has(o.module));
    },

    async setModule(module, enabled) {
      await delay(latencyMs);
      if (!enabled && requiredBy(module, enabledIn(db)).length > 0) throw new ServiceError('Subscription.ModuleRequired');
      const inPlan = planOf(db).modules.includes(module);
      const others = db.subscription.overrides.filter((o) => o.module !== module);
      // Back to what the plan says needs no override
      db.subscription.overrides = enabled === inPlan ? others : [...others, { module, enabled }];
    },
  };
}
