/** Window event dispatched after notifications are marked read, so the Navbar bell refreshes. */
export const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed';

export function notifyNotificationsChanged() {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
}
