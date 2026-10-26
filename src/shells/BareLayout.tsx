import { ScreenOutlet } from './ScreenOutlet';

/** Full-screen pages without app chrome: the waiting-room TV and the reminder link. */
export function BareLayout() {
  return <ScreenOutlet className="min-h-screen" />;
}
