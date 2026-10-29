import { describe, expect, it } from 'vitest';
import { isServiceError } from '@/shared/api/service-error';
import { createTestBackend } from '@/test/mock-backend';

describe('mock entitlements service', () => {
  it('starts the demo clinic on the Full plan with recruitment added, and the chatbot off', async () => {
    const { services } = createTestBackend();
    const modules = await services.entitlements.getEnabledModules();
    expect(modules).toEqual(expect.arrayContaining(['ORG', 'APT', 'FD', 'BIL', 'EMR', 'INS', 'PAT', 'RPT', 'REC']));
    expect(modules).not.toContain('BOT');
  });

  it('shows the subscription with its usage to an admin only', async () => {
    const { services } = createTestBackend({ signedInAs: 'u-karim' });
    const subscription = await services.entitlements.getSubscription();
    expect(subscription.planCode).toBe('Full');
    expect(subscription.usage).toEqual(
      expect.arrayContaining([
        { key: 'branches', included: 3, used: 3 },
        { key: 'phoneMessagesPerMonth', included: 2500, used: 1240 },
      ])
    );

    const desk = createTestBackend({ signedInAs: 'u-mona' });
    await expect(desk.services.entitlements.getSubscription()).rejects.toSatisfy((e) => isServiceError(e, 'Access.OutOfScope'));
  });

  it('lists the three example plans', async () => {
    const { services } = createTestBackend();
    expect((await services.entitlements.listPlans()).map((p) => p.code)).toEqual(['Starter', 'Clinic', 'Full']);
  });
});

describe('mock demo platform service', () => {
  it('changes the plan, keeping extras the new plan lacks and dropping ones it includes', async () => {
    const { services, db } = createTestBackend();
    await services.demoPlatform!.setModule('BOT', true);
    await services.demoPlatform!.setPlan('Starter');

    const modules = await services.entitlements.getEnabledModules();
    expect(modules).not.toContain('BIL');
    expect(modules).toEqual(expect.arrayContaining(['REC', 'BOT', 'PAT']));

    await services.demoPlatform!.setPlan('Full');
    await services.demoPlatform!.setModule('PAT', true);
    expect(db.subscription.overrides.map((o) => o.module).sort()).toEqual(['BOT', 'REC']);
  });

  it('adds an add-on with what it needs, and refuses to switch off a needed one', async () => {
    const { services } = createTestBackend();
    await services.demoPlatform!.setPlan('Clinic');
    await services.demoPlatform!.setModule('INS', true);
    expect(await services.entitlements.getEnabledModules()).toEqual(expect.arrayContaining(['INS', 'EMR', 'BIL']));

    await expect(services.demoPlatform!.setModule('BIL', false)).rejects.toSatisfy((e) => isServiceError(e, 'Subscription.ModuleRequired'));
    await services.demoPlatform!.setModule('INS', false);
    expect(await services.entitlements.getEnabledModules()).not.toContain('INS');
  });
});
