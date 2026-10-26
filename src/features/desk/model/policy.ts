// Front desk settings with their documented defaults. They become organization settings (FR-ORG-05)
// once the admin settings screen exists (phase 6).

/** Check-in opens this long before the slot and stays open to the end of the day (FR-FD-03). */
export const CHECK_IN_OPENS_MINUTES = 60;

/** A visit can be marked a no-show this long after it starts (FR-APT-07). */
export const NO_SHOW_GRACE_MINUTES = 15;

/** Unslotted walk-ins a doctor takes per day (FR-APT-04). */
export const WALK_IN_CAP = 5;
