import { requirePermission, sessionUser, type AuthMockDeps } from '@/features/auth/api/mock-accounts';
import { doctorForUser } from '@/mocks/clinical';
import { delay } from '@/mocks/db';
import { moveToStage, publishQueue, queueRecords, renumberQueue, roomOf, subscribeQueue, toQueueEntry } from '@/mocks/front-desk';
import { ServiceError } from '@/shared/api/service-error';
import type { DisplayRoom } from '../model/queue';
import type { QueueBoardService } from './queue.service';

/** Shown as the average wait before anyone has been called today. */
const DEFAULT_WAIT_MINUTES = 10;

export function createMockQueueBoardService(deps: AuthMockDeps): QueueBoardService {
  const { db, latencyMs, now } = deps;

  const find = (appointmentId: string) => {
    const record = db.appointments.find((a) => a.id === appointmentId);
    if (!record?.queue) throw new ServiceError('Appointment.NotFound');
    return record;
  };

  return {
    async board(branchId) {
      await delay(latencyMs);
      requirePermission(deps, 'queue.view', branchId);
      return queueRecords(db, branchId, now()).map((record) => toQueueEntry(db, record));
    },

    async display(branchId) {
      await delay(latencyMs);
      requirePermission(deps, 'queue.view', branchId);
      const records = queueRecords(db, branchId, now());
      const rooms: DisplayRoom[] = [...new Set(records.map((a) => a.doctorId))].map((doctorId) => {
        const mine = records.filter((a) => a.doctorId === doctorId);
        const byPosition = (stage: string) =>
          mine.filter((a) => a.queue!.stage === stage).sort((a, b) => a.queue!.position - b.queue!.position);
        const waiting = [...byPosition('ReadyForDoctor'), ...byPosition('WaitingTriage')];
        const waits = mine
          .filter((a) => a.calledAt && a.checkedInAt)
          .map((a) => (Date.parse(a.calledAt!) - Date.parse(a.checkedInAt!)) / 60_000);
        return {
          doctorId,
          doctorName: mine[0].doctorName,
          specialtyId: mine[0].specialtyId,
          room: roomOf(db, doctorId, branchId),
          nowServing: mine.find((a) => a.queue!.stage === 'WithDoctor')?.queue!.ticketNo,
          next: waiting.slice(0, 2).map((a) => a.queue!.ticketNo),
          waitingCount: waiting.length,
          averageWaitMinutes: waits.length ? Math.round(waits.reduce((s, w) => s + w, 0) / waits.length) : DEFAULT_WAIT_MINUTES,
        };
      });
      rooms.sort((a, b) => (a.room?.nameEn ?? '').localeCompare(b.room?.nameEn ?? ''));
      return { branchId, rooms, updatedAt: now().toISOString() };
    },

    async call(appointmentId) {
      await delay(latencyMs);
      const record = find(appointmentId);
      // `queue.manage` at the branch, or the visit's own doctor (§13.17)
      if (doctorForUser(db, sessionUser(deps).id)?.id !== record.doctorId) requirePermission(deps, 'queue.manage', record.branchId);
      if (record.queue!.stage !== 'ReadyForDoctor') throw new ServiceError('Appointment.InvalidStatusTransition');
      // One patient in the room at a time (05 §4.1 guard)
      const busy = queueRecords(db, record.branchId, now()).some((a) => a.doctorId === record.doctorId && a.queue!.stage === 'WithDoctor');
      if (busy) throw new ServiceError('Appointment.DoctorBusy');
      moveToStage(db, record, 'WithDoctor', now());
      return toQueueEntry(db, record);
    },

    async moveToFront(appointmentId, reason) {
      await delay(latencyMs);
      const record = find(appointmentId);
      requirePermission(deps, 'queue.manage', record.branchId);
      const stage = record.queue!.stage;
      if (stage !== 'WaitingTriage' && stage !== 'ReadyForDoctor') throw new ServiceError('Appointment.InvalidStatusTransition');
      if (!reason.trim()) throw new ServiceError('Queue.ReasonRequired');
      // The reason goes to the audit trail with the reorder (FR-FD-05)
      record.priorityReason = reason.trim();
      record.queue!.position = 0;
      renumberQueue(db, record.branchId, now());
      publishQueue(db, record.branchId);
      return toQueueEntry(db, record);
    },

    subscribe(branchId, listener) {
      return subscribeQueue(db, (changed) => {
        if (changed === branchId) listener();
      });
    },
  };
}
