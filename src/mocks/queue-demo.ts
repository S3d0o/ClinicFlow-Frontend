import { doctorForUser } from './clinical';
import type { MockDeps } from './db';
import type { MockSessionStore } from './session-store';
import { moveToStage, queueRecords } from './front-desk';

/** A consultation lasts this many ticks in the demo. */
const CONSULT_TICKS = 3;

/**
 * Makes the demo clinic move while nobody plays the doctor: every `queueTickMs`, each doctor finishes a
 * consultation that has run long enough, or calls the next patient who is ready. The signed-in doctor's
 * patients are left to them. Triage, check-in and payment stay with the people using the app.
 * Returns a stop function; does nothing when `queueTickMs` is 0 (tests).
 */
export function startQueueDemo({ db, now, queueTickMs, session }: Pick<MockDeps, 'db' | 'now' | 'queueTickMs'> & { session: MockSessionStore }): () => void {
  if (queueTickMs <= 0) return () => {};
  // Consultations already running in the sample data count from when the demo started
  const startedAt = now().getTime();

  const tick = () => {
    for (const branch of db.branches) {
      const records = queueRecords(db, branch.id, now());
      const playing = doctorForUser(db, session.get() ?? '')?.id;
      for (const doctorId of new Set(records.map((a) => a.doctorId))) {
        if (doctorId === playing) continue;
        const mine = records.filter((a) => a.doctorId === doctorId);
        const inRoom = mine.find((a) => a.queue!.stage === 'WithDoctor');
        if (inRoom) {
          const elapsed = now().getTime() - Math.max(startedAt, Date.parse(inRoom.calledAt ?? now().toISOString()));
          if (elapsed >= CONSULT_TICKS * queueTickMs) moveToStage(db, inRoom, 'Done', now());
          continue;
        }
        const next = mine.filter((a) => a.queue!.stage === 'ReadyForDoctor').sort((a, b) => a.queue!.position - b.queue!.position)[0];
        if (next) moveToStage(db, next, 'WithDoctor', now());
      }
    }
  };

  const timer = setInterval(tick, queueTickMs);
  return () => clearInterval(timer);
}
