import type { Slot } from './doctor';

export const doctorPath = (doctorId: string) => `/doctors/${doctorId}`;

/** The profile, opened with this slot already picked in the booking card. */
export const slotPath = (slot: Pick<Slot, 'id' | 'doctorId' | 'branchId'>) =>
  `${doctorPath(slot.doctorId)}?branch=${slot.branchId}&slot=${encodeURIComponent(slot.id)}`;

/** Phase 2's booking screen, with the choices made on the profile. */
export const bookingPath = (doctorId: string, choice: { branchId: string; serviceId: string; slotId: string; deposit: boolean }) => {
  const params = new URLSearchParams({ branch: choice.branchId, service: choice.serviceId, slot: choice.slotId });
  if (choice.deposit) params.set('deposit', '1');
  return `/patient/book/${doctorId}?${params}`;
};
