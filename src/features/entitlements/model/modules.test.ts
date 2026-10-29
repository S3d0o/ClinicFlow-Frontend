import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@/features/auth/model/permissions';
import { at, makeUser, org } from '@/test/fixtures';
import { ADD_ON_MODULES, CORE_MODULES, PERMISSION_MODULE, effectiveModules, requiredBy, withModules } from './modules';

describe('effectiveModules', () => {
  it('always includes the core, plus the plan’s add-ons', () => {
    const modules = effectiveModules(['FD', 'BIL']);
    expect([...CORE_MODULES].every((m) => modules.has(m))).toBe(true);
    expect(modules.has('FD') && modules.has('BIL')).toBe(true);
    expect(modules.has('EMR')).toBe(false);
  });

  it('applies extras and add-ons switched off', () => {
    const modules = effectiveModules(['FD', 'BIL'], [
      { module: 'REC', enabled: true },
      { module: 'FD', enabled: false },
    ]);
    expect(modules.has('REC')).toBe(true);
    expect(modules.has('FD')).toBe(false);
  });

  it('switches on what an enabled add-on needs', () => {
    const modules = effectiveModules([], [{ module: 'INS', enabled: true }, { module: 'BOT', enabled: true }]);
    expect(['INS', 'BIL', 'EMR', 'BOT', 'PAT'].every((m) => modules.has(m as never))).toBe(true);
  });
});

describe('requiredBy', () => {
  it('names the enabled add-ons that need a module', () => {
    expect(requiredBy('BIL', effectiveModules(['INS']))).toEqual(['INS']);
    expect(requiredBy('BIL', effectiveModules(['BIL']))).toEqual([]);
  });
});

describe('PERMISSION_MODULE', () => {
  it('puts every permission in a known module', () => {
    const known = new Set<string>([...CORE_MODULES, ...ADD_ON_MODULES]);
    expect(PERMISSIONS.filter((p) => !known.has(PERMISSION_MODULE[p]))).toEqual([]);
  });
});

describe('withModules', () => {
  it("drops the grants of disabled modules and keeps the rest", () => {
    const doctor = makeUser([at('Doctor', 'br-nc')]);
    const seen = withModules(doctor, effectiveModules(['FD']));
    expect(seen.permissions.some((g) => g.permission === 'encounters.write')).toBe(false);
    expect(seen.permissions.some((g) => g.permission === 'leave.request')).toBe(true);
  });

  it('returns the same user when nothing is dropped', () => {
    const admin = makeUser([org('Admin')]);
    expect(withModules(admin, effectiveModules([...ADD_ON_MODULES]))).toBe(admin);
  });
});
