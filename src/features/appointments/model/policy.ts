/**
 * Patients may cancel or reschedule online until this long before the visit (FR-ORG-05 default,
 * V1's 2 hours). The API sends each appointment's own `changeableUntil`; this is only for wording
 * before an appointment exists (the booking terms).
 */
export const CHANGE_WINDOW_HOURS = 2;
