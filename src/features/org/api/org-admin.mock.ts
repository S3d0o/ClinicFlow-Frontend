import { requirePermission, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { delay } from '@/mocks/db';
import { ServiceError } from '@/shared/api/service-error';
import { todayIn } from '@/shared/lib/branch-time';
import { holidayCovers, hoursProblem } from '../model/branch-admin';
import type { BranchAdminService, OrganizationService } from './org-admin.service';

const UPCOMING = ['Pending', 'Confirmed'];

export function createMockBranchAdminService(deps: AuthMockDeps): BranchAdminService {
  const { db, latencyMs, now } = deps;
  const manage = () => requirePermission(deps, 'branches.manage');

  const branch = (branchId: string) => {
    const found = db.branches.find((b) => b.id === branchId);
    if (!found) throw new ServiceError('Branch.NotFound');
    return found;
  };

  const uniqueCode = (code: string, exceptId?: string) => {
    if (db.branches.some((b) => b.code === code && b.id !== exceptId)) throw new ServiceError('Branch.CodeTaken');
  };

  return {
    async list() {
      await delay(latencyMs);
      manage();
      return db.branches.map((b) => ({ ...b }));
    },

    async create(input) {
      await delay(latencyMs);
      manage();
      uniqueCode(input.code);
      const created = { ...input, id: `br-${crypto.randomUUID().slice(0, 8)}`, isActive: true };
      db.branches.push(created);
      // A new branch opens with the clinic's usual week until it is changed
      db.branchHours.push({ branchId: created.id, days: structuredClone(db.branchHours[0]?.days ?? []) });
      return { ...created };
    },

    async update(branchId, input) {
      await delay(latencyMs);
      manage();
      const found = branch(branchId);
      uniqueCode(input.code, branchId);
      Object.assign(found, input);
      return { ...found };
    },

    async setActive(branchId, active) {
      await delay(latencyMs);
      manage();
      const found = branch(branchId);
      if (!active && db.branches.filter((b) => b.isActive).length === 1) throw new ServiceError('Branch.LastActive');
      found.isActive = active;
      return { ...found };
    },

    async getHours(branchId) {
      await delay(latencyMs);
      manage();
      branch(branchId);
      return structuredClone(db.branchHours.find((h) => h.branchId === branchId)?.days ?? []);
    },

    async setHours(branchId, hours) {
      await delay(latencyMs);
      manage();
      branch(branchId);
      if (hours.some((day) => hoursProblem(day))) throw new ServiceError('Branch.InvalidHours');
      const record = db.branchHours.find((h) => h.branchId === branchId);
      if (record) record.days = structuredClone(hours);
      else db.branchHours.push({ branchId, days: structuredClone(hours) });
      return structuredClone(hours);
    },

    async listHolidays(branchId) {
      await delay(latencyMs);
      manage();
      return db.holidays.filter((h) => h.branchId === null || h.branchId === branchId).map((h) => ({ ...h }));
    },

    async addHoliday(input) {
      await delay(latencyMs);
      manage();
      if (input.branchId) branch(input.branchId);
      const holiday = { ...input, id: `hol-${crypto.randomUUID().slice(0, 8)}` };
      db.holidays.push(holiday);
      const today = todayIn('Africa/Cairo', now());
      const affectedAppointments = db.appointments.filter(
        (a) =>
          UPCOMING.includes(a.status) &&
          a.date >= today &&
          (holiday.branchId === null || a.branchId === holiday.branchId) &&
          holidayCovers(holiday, a.date)
      ).length;
      return { holiday: { ...holiday }, affectedAppointments };
    },

    async removeHoliday(holidayId) {
      await delay(latencyMs);
      manage();
      const index = db.holidays.findIndex((h) => h.id === holidayId);
      if (index < 0) throw new ServiceError('Holiday.NotFound');
      db.holidays.splice(index, 1);
    },

    async listRooms(branchId) {
      await delay(latencyMs);
      manage();
      branch(branchId);
      return db.rooms.filter((r) => r.branchId === branchId).map((r) => ({ ...r }));
    },

    async addRoom(branchId, input) {
      await delay(latencyMs);
      manage();
      branch(branchId);
      const room = { ...input, id: `room-${crypto.randomUUID().slice(0, 8)}`, branchId, isActive: true };
      db.rooms.push(room);
      return { ...room };
    },

    async updateRoom(roomId, input) {
      await delay(latencyMs);
      manage();
      const room = db.rooms.find((r) => r.id === roomId);
      if (!room) throw new ServiceError('Room.NotFound');
      Object.assign(room, input);
      return { ...room };
    },
  };
}

export function createMockOrganizationService(deps: AuthMockDeps): OrganizationService {
  const { db, latencyMs } = deps;
  return {
    async getProfile() {
      await delay(latencyMs);
      requirePermission(deps, 'org.settings.manage');
      return { ...db.organization };
    },

    async updateProfile(profile) {
      await delay(latencyMs);
      requirePermission(deps, 'org.settings.manage');
      db.organization = { ...profile };
      return { ...db.organization };
    },

    async getSettings() {
      await delay(latencyMs);
      return { ...db.settings };
    },

    async updateSettings(changes) {
      await delay(latencyMs);
      requirePermission(deps, 'org.settings.manage');
      db.settings = { ...db.settings, ...changes };
      return { ...db.settings };
    },
  };
}
