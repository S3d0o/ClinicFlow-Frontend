import type { Plan, PlanCode, SubscriptionStatus } from '@/features/entitlements/api/entitlements.service';
import type { AddOnModule } from '@/features/entitlements/model/modules';

/** The example plans of ADR 0008 ("Initial packaging"): a model to test, not final tiers or prices. */
export const plansSeed: Plan[] = [
  { code: 'Starter', modules: [], limits: { branches: 1, doctors: 2, phoneMessagesPerMonth: 300 } },
  { code: 'Clinic', modules: ['FD', 'BIL', 'PAT', 'RPT'], limits: { branches: 1, doctors: 5, phoneMessagesPerMonth: 1000 } },
  { code: 'Full', modules: ['FD', 'BIL', 'PAT', 'RPT', 'EMR', 'INS'], limits: { branches: 3, doctors: 15, phoneMessagesPerMonth: 2500 } },
];

export interface SubscriptionRecord {
  planCode: PlanCode;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  overrides: { module: AddOnModule; enabled: boolean }[];
  /** Phone messages sent this month (the platform's meter). */
  phoneMessagesThisMonth: number;
}

/**
 * The preview shows every screen, so the demo clinic is on the Full plan with recruitment added.
 * The chatbot (BOT) stays off: it has no screens yet.
 */
export function subscriptionSeed(now: Date): SubscriptionRecord {
  return {
    planCode: 'Full',
    status: 'Active',
    currentPeriodEnd: new Date(now.getTime() + 18 * 24 * 3_600_000).toISOString(),
    overrides: [{ module: 'REC', enabled: true }],
    phoneMessagesThisMonth: 1240,
  };
}
