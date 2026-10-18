import { describe, expect, it } from 'vitest';
import { homeByRole, postLoginPath } from './navigation';

describe('postLoginPath', () => {
  it('sends each role home when there is no requested page', () => {
    expect(postLoginPath('Patient')).toBe(homeByRole.Patient);
    expect(postLoginPath('Doctor')).toBe(homeByRole.Doctor);
    expect(postLoginPath('Admin')).toBe(homeByRole.Admin);
  });

  it('returns to a page the role can open', () => {
    expect(postLoginPath('Patient', '/patient/book/7')).toBe('/patient/book/7');
    expect(postLoginPath('Doctor', '/doctor/schedules')).toBe('/doctor/schedules');
  });

  it('returns to pages any signed-in user can open', () => {
    expect(postLoginPath('Admin', '/notifications')).toBe('/notifications');
    expect(postLoginPath('Patient', '/doctors/3')).toBe('/doctors/3');
  });

  it("sends a user who asked for another role's page to their own home", () => {
    expect(postLoginPath('Patient', '/admin/dashboard')).toBe('/patient/appointments');
    expect(postLoginPath('Doctor', '/patient/appointments')).toBe('/doctor/dashboard');
    expect(postLoginPath('Admin', '/doctor/profile')).toBe('/admin/dashboard');
  });
});
