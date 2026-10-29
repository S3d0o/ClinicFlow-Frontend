import type { AddOnModule, ModuleCode } from '../model/modules';

export type PlanCode = 'Starter' | 'Clinic' | 'Full';

/** What a plan includes and how much of it (ADR 0008 decision 5). */
export interface PlanLimits {
  branches: number;
  doctors: number;
  /** WhatsApp (or SMS) messages to patients per month; verification codes don't count. */
  phoneMessagesPerMonth: number;
}

/** A plan the platform offers. Prices aren't shown until they are set (ADR 0008 Q19). */
export interface Plan {
  code: PlanCode;
  /** The add-ons it includes; the core modules come with every plan. */
  modules: AddOnModule[];
  limits: PlanLimits;
}

export type SubscriptionStatus = 'Trial' | 'Active' | 'PastDue' | 'Lapsed';

export interface LimitUsage {
  key: keyof PlanLimits;
  included: number;
  used: number;
}

/** The clinic's subscription, as the admin sees it (`GET /api/v2/organization/entitlements`, ADR 0008 decision 12). */
export interface Subscription {
  planCode: PlanCode;
  status: SubscriptionStatus;
  /** UTC, when the current period ends. */
  currentPeriodEnd: string;
  /** Every module that is on, core included, after the plan's add-ons, extras and dependencies. */
  modules: ModuleCode[];
  /** Add-ons switched on or off for this clinic beyond its plan. */
  overrides: { module: AddOnModule; enabled: boolean }[];
  usage: LimitUsage[];
}

/** The clinic's plan and modules (port). */
export interface EntitlementsService {
  /** The modules that are on. Public: menus and pages follow them for everyone, signed in or not. */
  getEnabledModules(): Promise<ModuleCode[]>;
  /** Plan, extras, limits and usage (`org.settings.manage`). */
  getSubscription(): Promise<Subscription>;
  /** The plans the platform offers, to compare. */
  listPlans(): Promise<Plan[]>;
}

/**
 * Demo-only: the platform operator's switches (ADR 0008 decision 17, the operator console comes in
 * release R4), so a presentation can change the clinic's plan live.
 */
export interface DemoPlatformService {
  setPlan(code: PlanCode): Promise<void>;
  /** Switches an add-on on or off beyond the plan. Refused while an enabled add-on needs it. */
  setModule(module: AddOnModule, enabled: boolean): Promise<void>;
}
